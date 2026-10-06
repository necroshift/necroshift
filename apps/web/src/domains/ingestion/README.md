# Ingestion domain

Owns `ingestion_key`, `log_entry`, `crash_report`, and `ingestion_event`
(per the Foundation spec §3 — note `ingestion_key` lives here, not in
`projects`, even though creating a project is what generates one).

## How it works

- `ingestion-key.ts`: key generation + hashing (see its use from the
  `projects` domain, which owns *creating* a project and its key).
- `authenticate-key.ts`: looks up a bearer token by its hash, scoped to
  one project — this is the only auth path that isn't a better-auth
  session; it's what the SDK uses.
- `record-event.ts`: writes one `ingestion_event` row per attempt and
  trims to the 100 most recent per project (spec §5), in a single SQL
  statement. Never throws — a failure here must not break ingestion
  itself, so it logs to console instead.
- `handle-request.ts`: the shared logic behind both ingestion routes
  (`app/api/ingest/[projectSlug]/logs` and `.../crashes`, which are thin
  wrappers calling this with `payloadType`). The URL names a project by
  its *slug* (what every ingestion snippet in the UI shows, and what a
  real integrator would copy) — resolved to the real id once, up front;
  everything downstream (the key lookup, `log_entry`/`crash_report`,
  the event row) uses that id, same as everywhere else in the schema.
  Every outcome — 401 on a bad key, 400 on a payload that fails
  `packages/contracts`' validation, 200 on success — also records an
  event.
- `events-actions.ts` / `events-tab.tsx`: the Integration Events half
  of `SettingsApiKeys.dc.html`. The API Keys half lives in a domain of
  its own (sub-project task), and the page composing both tabs is
  `app/(app)/settings/api-keys/page.tsx`.
