# Onboarding

**Status:** Shipped (Foundation)
**Owns:** `apps/web/src/domains/onboarding`
**Tables:** none of its own — creates rows owned by Auth, Members, and Projects

## Overview

A fresh Necroshift deployment has no users, no organization, and
nothing configured. Onboarding is the one-time, four-step wizard that
turns that empty deployment into a working one: an owner account, a
named organization, a first project, and proof that the project can
actually receive data. It's the front door for exactly one person,
exactly once per deployment.

## User-facing flow

1. **Create the owner account** — name, email, password, or "Continue
   with GitHub" (which also connects GitHub for the self-heal pipeline
   in one step — see [AUTH](./AUTH.md)).
2. **Name your organization** — this is the workspace every teammate
   will later share (see [MEMBERS](./MEMBERS.md)). If step 1 didn't
   use GitHub, a "Connect GitHub" prompt offers to do it here instead,
   dismissible ("I'll do this later in Settings").
3. **Create your first project** — same flow as Settings → Projects:
   name it, get its ingestion key, shown once (see
   [PROJECTS](./PROJECTS.md)).
4. **Send your first event** — the real ingestion snippet for that
   project, with a live "waiting for your first event…" state. Once
   an ingestion event arrives for that project, this flips to "First
   event received!" automatically. A manual "I've sent a test event"
   button re-checks on demand.

Every step from 2 onward has a "Skip for now" exit straight to the
dashboard — onboarding should never be a wall someone gets stuck
behind.

## Key decisions

- **Completion is derived, not stored.** There's no
  `onboarding_completed` flag. "Needs onboarding" means "no
  organization exists yet" (see [PROJECTS](./PROJECTS.md) for why
  that's the right check, not "no user exists yet"), and step 4's
  completion means "this project has at least one ingestion event" —
  both facts the system already knows independently.
- **Each step reuses the real feature, not a mock of it.** Step 1 is
  real sign-up; step 3 is the real `createProject`; step 4 polls the
  real ingestion events. Onboarding doesn't duplicate logic that
  Settings also needs — it's a guided path through existing features.
- **A session in progress always keeps the wizard**, never redirects
  it away, even after the organization that "needs onboarding" is
  keyed on gets created partway through (step 2). Only a visitor with
  no session, after setup is fully done, gets bounced to sign-in.

## Out of scope (v1)

- Resuming at the exact step/project if the browser is closed and
  reopened mid-wizard (falls back to step 1 or 2 depending on whether
  a session exists; see the domain's README for the known limitation).
- Any onboarding step for members after the owner — invited members
  just sign in (see [MEMBERS](./MEMBERS.md)).

## References

- [AUTH](./AUTH.md), [MEMBERS](./MEMBERS.md), [PROJECTS](./PROJECTS.md),
  [INGESTION](./INGESTION.md) — every feature this wizard is a guided
  path through.
