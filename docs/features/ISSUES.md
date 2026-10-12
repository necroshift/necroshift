# Issues

**Status:** Shipped (v1) — sub-project 2 on the `CLAUDE.md` roadmap (NEC-5)
**Owns:** `apps/web/src/domains/issues` — `issue` table, grouping,
list/detail UI, resolve action
**Reads from:** `crash_report` (see [INGESTION](./INGESTION.md))

## Overview

Issues is the dashboard: the view that turns raw ingested crash
reports into things a human (or the self-heal pipeline) can act on.
It's the main screen of the product and the direct trigger for
[SELF_HEAL](./SELF_HEAL.md): an issue's detail page is where a
self-heal run is started.

## v1 scope — how the open questions below were resolved

- **Grouping**: an issue groups `crash_report` rows only (not
  `log_entry`) by a SHA-256 fingerprint of the crash message
  (lowercased/trimmed). A crash is an unambiguous "something broke"
  signal; log-based grouping is a later iteration.
- **Detail view**: occurrence stats (count, first/last seen) and the
  latest occurrence's raw payload. Severity/priority and search/filter
  are not in v1.
- **Status**: plain `open`/`resolved`. A new occurrence on a resolved
  issue reopens it. The richer New/Self-Healing/Fix Proposed states
  from the early draft mockup were deliberately not built — they
  depend on [SELF_HEAL](./SELF_HEAL.md), which didn't exist yet when
  this shipped.
- **What closes an issue**: a manual "Mark resolved" action only, for
  v1 — not tied to a merged PR yet (self-heal's PR flow doesn't
  auto-resolve the issue it came from).

## Out of scope (v1)

Severity/priority, search/filter, log-based grouping, auto-resolve on
merged PR.

## References

- [INGESTION](./INGESTION.md) — the data this feature is built on.
- [SELF_HEAL](./SELF_HEAL.md) — what an issue surfacing here triggers.
