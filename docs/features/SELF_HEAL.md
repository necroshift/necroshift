# Self-Heal Pipeline

**Status:** Shipped (v1) — sub-project 3 on the `CLAUDE.md` roadmap (NEC-6)
**Owns:** `apps/web/src/domains/self-heal` (trigger + progress UI) and
`apps/sandbox-runner` (the actual pipeline — clone, fix, test, PR)
**Uses:** the GitHub token from [AUTH](./AUTH.md), the LLM key from
[API_KEYS](./API_KEYS.md), issue context from [ISSUES](./ISSUES.md).
Full design: `docs/superpowers/specs/2026-10-12-necroshift-self-heal-design.md`.

## Overview

This is the product's core promise: when something breaks, Necroshift
doesn't just tell you — it investigates, writes a fix, and opens a
pull request, so a human wakes up to a reviewable PR instead of a
3am page. Everything else in the product (ingestion, issues, API
keys, GitHub auth) exists to feed this pipeline or to let a human
configure it.

## Intended flow (per `CLAUDE.md`'s problem statement and core capabilities)

1. **Trigger**: an issue in [ISSUES](./ISSUES.md) crosses whatever bar
   triggers self-heal (exact trigger rule TBD in that sub-project's
   spec — e.g. a new issue, a recurrence, a manual "investigate" action).
2. **Sandbox**: a sandbox environment is spawned to do the work in
   isolation from the production deployment.
3. **Investigate**: the sandbox scans the relevant logs and crash
   reports for that issue.
4. **Reproduce the codebase**: clones the application's repository
   (using the GitHub token from [AUTH](./AUTH.md) — the same one
   obtained via GitHub OAuth login or the onboarding "Connect GitHub"
   step, requested with `repo` scope specifically for this), checks
   out a new fix branch.
5. **Develop the fix**: using the configured LLM provider (see
   [API_KEYS](./API_KEYS.md)), develops and tests a fix on that branch.
6. **(Optional) File a ticket**: if a [INTEGRATIONS](./INTEGRATIONS.md)
   connection is configured for the project, creates a tracked
   ticket/issue *before* opening the PR, so the PR can reference it.
   If this step fails, the pipeline proceeds anyway rather than
   blocking on a broken integration (see that feature's key decisions).
7. **Open a pull request**: against the application's repository, for
   a human to review.

## v1 scope — how the open questions below were resolved

These two were checked with the user explicitly before building, given
the risk profile (real code execution, real repo access, real PRs):
**fully live** (not stubbed) but **manual trigger only**, and sandbox
isolation via a **dedicated `sandbox-runner` service** that owns the
Docker socket — the `web` app never touches it.

- **Sandbox technology**: Docker, via a dedicated `sandbox-runner`
  compose service (not Docker-outside-of-Docker from `web`). Ephemeral
  `--rm` containers, `--memory 1g --cpus 1`, 15-minute hard timeout.
- **Trigger**: manual only — a "Start self-heal" button on the issue
  detail page. No automatic triggering on crash/issue creation yet.
- **Repo context**: a git file listing, plus the content of any file
  the crash text actually references (best-effort path matching) — not
  a full tool-use/exploration loop.
- **"Tested a fix"**: if the project has a `package.json` `test`
  script, it must pass — a failing suite blocks PR creation entirely.
  No test script detected proceeds, but says so plainly in the step
  detail and the PR body.
- **Failure handling**: every step reports its own status
  (`self_heal_step`); a failure at any step marks the run `failed`
  with the error recorded, remaining steps stay `pending` (never
  silently marked done). No PR is opened on failure.
- **Cost/safety guardrails**: manual trigger + one run per issue at a
  time + hard timeout + container resource limits + secrets passed via
  a `0600` temp env-file (never `-e`, which leaks to `ps`) + a
  dedicated low-privilege service holding the only Docker socket access
  in the deployment.
- **Fix generation**: a single LLM call per run (not a multi-turn
  coding-agent loop) — a real v1 simplification, stated here rather
  than hidden.

## Key decisions already made (from the roadmap)

- **GitHub access is reused from login**, not a separately pasted PAT
  (see [AUTH](./AUTH.md)) — the whole reason that OAuth scope exists.
- **LLM provider is user-supplied**, not a Necroshift-hosted service
  (see [API_KEYS](./API_KEYS.md)) — consistent with the self-hosted,
  "your infrastructure, your keys" positioning in `CLAUDE.md`'s
  target-users section.
- **A fix always lands as a PR for human review**, never an
  auto-merge — the product is an on-call engineer that *proposes*
  fixes, not one with unsupervised write access to production code.

## Out of scope (v1)

Automatic triggering, multi-turn/tool-using coding-agent loop (one
LLM call per run only), per-organization concurrency/resource quotas
beyond "one run per issue."

**Update (NEC-7):** ticket-filing before PR creation is now wired —
see [INTEGRATIONS](./INTEGRATIONS.md). It's an optional `file_ticket`
step, only present for runs where a project has a routing target
configured; failure there never blocks the PR.

## Known limitation

Never exercised against a real GitHub repo end-to-end in the dev
environment used to build it — no registered GitHub OAuth App exists
there yet (`GITHUB_CLIENT_ID`/`SECRET` are placeholders), so no real
GitHub account can be linked to try a real clone/PR. Everything up to
that boundary (guard logic, run/step orchestration, the sandbox's
git/test-running/progress-reporting mechanics) is tested against real
Postgres and a real local git repo — see `apps/sandbox-runner`'s
tests and its README.

## References

- [ISSUES](./ISSUES.md) — the trigger source.
- [AUTH](./AUTH.md) — the GitHub access this pipeline reuses.
- [API_KEYS](./API_KEYS.md) — the LLM credential this pipeline uses.
- [INTEGRATIONS](./INTEGRATIONS.md) — the optional ticket-filing step.
