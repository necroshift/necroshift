# API Keys

**Status:** Shipped (Foundation)
**Owns:** `apps/web/src/domains/api-keys`
**Tables:** `provider_credential`

## Overview

The self-heal pipeline (see [SELF_HEAL](./SELF_HEAL.md)) needs an LLM
to actually investigate failures and draft fixes. API Keys is where a
self-hosting user provides their own Anthropic or OpenAI key for that
— Necroshift never ships with or proxies a shared key.

## User-facing flow

Settings → API Keys (`/settings/api-keys?tab=keys`):

- One card per supported provider (Anthropic, OpenAI), each showing
  whether a key is configured.
- **Add/edit a key**: paste it in, save. The UI only ever shows a
  masked version afterward (provider prefix + last 4 characters),
  never the full key again.
- **Remove a key**: disconnects that provider.

There's no "test connection" or "choose which provider the agent
uses" yet — see Out of scope.

## Key decisions

- **Stored encrypted, not hashed.** Unlike ingestion keys (see
  [INGESTION](./INGESTION.md)), these keys must be used again later —
  the self-heal pipeline needs the real plaintext to call the
  provider. AES-256-GCM, keyed by a deployment-level
  `ENCRYPTION_KEY` env var. The app fails to start if that key is
  missing or malformed, rather than ever risk storing a credential
  unencrypted.
- **One credential per provider per deployment**, not per project.
  Necroshift is one organization per deployment (see
  [PROJECTS](./PROJECTS.md)); every project's self-heal runs share the
  same provider key.
- **No OAuth exists for LLM providers**, so unlike GitHub (see
  [AUTH](./AUTH.md)), this is the one credential type in the product
  that's manually entered rather than connected.

## Out of scope (v1)

- Choosing which provider/model the self-heal agent actually uses when
  both are configured (today: whichever [SELF_HEAL](./SELF_HEAL.md)
  is built to prefer).
- Validating a key actually works at save time.
- Per-project provider overrides.
- Usage/cost tracking for LLM calls.

## References

- [SELF_HEAL](./SELF_HEAL.md) — the feature this credential exists for.
