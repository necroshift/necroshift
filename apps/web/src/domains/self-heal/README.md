# Self-heal domain (NEC-6)

Owns `self_heal_run` / `self_heal_step`, and the web side of triggering
and displaying a self-heal run. The pipeline itself (cloning, LLM call,
tests, PR) runs in `apps/sandbox-runner` — this domain only triggers it
and reads its progress back from Postgres.

Full design: `docs/superpowers/specs/2026-10-12-necroshift-self-heal-design.md`.

## v1 scope, resolved with the user before building

- **Manual trigger only** — a button on the issue detail page. No
  automatic triggering on crash/issue creation yet.
- **Real sandbox, real repo, real PR** — not a stub. But isolated
  behind a dedicated `sandbox-runner` service that owns the Docker
  socket, so the `web` app itself never touches it.
- **Single-shot fix generation** — one LLM call per run, not a
  multi-turn coding-agent loop. Documented limitation, not hidden.
- **A failing test suite blocks PR creation**; no test suite detected
  proceeds but says so plainly, both in the step detail and the PR body.

## How it works

- `resolve-issue-context.ts`: issue title + project's `repoUrl` +
  latest crash payload — everything a run needs, resolved once.
- `resolve-llm-credential.ts`: decrypts the org's configured provider
  key (Anthropic preferred over OpenAI when both exist — arbitrary,
  documented tie-break).
- `actions.ts`:
  - `getSelfHealGuard` / `computeSelfHealGuard` — "can this issue start
    a run?" (repo set, GitHub connected, LLM key present). Split in
    two so the guard logic is unit-testable without a Next.js request
    context (`requireSession`'s `headers()` call needs one).
  - `startSelfHealRun` — creates the run + 5 pending steps, resolves
    secrets (GitHub token via `../auth/github-token.ts`, LLM key), and
    POSTs them once to `sandbox-runner`. Never touches them again.
  - `getLatestSelfHealRun` — read-only, polled by the UI.
- `self-heal-card.tsx` (on the issue detail page) / `self-heal-run-view.tsx`
  + `self-heal-stepper.tsx` (`/issues/[id]/self-heal`) — TanStack Query,
  `refetchInterval` while a run is still in progress (same polling
  pattern as onboarding's step-4 "wait for first event").

## Known limitation

This was never exercised against a **real** GitHub repo end-to-end in
this environment: the dev deployment's `GITHUB_CLIENT_ID`/`SECRET` are
placeholders (no registered OAuth App), so no real GitHub account can
be linked here yet, and `getGithubAccessToken` has nothing to decrypt.
Everything up to that boundary — guard logic, run/step creation,
polling, the stepper UI, and the sandbox's git/test/progress-reporting
mechanics — is tested against real Postgres and a real local git repo
(see `apps/sandbox-runner`'s tests). The LLM call and the GitHub PR API
call are the two pieces that need real credentials to exercise live.
