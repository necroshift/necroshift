# Auth domain

Owns everything about who's signed in: the better-auth route handler,
the React client (`authClient`), the sign-in page/form, and the
first-run check used to route a fresh deployment to onboarding instead
of a sign-in form nobody can use yet.

## How it works

- `auth-client.ts` is the only place that calls `createAuthClient`.
  Every other file (forms, nav, session reads) imports from here.
- `is-first-run.ts` answers "does any user exist yet?" by querying
  `@workspace/db` directly. `true` means this is a fresh deployment —
  `/sign-in` redirects to `/onboarding`, and vice versa.
- Necroshift is invite-only (see `packages/auth`'s `validateUserInfo`):
  there is no public self-registration form here. The first account is
  created by `/onboarding`; every account after that is created by
  accepting an invitation (owned by the `projects` domain's Members
  feature), not by this page.
- `sign-in-form.tsx` is a client component: email/password via
  TanStack Form, plus a "Continue with GitHub" button. It only signs
  people in — it never creates accounts.
