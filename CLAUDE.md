@AGENTS.md

# Necroshift

Necroshift is a self-hosted, open-source on-call engineer for the
applications you run. It centralizes log streaming and crash reporting
(like Grafana/Sentry), then — when something breaks — investigates the
failure, develops a fix in a sandbox, and opens a pull request.

## Product Requirements

### Problem

Teams running their own applications want an always-on first responder:
something that notices a crash or misbehavior, understands why it
happened from logs and crash reports, and proposes a fix — without
someone having to be paged at 3am to start that investigation by hand.

### Target users

Self-hosting teams/organizations who run their own infrastructure and
want full control over their observability and incident-response data,
rather than sending it to a third-party SaaS.

### Deployment model

Necroshift is self-hosted: **one deployment per organization**, not a
multi-tenant SaaS. A single deployment monitors multiple **applications**
(modeled as **projects**) and supports **multiple human users** sharing
that deployment with roles (owner/admin/member).

### Core capabilities

1. **Ingestion** — applications stream logs and crash reports to
   Necroshift over HTTP, authenticated per-project. The client-side SDK
   that applications install lives in a **separate repository** (not
   this one); this repo only implements the HTTP contract it calls.
2. **Dashboard** — issues surfaced from ingested data, each with its
   log/crash context and fix history.
3. **Self-heal pipeline** — on a trigger (crash, misbehavior), spawns a
   sandbox, scans logs/crash reports, clones the repository, checks out
   a fix branch, develops and tests a fix, and opens a pull request.
4. **Integrations (Connections)** — users can connect third-party issue
   trackers (starting with **Jira** and **Linear**) and configure the
   self-heal agent to create a ticket/issue *before* opening the pull
   request, so the fix PR references a tracked issue.
5. **Settings** — API keys for the LLM provider used by the agent
   (Anthropic or OpenAI), GitHub access (for repo operations), and the
   Connections above.

### Key product decisions

- **Login**: email/password AND GitHub OAuth, both available
  (better-auth). GitHub OAuth requests `repo` scope; that token is
  reused by the self-heal pipeline for git operations — there is no
  separate "paste a GitHub PAT" field.
- **LLM provider keys**: Anthropic or OpenAI, user's own key, entered
  and stored encrypted (no OAuth exists for these).
- **Connections (Jira/Linear)**: OAuth-based (not pasted tokens), one
  connection per provider per deployment; each **project**
  independently configures its routing target (which Jira project /
  Linear team its tickets go to). If ticket creation fails, the
  self-heal pipeline proceeds and opens the PR anyway (unlinked) rather
  than blocking on a broken integration — the failure is recorded as an
  event, mirroring how ingestion failures are recorded (see the
  Foundation spec).
- **Ingestion events**: every ingestion attempt (success or failure) is
  recorded per project, capped at the 100 most recent, so a
  self-hosting user can diagnose a broken SDK integration without
  reading server logs.

### Roadmap (sub-projects, built and specced one at a time)

1. **Foundation** — monorepo, auth, data model, ingestion API,
   dashboard shell, ingestion events. Spec:
   `docs/superpowers/specs/2026-10-02-necroshift-foundation-design.md`.
2. **Dashboard** — issue triage UX, log search/explorer.
3. **Self-heal pipeline** — trigger detection, sandbox orchestration,
   fix development, PR creation.
4. **Integrations (Connections)** — Jira/Linear OAuth connections,
   per-project routing config, ticket creation ahead of PR creation.

Each sub-project gets its own design spec under `docs/superpowers/specs/`
before implementation.

## Coding Standards

- **Design patterns**: apply them where they genuinely reduce
  complexity — don't force a pattern where a plain function suffices.
- **Functions**: max 10 lines, except for large literal object/JSON
  definitions (schemas, config objects).
- **Files**: max 400 lines. A file exceeding this must be split
  further.
- **Domain-Driven Development**: every feature is owned by a domain.
  Each domain has its own documentation (a `README.md` in its folder)
  describing what it owns and how it works.

## Architecture

- **Monorepo**: pnpm workspaces + Turborepo.
- `apps/web` — the Next.js app: dashboard UI, server actions, and
  ingestion API routes. Feature domains with a single consumer live as
  folders here: `apps/web/src/domains/{projects,ingestion,api-keys,...}`,
  each with its own `README.md`.
- `packages/db` — Drizzle ORM schema + client (shared with the
  self-heal pipeline service later).
- `packages/auth` — better-auth instance/config (shared for the same
  reason).
- `packages/contracts` — zod schemas for the ingestion payload; the one
  package the separate SDK repo also depends on, so the contract can't
  drift.
- `packages/ui` — shared shadcn/ui components.
- Postgres is the only datastore. Self-hosting ships via Docker
  Compose; migrations run through `drizzle-kit`.
