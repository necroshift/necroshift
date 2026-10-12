# Issues

**Status:** Planned (sub-project 2 on the `CLAUDE.md` roadmap) — only the empty state ships in Foundation
**Owns (today):** `apps/web/src/domains/issues` (empty state only)
**Will read from:** `log_entry`, `crash_report` (see [INGESTION](./INGESTION.md))

## Overview

Issues is the dashboard: the view that turns raw ingested logs and
crash reports into things a human (or the self-heal pipeline) can act
on. It's the main screen of the product — the one a team actually
lives in day to day — and it's the direct trigger for
[SELF_HEAL](./SELF_HEAL.md): an issue surfacing here is what kicks off
an investigation.

Foundation ships only the empty state (no issues yet, with the
ingestion snippet to get started) — the real triage experience is its
own sub-project, specced separately before being built.

## What this needs to answer (for the full feature's spec)

- What makes a group of logs/crash reports *one issue*, versus two
  separate ones? (Fingerprinting/grouping strategy.)
- What does an issue's detail view show — raw payloads, a timeline, an
  AI-generated summary, linked fix history from
  [SELF_HEAL](./SELF_HEAL.md)?
- How is severity/priority decided, if at all, for v1?
- Search/filter scope: by project, time range, status
  (new/acknowledged/resolved), free text?
- What closes an issue — a merged fix PR, a manual action, both?

## Key decisions already made (from the roadmap)

- Scope for sub-project 2 explicitly includes "issue triage UX, log
  search/explorer" (`CLAUDE.md`).
- This is downstream of [INGESTION](./INGESTION.md)'s `log_entry` and
  `crash_report` tables — Issues doesn't ingest anything itself, only
  reads and interprets what's already landed.

## Out of scope (v1 of *this* feature, once built)

To be determined in that sub-project's own design spec — see
`docs/superpowers/specs/` once it exists.

## References

- [INGESTION](./INGESTION.md) — the data this feature is built on.
- [SELF_HEAL](./SELF_HEAL.md) — what an issue surfacing here triggers.
