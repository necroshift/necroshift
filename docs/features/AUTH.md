# Auth

**Status:** Shipped (Foundation)
**Owns:** `apps/web/src/domains/auth`, `packages/auth`
**Tables:** `user`, `session`, `account`, `verification` (all better-auth managed)

## Overview

Necroshift is self-hosted and invite-only: there is no public
sign-up. Exactly one account is created by anyone outside the
organization — the owner, during onboarding — and every account after
that is created by accepting an invitation (see [MEMBERS](./MEMBERS.md)).
Auth owns everything about *who is signed in*: credentials, sessions,
and the sign-in screen. It does not own account creation itself —
that's split between [ONBOARDING](./ONBOARDING.md) (the owner) and
Members (everyone else).

## User-facing flow

- A returning user visits `/sign-in` and authenticates with either:
  - **Email + password**, or
  - **Continue with GitHub** (OAuth).
- On success they land on the dashboard (`/`).
- Visiting `/sign-in` (or any authenticated page) before the
  deployment has been set up redirects to `/onboarding` instead —
  there's nothing to sign in to yet.
- There is no "forgot password" or self-service sign-up on this
  screen, and no reason to look for one: those flows don't exist in
  an invite-only product.

## Key decisions

- **Both login methods are first-class.** Email/password and GitHub
  OAuth are equally supported; neither is a fallback for the other.
- **GitHub OAuth scope is minimal for ordinary login** (identity
  only). The broader `repo` scope — needed for the self-heal pipeline
  to clone/branch/push — is requested only at the specific moments a
  user is explicitly connecting GitHub for that purpose: the
  onboarding owner flow, and (later) a "Connect GitHub" action in
  Settings. A user who merely signs in with GitHub day-to-day should
  never be silently granted repo-write access.
- **Invite-only, enforced server-side, for every creation path.**
  Whether an account is created via email/password or GitHub OAuth,
  the same rule applies: allowed if no user exists yet (the owner), or
  if a pending invitation matches the email. This is enforced in
  `packages/auth`, not just hidden in the UI — directly calling the
  sign-up endpoint with an uninvited email is rejected (`403`).
- **Sessions are the only auth mechanism for humans.** The one
  exception in the whole product is the ingestion API, which
  authenticates by a per-project key instead (see
  [INGESTION](./INGESTION.md)) — it has no human session to use.

## Out of scope (v1)

- Password reset / "forgot password" flow.
- Multi-factor authentication.
- SSO/SAML (GitHub OAuth is the only non-password method).

## References

- [ONBOARDING](./ONBOARDING.md) — creates the one account this domain
  doesn't: the owner.
- [MEMBERS](./MEMBERS.md) — invitations, roles, and account creation
  for everyone after the owner.
