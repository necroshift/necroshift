# Integrations (Connections)

**Status:** Shipped (v1) — sub-project 4 on the `CLAUDE.md` roadmap (NEC-7)
**Owns:** `apps/web/src/domains/connections` (OAuth, routing, events UI);
ticket creation itself runs in `apps/sandbox-runner/src/sandbox/`
(`jira-ticket.ts`/`linear-ticket.ts`), as part of the self-heal pipeline.

## Overview

Teams that already track work in Jira or Linear don't want a fix PR
showing up with no corresponding ticket. Integrations lets a project
connect a third-party issue tracker so the self-heal pipeline files a
tracked ticket *before* opening its pull request — the PR then
references real, visible work-item history instead of appearing out
of nowhere.

## v1 scope — how the open questions were resolved

- **OAuth scopes**: Jira Cloud — `read:jira-work write:jira-work
  offline_access`. Linear — `read,write`. Verified against each
  provider's current docs before building (see References), not
  assumed from training data.
- **Ticket fields**: title (`Necroshift: <issue title>`), a short
  description noting Necroshift detected the issue and is drafting a
  fix, linked back implicitly (the PR links to the ticket, not the
  other way — Jira/Linear don't get told about the Necroshift issue
  URL in v1). No severity mapping.
- **Routing target selection**: a plain dropdown populated by fetching
  the connected workspace's full project/team list once — not a
  debounced search-as-you-type autocomplete. Connected
  workspaces/sites are expected to be small enough for v1.
- **Disconnect**: removes the `connection` row only.
  `project_routing` rows are untouched — a project stays "configured"
  to route to a target that just has no live connection behind it
  until reconnected (see next point), and self-heal's ticket step
  simply has nothing to use in the meantime (fails soft, same as any
  other broken-connection case).
- **Reconnect**: because routing config has no foreign key to
  `connection`, reconnecting a provider immediately restores ticket
  filing for every project already routed to it — no re-picking
  required.

## Intended flow (per `CLAUDE.md`'s key decisions)

Settings → Connections:

- **Connect a provider**: OAuth, not a pasted API token — matching how
  GitHub is connected (see [AUTH](./AUTH.md)), not how LLM provider
  keys are entered (see [API_KEYS](./API_KEYS.md)). Hand-rolled
  authorization-code flow (CSRF state in a short-lived httpOnly
  cookie) — not better-auth's `socialProviders`, which model
  per-user linked accounts; a Connections provider is a
  deployment-level resource instead.
- **One connection per provider per deployment.**
- **Each project independently configures its routing target.**
- When self-heal is about to open a PR for a project with a
  configured target, it files a ticket there first (an optional
  `file_ticket` step, only present for runs where a target is
  configured), then opens the PR referencing it.

## Key decisions already made (from the roadmap)

- **OAuth-based, not pasted tokens.**
- **Ticket creation failing never blocks the fix** — recorded as a
  `connection_event` (same FIFO-100 pattern as
  [INGESTION](./INGESTION.md)'s own events), the pipeline proceeds and
  opens the PR anyway, unlinked.
- **Jira and Linear are the v1 providers.**

## Out of scope (v1)

Two-way sync, providers beyond Jira/Linear, routing by anything other
than one target per project, search/autocomplete in the routing
picker.

## Known limitation

Never exercised against real Jira/Linear OAuth end-to-end — no real
OAuth apps are registered in this dev environment
(`JIRA_CLIENT_ID`/`LINEAR_CLIENT_ID` are placeholders, same situation
documented for GitHub in [AUTH](./AUTH.md)). See
`apps/web/src/domains/connections/README.md` for what is verified.

## References

- [SELF_HEAL](./SELF_HEAL.md) — the feature this unlocks a step for.
- [PROJECTS](./PROJECTS.md) — the unit each connection's routing target is scoped to.
- [AUTH](./AUTH.md) — the OAuth pattern this reuses (GitHub), and the
  shared "dev-only placeholder OAuth app" limitation.
- [Linear OAuth 2.0 Authentication](https://linear.app/developers/oauth-2-0-authentication)
- [Atlassian OAuth 2.0 (3LO) apps](https://developer.atlassian.com/cloud/jira/platform/oauth-2-3lo-apps/)
