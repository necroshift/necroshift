# Issues domain

Owns the `issue` table (sub-project 2 on the `CLAUDE.md` roadmap, NEC-5).

## v1 scoping decisions

- An issue groups **`crash_report` rows only** — not `log_entry`. A crash
  is an unambiguous "something broke" signal; log-based grouping (e.g.
  repeated error-level log lines) is a later iteration.
- Grouping key (`fingerprint.ts`): a SHA-256 hash of the crash's
  lowercased, trimmed `message`. Deliberately naive for v1 — no stack
  trace normalization, no multi-line diffing. Revisit once real-world
  crash payloads show this grouping is too coarse or too fine.
- Status is a plain `open` / `resolved` — not the 4-state
  New/Self-Healing/Fix Proposed/Resolved model sketched in the early
  draft mockup. Those richer states depend on the Self-Heal Pipeline
  (NEC-6) actually existing; introducing them now would be unused
  surface area.
- A new crash **reopens** a resolved issue (`upsert-issue.ts`) — if it's
  still happening, it isn't actually resolved.
- `crash_report.issue_id` links each raw crash to the issue it was
  grouped into, so the detail view can show the latest occurrence's raw
  payload without re-deriving the fingerprint.

## How it works

- `fingerprint.ts`: pure grouping-key function.
- `upsert-issue.ts`: called from the ingestion domain
  (`handle-request.ts`) right after a crash is validated, before the
  `crash_report` row is inserted — returns the issue id so the crash row
  can be linked to it in the same insert.
- `actions.ts`: `listIssues`, `getIssue`, `getLatestOccurrence`,
  `markResolved` — server actions, each `requireSession()`-gated like
  every other domain's actions.
- `issue-list.tsx` / `issue-detail.tsx`: TanStack Query-backed UI for
  `/` and `/issues/[id]`.
- `empty-state.tsx`: shown by `issue-list.tsx` when there are zero
  issues yet (no project, or a project with no crashes reported).

## Out of scope for v1

Severity/priority, search/filter, the self-heal section on the detail
view (depends on NEC-6) — see `docs/features/ISSUES.md`.
