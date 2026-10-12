# Members

**Status:** Shipped (Foundation)
**Owns:** `apps/web/src/domains/auth` (`members-actions.ts`, `members-tab.tsx`)
**Tables:** `organization`, `member`, `invitation` (all better-auth organization-plugin managed)

## Overview

A Necroshift deployment is shared by a team. Members is how the owner
(or an admin) brings teammates in, and how everyone sees who else has
access. There is no self-service sign-up (see [AUTH](./AUTH.md)) — an
invitation is the *only* way an account comes into existence after
the owner's.

## User-facing flow

Settings → Members (`/settings/projects?tab=members`):

- **Invite a member**: enter an email and pick a role
  (`admin`/`member`), send. The invited person later completes
  sign-up for that exact email — invite-only enforcement means no one
  else can register as them.
- **List members**: name, email, role, date joined.
- **Change a member's role**: promote to admin / demote to member.
- **Remove a member**: revokes their access to the deployment.

There is one organization per deployment (see
[PROJECTS](./PROJECTS.md) for why), so there is no "switch
organization" concept here — Members always means this deployment's
one team.

## Key decisions

- **Roles are owner / admin / member**, provided entirely by
  better-auth's organization plugin — no custom role table or
  permission logic of our own.
- **The owner is whoever completes onboarding first**, automatically,
  by creating the organization (see [ONBOARDING](./ONBOARDING.md)).
  There is no separate "assign an owner" step.
- **Invites gate account creation**, not just organization access: see
  [AUTH](./AUTH.md)'s invite-only enforcement. A pending invitation is
  what makes `signUp` succeed for that email at all.

## Out of scope (v1)

- Per-project permissions (a member's role is deployment-wide, not
  scoped to individual projects).
- Custom/configurable roles beyond owner/admin/member.
- Removing/resending a *pending* invitation from the UI (the data
  model supports it via better-auth; no UI yet).

## References

- [AUTH](./AUTH.md) — the invite-only enforcement this feature relies on.
- [ONBOARDING](./ONBOARDING.md) — how the owner (the first member) is created.
