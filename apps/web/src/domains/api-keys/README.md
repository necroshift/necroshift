# API Keys domain

Owns `provider_credential`: the Anthropic/OpenAI key the self-heal
agent will use (no OAuth exists for these, unlike GitHub, so they're
entered and encrypted by our own code — see spec §3/§6).

## How it works

- `encryption.ts`: AES-256-GCM via `ENCRYPTION_KEY` (32 random bytes,
  base64). `encrypt`/`decrypt` fail fast if that env var is missing or
  doesn't decode to exactly 32 bytes — never silently store an
  unencrypted credential. Unlike ingestion keys (hashed, never
  retrievable), these are genuinely *decryptable*, because the
  self-heal pipeline (later) needs the real key to call the provider —
  `maskSecret` is only for display.
- `actions.ts`: `listProviderCredentials` always returns one row per
  known provider (`anthropic`, `openai`), `connected: false` when
  there's no credential yet, so the UI doesn't need its own "which
  providers exist" list. `setProviderCredential` upserts by
  `(organizationId, provider)`.
- `api-keys-tab.tsx`: the API Keys half of `SettingsApiKeys.dc.html`.
