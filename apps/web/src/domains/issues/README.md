# Issues domain

Foundation scope is just the empty state at `/` (`Dashboard.dc.html`) —
real issue triage is sub-project 2's job (see `CLAUDE.md`'s roadmap).

## How it works

- `empty-state.tsx` picks between two states from `ShellContext`
  (`@/src/domains/shell/get-shell-context`): no project yet → a
  "create a project" prompt; a project exists → the real ingestion
  endpoint and a "View ingestion key" link to Settings. There's
  nothing else here — no `actions.ts`, because this domain doesn't own
  any data yet.
