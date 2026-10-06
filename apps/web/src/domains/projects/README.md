# Projects domain

Owns `project` and `ingestion_key`: creating a project, generating its
ingestion key, and listing projects for the Settings UI.

## How it works

- `ingestion-key.ts`: generates an `nk_live_...` key and its SHA-256
  hash. Only the hash is ever stored (`project.ingestion_key.key_hash`)
  — the plaintext exists only in the server action's return value and
  is never retrievable again, matching how GitHub/Stripe API keys work.
  A fast hash (not a slow password hash) is correct here because the
  key itself is 24 random bytes of entropy, not a user-chosen secret.
- `slugify.ts`: pure string transform, used to derive `project.slug`
  from its name.
- `actions.ts`: server actions (`"use server"`). `createProject`
  returns the plaintext key once; `listProjects` never does.
- `projects-tab.tsx` / `new-key-banner.tsx`: the Settings → Projects UI
  (part of `SettingsProjects.dc.html`). Existing projects always show
  a fixed masked placeholder, never a real reveal — there's nothing to
  reveal once the plaintext is gone.
