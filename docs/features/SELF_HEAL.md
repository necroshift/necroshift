# Self-Heal Pipeline

**Status:** Planned (sub-project 3 on the `CLAUDE.md` roadmap)
**Will use:** the GitHub token from [AUTH](./AUTH.md), the LLM key from
[API_KEYS](./API_KEYS.md), issue context from [ISSUES](./ISSUES.md),
and (optionally) [INTEGRATIONS](./INTEGRATIONS.md)

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

## What this needs to answer (for this sub-project's own spec)

- Sandbox technology/isolation model (container? VM? what resource
  limits?).
- Exact trigger conditions (every new issue? a threshold? manual only
  for v1?).
- How much repo context the agent gets beyond the failing code path
  (full clone? targeted file access?).
- What "tested a fix" means concretely — does it require passing an
  existing test suite, writing new tests, both?
- Failure handling: what happens if the agent can't produce a fix at
  all (no PR, a comment on the issue, a notification)?
- Cost/safety guardrails: can this loop, spawn unbounded LLM calls, or
  touch anything outside the target repo?

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

## Out of scope (v1 of *this* feature, once built)

To be determined in that sub-project's own design spec.

## References

- [ISSUES](./ISSUES.md) — the trigger source.
- [AUTH](./AUTH.md) — the GitHub access this pipeline reuses.
- [API_KEYS](./API_KEYS.md) — the LLM credential this pipeline uses.
- [INTEGRATIONS](./INTEGRATIONS.md) — the optional ticket-filing step.
