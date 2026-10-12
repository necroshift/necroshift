# Necroshift Self-Heal Pipeline — design spec

Sub-project 3 on the `CLAUDE.md` roadmap (NEC-6). Resolves the open
questions left in `docs/features/SELF_HEAL.md`.

## Decisions made with the user before implementation

These two were explicitly checked rather than decided unilaterally,
given the risk profile (real code execution, real repo access, real
PRs):

1. **Scope for this pass: fully live.** Real sandbox, real repo clone
   (via the user's GitHub OAuth token), real PR opened against the
   real repo. Gated behind a **manual trigger only** — no
   crash-triggered automatic runs yet.
2. **Sandbox isolation: a dedicated `sandbox-runner` service**, not
   Docker-outside-of-Docker from the `web` container. The `web`
   container never touches the Docker socket. `sandbox-runner` is a
   separate compose service that owns the socket and exposes one
   internal endpoint to start a run; `web` only talks to it over the
   compose network.

## Architecture

```
web (Next.js)                 sandbox-runner (new, small Node service)
  │ POST /runs {runId}  ─────────▶  docker run --rm necroshift-sandbox
  │                                   (ephemeral container)
  │                                        │
  │                                        ▼
  │                              clone repo → draft fix → run tests →
  │                              push branch → open PR
  │                                        │
  │  ◀── progress/result written directly to Postgres (self_heal_run /
  │      self_heal_step), same pattern as ingestion events — the UI
  │      polls the DB, it doesn't talk to the sandbox directly.
```

`sandbox-runner` itself does almost nothing beyond: validate the
request, resolve the run's secrets (GitHub token, LLM key — decrypted
once, passed into the container as env vars, never written to disk
outside it), `docker run` the `necroshift-sandbox` image with a
timeout and resource limits, and exit. All the actual work (git, LLM
calls, tests, PR) happens inside the ephemeral sandbox container,
which talks to Postgres directly to report its own progress.

### New compose service

`docker-compose.yml` gains `sandbox-runner`, built from
`apps/sandbox-runner/Dockerfile`, with `/var/run/docker.sock` mounted
read-write (the one place in the whole deployment that touches it) and
`DATABASE_URL` so it can hand it through to sandboxes.

### Sandbox image

`apps/sandbox-runner/sandbox/Dockerfile` — node:22-slim + git. Its
entrypoint (`run.ts`, bundled) does the actual pipeline. Launched with
`--rm`, `--network necroshift_default` (so it can reach Postgres),
`--memory=1g`, `--cpus=1`, and `sandbox-runner` kills it if it runs
past a hard timeout (15 min).

### Schema (`packages/db`)

- `project.repoUrl` (text, nullable) — new column. Self-heal can't
  clone a repo the project hasn't declared. Set from Settings →
  Projects.
- `self_heal_run`: id, issueId, status
  (`pending|investigating|cloning|developing|testing|opening_pr|done|failed`),
  summary (text, nullable — the agent's own description of what it
  did), prUrl (text, nullable), errorMessage (text, nullable),
  startedAt, finishedAt.
- `self_heal_step`: id, runId, name
  (`investigate|clone|develop|test|open_pr`), status
  (`pending|active|done|failed`), detail (text, nullable),
  startedAt, finishedAt. One row per step, seeded as `pending` when
  the run is created — this is what the stepper UI
  (`SelfHealRun.dc.html`) renders directly.

### Flow

1. **Trigger** (resolved: manual only for v1). A "Start self-heal"
   button on the issue detail page, enabled only when the project has
   `repoUrl` set, an LLM provider key is configured, and the signed-in
   user has a linked GitHub account. One run at a time per issue — a
   second click while a run is `pending`/in-progress is a no-op.
2. **Server action** (`startSelfHealRun`) creates the `self_heal_run`
   + 5 pending `self_heal_step` rows, resolves + decrypts the GitHub
   token (`better-auth/crypto`'s `symmetricDecrypt`, the same function
   better-auth uses internally — a public subpath export, not a
   reimplementation) and the org's LLM key, and POSTs
   `{ runId, repoUrl, githubToken, llmProvider, llmApiKey, issueTitle,
   latestOccurrence }` to `sandbox-runner`. The web app never writes
   these secrets anywhere other than this one outbound request body.
3. **Sandbox container**:
   - *Investigate*: already has the issue title + latest crash
     payload passed in (no extra DB access needed — keeps the
     sandbox's Postgres grant limited to progress-reporting only).
   - *Clone*: `git clone` with the token injected into the URL,
     checks out `necroshift/fix-<issue-id-prefix>`.
   - *Develop*: one LLM call (the project's configured provider) given
     the issue + crash payload + a repo file listing, asking it to
     return a unified diff. Applied with `git apply`. **v1
     simplification, stated explicitly**: this is a single-shot patch
     generation, not a multi-turn autonomous coding agent loop (no
     tool use, no iterative exploration) — the real coding-agent loop
     is a meaningfully bigger scope and is logged as a known v1
     limitation, not silently glossed over.
   - *Test*: if `package.json` declares a `test` script, run it. If it
     fails, the run stops here as `failed` with the diff preserved in
     `summary` for visibility — **no PR is opened for an unverified
     fix that fails its own test suite**. If no test script exists,
     proceed but say so plainly in both the step detail and the PR
     body ("no test suite detected — this fix has not been verified
     by tests").
   - *Open PR*: push the branch, open a PR via the GitHub REST API
     (plain `fetch`, no new dependency) with a body that always states
     it's an automated Necroshift fix for human review, links back to
     the issue, and includes the agent's summary.
   - Any failure at any step: that step → `failed` with `detail` set
     to the error, run → `failed`, remaining steps stay `pending`
     (not silently marked done). Never partially pushes a broken
     branch without saying so in the run's `errorMessage`.
4. **UI**: `/issues/[id]/self-heal/[runId]` — the stepper from
   `SelfHealRun.dc.html`, polling via TanStack Query
   (`refetchInterval`, same pattern as onboarding's step-4 polling),
   the agent summary once present, and the PR link once opened.

### Safety / cost guardrails (resolves that open question explicitly)

- Manual trigger only; one run per issue at a time.
- Hard per-run timeout (15 min) enforced by `sandbox-runner`, plus
  container resource limits (`--memory`, `--cpus`).
- A failing test suite blocks PR creation — the pipeline never opens a
  PR it can't claim passed its own tests (or honestly discloses that
  none exist).
- Secrets (GitHub token, LLM key) are decrypted once per run, passed
  as env vars into one ephemeral `--rm` container, never persisted
  inside it or logged.
- `sandbox-runner` holds the only Docker socket access in the whole
  deployment — a compromise of the `web` container alone can't launch
  arbitrary containers on the host.

## Out of scope for this pass

- Automatic triggering on crash/issue creation (manual only, see
  above).
- Multi-turn/tool-using coding agent loop (single-shot patch
  generation only — noted above as a real limitation, not hidden).
- Ticket-filing before PR creation (depends on NEC-7, not built yet).
- Per-organization sandbox resource quotas / concurrency limits beyond
  "one run per issue."
