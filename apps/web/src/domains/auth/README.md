# Auth domain

Owns everything about who's signed in: the better-auth route handler,
the React client (`authClient`), the sign-in page/form, and session
reads. The "does this deployment need onboarding yet?" check lives in
the `onboarding` domain, not here — see its README.

## How it works

- `auth-client.ts` is the only place that calls `createAuthClient`.
  Every other file (forms, nav, session reads) imports from here.
- Necroshift is invite-only (see `packages/auth`'s `validateUserInfo`):
  there is no public self-registration form here. The first account is
  created by `/onboarding`; every account after that is created by
  accepting an invitation.
- `sign-in-form.tsx` is a client component: email/password via
  TanStack Form, plus a "Continue with GitHub" button. It only signs
  people in — it never creates accounts.
- `get-current-session.ts` wraps `auth.api.getSession` in React's
  `cache()` so the `(app)` layout's auth check and a page's own read of
  the session (for the signed-in user's email) share one lookup per
  request instead of two.
- `members-actions.ts` / `members-tab.tsx`: invite/list/role-change/
  remove, all thin wrappers over better-auth's organization plugin
  (there's no separate `member`/`invitation` table of our own — see
  `packages/db`). This is the Members half of
  `SettingsProjects.dc.html`; the Projects half lives in the `projects`
  domain, and the page that composes both tabs is
  `app/(app)/settings/projects/page.tsx`.
