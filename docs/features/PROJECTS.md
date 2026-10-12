# Projects

**Status:** Shipped (Foundation)
**Owns:** `apps/web/src/domains/projects`
**Tables:** `project` (`ingestion_key` is created alongside a project but is owned by [INGESTION](./INGESTION.md))

## Overview

A **project** is one monitored application. A Necroshift deployment
(one organization) can watch several of them — a payments API, a
worker service, a frontend — each with its own identity and its own
ingestion key, so a leaked or rotated key only ever affects one
application.

## User-facing flow

Settings → Projects (`/settings/projects?tab=projects`):

- **Create a project**: just a name. Necroshift derives a URL-safe
  slug from it (used in the ingestion endpoint, see
  [INGESTION](./INGESTION.md)) and generates its ingestion key.
- **The ingestion key is shown exactly once**, right after creation,
  with a "copy this now" notice — then never again in plaintext.
- **List projects**: name, slug, a permanently masked key placeholder,
  creation date.

## Key decisions

- **One organization per deployment.** Necroshift isn't
  multi-tenant SaaS — there's exactly one organization for the life
  of a deployment (see [MEMBERS](./MEMBERS.md)), and "no organization
  yet" is precisely what onboarding means (see
  [ONBOARDING](./ONBOARDING.md)). Projects exist *within* that one
  organization; there's no cross-deployment project sharing to design
  for.
- **Ingestion keys are never retrievable after creation.** Only a
  SHA-256 hash is stored. This is a deliberate trade-off: if a key is
  lost, the answer is to create a new project or (later) rotate the
  key — not to recover the old one. Matches how GitHub/Stripe API
  keys behave.
- **A project's slug, not its internal ID, is the public identity**
  used in the ingestion URL and shown in every snippet in the UI —
  readable and stable, rather than an opaque database id.

## Out of scope (v1)

- Renaming a project or regenerating its slug after creation.
- **Key rotation** — today, a lost key means a new project. Rotation
  (same project, new key, old key invalidated) is a natural
  follow-up, not yet built.
- Deleting a project.
- Per-project settings beyond its identity (e.g. retention overrides,
  custom alerting rules).

## References

- [INGESTION](./INGESTION.md) — what a project's ingestion key is actually for.
- [ONBOARDING](./ONBOARDING.md) — creates the first project.
- [MEMBERS](./MEMBERS.md) — the one organization every project belongs to.
