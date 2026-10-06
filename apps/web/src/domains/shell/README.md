# Shell domain

Owns the authenticated app chrome shared by every page behind
`app/(app)/`: the sidebar (nav, org identity, user row), the top bar,
and the dark/light theme toggle. Not a business domain — it's the
layout every other domain's pages render inside.

## How it works

- `get-shell-context.ts` loads the single organization row (Necroshift
  is one deployment per organization — see the Foundation spec) and
  its first project, if any, for the sidebar's org/project display.
- `app-shell.tsx` is the layout component: `active` picks which nav
  item is highlighted, `title` sets the top bar heading, `children` is
  the page's own content.
- `(app)/layout.tsx` (not in this folder — it's a route file) is the
  only place that checks for a session; every route under `(app)/`
  gets that check for free and doesn't need its own.
