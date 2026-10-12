# Connections domain (NEC-7)

Owns `connection`, `project_routing`, `connection_event` — OAuth
connections to Jira/Linear, per-project routing targets, and the
ticket-filing event log. Settings → Connections.

Full design decisions: `docs/features/INTEGRATIONS.md`. Verified real
Jira/Linear OAuth endpoints via web search before building, not from
training-data recall alone — see that doc's references.

## v1 scope

- **OAuth-based, one connection per provider per deployment** — hand-rolled
  authorization-code flow (`jira-oauth.ts`/`linear-oauth.ts`), not
  better-auth's `socialProviders` (those are user-scoped accounts;
  this is a deployment-level resource, so it doesn't fit that model).
  CSRF via a short-lived httpOnly state cookie (`oauth-state.ts`), not
  DB-backed — a connection flow only ever has one in-flight attempt
  per browser.
- **Per-project routing target picker fetches the whole list once**,
  not a debounced search-as-you-type autocomplete (an explicitly
  deferred open question in INTEGRATIONS.md) — connected
  workspaces/sites are expected to be small.
- **Routing config outlives the connection** — disconnecting and
  reconnecting a provider doesn't make a project re-pick its target
  (`project_routing` has no FK to `connection`).
- **Jira preferred over Linear** when a project is somehow routed to
  both (shouldn't normally happen via the UI, but the self-heal
  pipeline only files one ticket) — same arbitrary, documented
  tie-break pattern as `self-heal/resolve-llm-credential.ts`.

## How it works

- `jira-oauth.ts` / `linear-oauth.ts`: authorize URL + code exchange.
  Jira also resolves the connected site's `cloudId`/`siteUrl` via
  `accessible-resources` right after exchange — v1 takes the first
  accessible site.
- `connection-store.ts`: `saveConnection`/`getDecryptedConnection` —
  plain server functions (not `"use server"` actions) called from the
  OAuth callback route and from `self-heal/resolve-ticket-target.ts`.
- `actions.ts`: the client-bindable CRUD (list/disconnect connections,
  list/set/clear routing, list events, list routing-target options).
- `list-targets.ts`: fetches Jira projects / Linear teams for the
  routing picker, using the connection's live token.
- `record-connection-event.ts`: mirrors ingestion's
  `record-event.ts` — FIFO-trimmed to 100 per (org, provider).

## Self-heal integration

`self-heal/resolve-ticket-target.ts` resolves a project's routing +
connection into the credentials the sandbox needs, passed through
`startSelfHealRun`'s dispatch payload. The actual ticket creation
(`apps/sandbox-runner/src/sandbox/jira-ticket.ts` /
`linear-ticket.ts`) runs inside the sandbox, as an optional
`file_ticket` step — only seeded for runs where a target is actually
configured. Per CLAUDE.md's key decision, a failure there is recorded
as a `connection_event` and the pipeline proceeds to open the PR
unlinked rather than blocking.

## Known limitation

Never exercised against real Jira/Linear OAuth end-to-end — no real
OAuth apps are registered in this dev environment
(`JIRA_CLIENT_ID`/`LINEAR_CLIENT_ID` are placeholders, same situation
as GitHub's — see `docs/features/AUTH.md`). Everything up to that
boundary (connect/disconnect UI, routing picker, events list, guard
logic, the sandbox's Jira/Linear ticket-creation request shapes) is
tested against real Postgres, with real-but-fake credentials exercised
through the actual code paths (e.g. a routing picker's live API call
failing gracefully was verified via `agent-browser`, not assumed).
