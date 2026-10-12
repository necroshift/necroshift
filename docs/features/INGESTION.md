# Ingestion

**Status:** Shipped (Foundation)
**Owns:** `apps/web/src/domains/ingestion`
**Tables:** `log_entry`, `crash_report`, `ingestion_event`, `ingestion_key`

## Overview

Ingestion is how an application's data gets *into* Necroshift: the
HTTP API its SDK (a separate repository — see the root `CLAUDE.md`)
calls to stream logs and crash reports, and the Integration Events
view that lets a self-hosting user see every attempt, successful or
not, without reading server logs.

## User-facing flow

**The API** (what an integrator's application calls, not a UI):

```
POST /api/ingest/<project-slug>/logs
POST /api/ingest/<project-slug>/crashes
Authorization: Bearer <ingestion_key>
```

Every request is recorded as an event, whether it succeeds or not:

- Unknown project slug → `404`.
- Missing/wrong key → `401`, recorded as `invalid_key`.
- Body fails validation → `400`, recorded as `invalid_payload`.
- Success → `200`, recorded as `success`.
- Unexpected server error → `500`, recorded as `internal_error`.

**Integration Events** (Settings → API Keys → Integration Events,
`/settings/api-keys?tab=events`): a table of every attempt —
timestamp, payload type, status, error reason — filterable by project
and status. This is the answer to "why isn't my app's data showing up
here," without needing server access.

## Key decisions

- **The URL names a project by its slug**, not its internal ID — the
  same slug shown in every ingestion snippet in the UI (Dashboard
  empty state, onboarding step 4, this feature's own docs above), so
  what a user copies always works.
- **Every attempt is recorded, including successes.** This isn't an
  error log — it's a complete, capped audit trail, useful for
  confirming an integration is alive, not just diagnosing when it
  isn't.
- **Capped at 100 events per project, FIFO.** Necroshift isn't a log
  aggregator; ingestion events are for diagnosing the *pipe*, not for
  storing or searching application data long-term (that's
  [ISSUES](./ISSUES.md)'s job, downstream of `log_entry`/
  `crash_report`).
- **Recording an event can never break ingestion itself.** If writing
  the event row fails, that failure is logged server-side and
  swallowed — the application's actual request still gets its real
  response.

## Out of scope (v1)

- Log search/exploration UI over `log_entry`/`crash_report` directly —
  that's [ISSUES](./ISSUES.md).
- Rate limiting or abuse protection on the ingestion endpoints.
- Batched/bulk ingestion (one log or crash per request).
- Ingestion event retention beyond the 100-per-project cap (no
  separate long-term audit log).

## References

- [PROJECTS](./PROJECTS.md) — issues the ingestion key this API authenticates with.
- [ISSUES](./ISSUES.md) — what eventually happens to the data this API accepts.
- [ONBOARDING](./ONBOARDING.md) — step 4 is a guided first use of this API.
