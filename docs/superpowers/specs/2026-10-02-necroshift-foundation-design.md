# Necroshift — Foundation Design

Status: Approved for planning
Date: 2026-10-02
Scope: first of three sub-projects (Foundation → Dashboard → Self-Heal Pipeline)

## 1. Context & Purpose

Necroshift is a self-hosted, open-source application that acts as an
always-on on-call engineer for the applications you run. It centralizes
log streaming and crash reporting (like Grafana/Sentry) and — in later
sub-projects — automatically investigates failures, develops a fix in a
sandbox, and opens a pull request.

This document specs only the **Foundation** sub-project: the parts
every other sub-project depends on. It does not cover the Issues
dashboard UX (sub-project 2) or the self-heal agent pipeline
(sub-project 3), beyond leaving room for them.

The SDK that applications use to stream data to Necroshift lives in a
**separate repository**, built later. This repo only needs to expose
the HTTP ingestion contract that SDK will call.

### Deployment model

Necroshift is self-hosted: one deployment per team/organization, not a
multi-tenant SaaS. A single deployment can monitor multiple
**applications**, modeled as **projects**. Multiple human users can
share one deployment with roles (owner/admin/member).

### Out of scope for Foundation

- The SDK itself (separate repo).
- Issue triage UI / log search UX (sub-project 2).
- Self-heal sandbox orchestration, repo clone/fix/PR flow (sub-project 3).
- Provider-credential (Anthropic/OpenAI) usage events — deferred until
  the self-heal pipeline actually calls those providers.

## 2. Architecture

- **Monorepo**: pnpm workspaces + Turborepo, scaffolded via
  `pnpm dlx shadcn@latest init --preset b39644xRg --template next --monorepo --pointer`.
- `apps/web` — the Next.js app: dashboard UI, server actions, and the
  ingestion API routes.
- `packages/db` — Drizzle ORM schema + client. Shared because the
  self-heal pipeline (a separate service, later) will also need DB
  access.
- `packages/auth` — better-auth instance/config. Shared for the same
  reason.
- `packages/contracts` — zod schemas for the ingestion payload
  (logs/crash reports). This is the one package the future SDK repo
  will also depend on (published independently), so the contract
  can't silently drift between SDK and ingestion API.
- Feature domains that have exactly one consumer (the dashboard app)
  live as folders inside the app, not as packages:
  `apps/web/src/domains/{projects,ingestion,api-keys}/`. Each domain
  folder has its own `README.md` describing what it owns and how it
  works, per the project's DDD coding standard.
- **Postgres** is the only datastore. Self-hosting ships via Docker
  Compose (web app + Postgres). Migrations run through `drizzle-kit`.

### Why not full package-per-domain?

Package-per-domain (one `packages/<domain>` per feature) was
considered and rejected for Foundation: every feature domain today has
exactly one consumer, so the extra package boundary is ceremony with
no present benefit. Only code with an actual second consumer (the
self-heal pipeline, the future SDK) gets a package. This can be
revisited if a domain outgrows the single app.

## 3. Data Model & Auth

Authentication and multi-user org management are delegated to
better-auth rather than hand-rolled:

- better-auth core tables: `user`, `session`, `account`.
- better-auth **organization plugin**: `organization`, `member`,
  `invitation` — gives multi-user support with `owner` / `admin` /
  `member` roles and email invitations, with no custom RBAC code.
- **Login methods**: email/password AND GitHub OAuth, both enabled via
  better-auth's `emailAndPassword` and `socialProviders.github` config.
  GitHub OAuth requests the `repo` scope. better-auth's
  `encryptOAuthTokens: true` option encrypts the resulting GitHub
  access token at rest. The self-heal pipeline (sub-project 3) reuses
  this token for git operations — there is intentionally no separate
  "paste a GitHub PAT" field.

Domain tables, owned by their respective domain folders, live in
`packages/db`:

| Table | Domain | Notes |
|---|---|---|
| `project` | `projects` | Belongs to an `organization`. `name`, `slug`. |
| `ingestion_key` | `ingestion` | Belongs to a `project`. Stored hashed; shown once in full on creation, like a typical API key. Used to authenticate SDK pushes. |
| `log_entry` | `ingestion` | Belongs to a `project`. Raw payload + parsed fields. |
| `crash_report` | `ingestion` | Belongs to a `project`. Raw payload + parsed fields. |
| `ingestion_event` | `ingestion` | See §5. Audit trail of ingestion attempts, capped per project. |
| `provider_credential` | `api-keys` | Belongs to an `organization`. `provider` (`anthropic` \| `openai`), ciphertext + nonce. Not an OAuth token, so it's encrypted by our own code (AES-GCM, server-side `ENCRYPTION_KEY`), not by better-auth. |

## 4. Ingestion Flow & Dashboard Shell

- `POST /api/ingest/[projectId]/logs` and
  `POST /api/ingest/[projectId]/crashes` are the only routes
  authenticated by API key (`Authorization: Bearer <ingestion_key>`,
  looked up by hash) instead of a better-auth session. Payloads are
  validated against `packages/contracts` schemas before being written
  to `log_entry` / `crash_report`.
- Dashboard shell: an authenticated layout using better-auth's active
  organization, with a project switcher, and navigation for:
  - **Issues** — stubbed; real UI arrives in sub-project 2.
  - **Settings → Members** — invite/manage users and roles (organization
    plugin).
  - **Settings → Projects** — create a project, view/rotate its
    ingestion key.
  - **Settings → API Keys** — CRUD for Anthropic/OpenAI credentials.
  - **Settings → Integration Events** — see §5.
- Foundation does not analyze ingested data — it only needs to prove
  data lands correctly and is visible as raw rows. Triage/search UX is
  sub-project 2's job.

## 5. Ingestion Events

To let a self-hosting user answer "why isn't my app's data showing up"
without reading server logs, every ingestion attempt is recorded:

- `ingestion_event`: `project_id`, `ingestion_key_id` (nullable — an
  invalid key may not resolve to one), `payload_type` (`log` |
  `crash`), `status` (`success` | `error`), `error_reason`
  (`invalid_key` | `invalid_payload` | `internal_error`, nullable on
  success), `http_status`, `received_at`.
- Every ingestion request writes exactly one event row, success or
  failure, after the request is processed. If writing the event itself
  fails, that failure is logged to console rather than failing the
  actual ingestion response — event logging must never break ingestion.
- **Retention cap: 100 events per project, FIFO.** Recording an event
  is a single domain function that inserts the row and then trims
  older rows beyond the 100 most recent for that project in one SQL
  statement:
  ```sql
  DELETE FROM ingestion_event
  WHERE project_id = $1
    AND id NOT IN (
      SELECT id FROM ingestion_event
      WHERE project_id = $1
      ORDER BY received_at DESC
      LIMIT 100
    );
  ```
- New page, **Settings → Integration Events**: a paginated table,
  filterable by project, ingestion key, and status.
- Provider-credential (Anthropic/OpenAI) usage events are explicitly
  out of scope here — nothing calls those providers yet. That lands
  alongside the self-heal pipeline in sub-project 3.

## 6. Error Handling

- Ingestion API: missing/invalid key → `401`; schema validation
  failure → `400` with the zod error detail; unexpected errors →
  logged server-side, generic `500`. Every outcome also produces an
  `ingestion_event` row (§5) regardless of HTTP status.
- Server actions (project CRUD, API key CRUD, member invites) return a
  discriminated result — `{ success: true, data }` or
  `{ success: false, error }` — rather than throwing. Callers render
  the error via toast. This keeps individual functions small (10-line
  rule) since callers don't need try/catch sprawl around every action.
- Encryption: the app fails fast at boot if `ENCRYPTION_KEY` is
  missing or malformed — it must never silently store an unencrypted
  provider credential.

## 7. Testing

- **Unit (Vitest)**, per domain: ingestion-key hashing/validation,
  ingestion payload validation, provider-credential encryption
  round-trip, and the ingestion-event FIFO trim.
- **Integration**: one test exercising the ingestion API route against
  a real Postgres (via Docker), covering the success path and the
  401/400 error paths, asserting the corresponding `ingestion_event`
  rows are written.
- **E2E (Playwright)**: one smoke test — sign up, create a project, see
  the generated ingestion key — proving the critical path end-to-end.
  Deeper e2e coverage arrives with sub-project 2, once there's a real
  dashboard to click through.

## 8. Coding Standards (project-wide, apply from Foundation onward)

- Apply design patterns where they genuinely reduce complexity — don't
  force one where a plain function suffices.
- Functions: max 10 lines, except for large literal JSON/object
  definitions (e.g. schema definitions, config objects).
- Files: max 400 lines. A file exceeding this must be split further.
- Domain-Driven Development: every feature is owned by a domain; each
  domain has its own documentation describing what it owns and how it
  works (a `README.md` in its folder).
