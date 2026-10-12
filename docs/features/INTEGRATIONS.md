# Integrations (Connections)

**Status:** Planned (sub-project 4 on the `CLAUDE.md` roadmap)
**Will be used by:** [SELF_HEAL](./SELF_HEAL.md) (optional ticket-filing step)

## Overview

Teams that already track work in Jira or Linear don't want a fix PR
showing up with no corresponding ticket. Integrations lets a project
connect a third-party issue tracker so the self-heal pipeline files a
tracked ticket *before* opening its pull request — the PR then
references real, visible work-item history instead of appearing out
of nowhere.

## Intended flow (per `CLAUDE.md`'s key decisions)

Settings → Connections (not yet built):

- **Connect a provider**: OAuth, not a pasted API token — matching how
  GitHub is connected (see [AUTH](./AUTH.md)), not how LLM provider
  keys are entered (see [API_KEYS](./API_KEYS.md)).
- **One connection per provider per deployment.** Connecting Jira (or
  Linear) is a deployment-level action, done once, not per project.
- **Each project independently configures its routing target** — which
  Jira project (by key) or Linear team its tickets should go to. This
  is per-project because different applications in the same
  deployment (see [PROJECTS](./PROJECTS.md)) may belong to different
  teams in the tracker.
- When [SELF_HEAL](./SELF_HEAL.md) is about to open a PR for a project
  with a configured target, it first creates a ticket there, then
  opens the PR referencing it.

## What this needs to answer (for this sub-project's own spec)

- Exact OAuth scopes needed from Jira Cloud and Linear for ticket
  creation.
- What fields populate the created ticket (title, description, links
  back to the Necroshift issue, severity?).
- How a project's routing target is actually selected in the UI
  (search/autocomplete against the connected workspace's projects/teams).
- What "disconnect" does to projects currently routed through that
  connection.
- Whether a provider can be reconnected/re-authorized without losing
  existing per-project routing config.

## Key decisions already made (from the roadmap)

- **OAuth-based, not pasted tokens** — the connection step itself is
  the credential; there's no "Jira API token" field to manage or leak.
- **Ticket creation failing never blocks the fix.** If it fails, the
  self-heal pipeline proceeds and opens the PR anyway (unlinked)
  rather than blocking a working fix on a broken integration. The
  failure is recorded as an event, the same pattern
  [INGESTION](./INGESTION.md) uses for its own attempts — diagnosable
  without reading server logs.
- **Jira and Linear are the v1 providers**; the connection model is
  intentionally provider-agnostic enough to add more later without a
  redesign.

## Out of scope (v1 of *this* feature, once built)

- Two-way sync (ticket status changes in Jira/Linear reflecting back
  into Necroshift).
- Providers beyond Jira and Linear.
- Routing by anything other than one target per project (e.g. rules
  based on issue severity or type).

## References

- [SELF_HEAL](./SELF_HEAL.md) — the feature this unlocks a step for.
- [PROJECTS](./PROJECTS.md) — the unit each connection's routing target is scoped to.
- [AUTH](./AUTH.md) — the OAuth pattern this reuses (GitHub).
