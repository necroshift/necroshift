# Onboarding domain

Owns the first-access wizard (`Onboarding.dc.html`): owner account,
organization, first project, first event. It doesn't own any data of
its own beyond the organization — it composes the `auth`, `projects`,
and `ingestion` domains' existing actions for steps 1, 3, and 4.

## How it works

- `needs-onboarding.ts` is the single source of truth for "is this
  deployment set up yet?" — keyed on organization existence, not user
  existence. A visitor can have an account (step 1 done) with no
  organization yet (step 2 not done); checking only for a user would
  wrongly lock that visitor out of `/onboarding`. `sign-in`,
  `(app)/layout.tsx`, and this domain's own page all gate on it.
- `onboarding/page.tsx`'s own guard only redirects a *sessionless*
  visitor once setup is done — never a signed-in one. Next re-renders
  this server component after every Server Action the wizard calls
  (its default post-action refresh), including the one that creates
  the organization in step 2; gating on `needsOnboarding()` alone would
  flip to "redirect" the instant that succeeds, kicking the owner out
  mid-wizard before step 4. See the comment in that file.
- `has-github-account.ts` + the `githubConnected` prop: if the owner
  signed up via GitHub in step 1 (or linked it in step 2), a page
  reload (e.g. returning from the OAuth redirect) must not re-show the
  "Connect GitHub" prompt.
- `completeOrgSetup` (the only action this domain owns) is idempotent —
  safe to call again if an organization already exists — covering a
  double-submit or a revisit mid-flow without creating a second
  organization (Necroshift is one deployment per organization).
- `wizard-store.ts`: a Zustand store for the 4 steps' client-only UI
  state (current step, project just created, GitHub-connected flag).
  Server state (the user, the organization, the project) lives in the
  database, fetched via the same actions the real Settings pages use —
  this store never duplicates it.
- Step 1 reuses `authClient.signUp.email`/`signIn.social` directly (no
  action of its own); step 3 reuses `projects`' `createProject`; step 4
  polls `ingestion`'s `listIngestionEvents` — completion is derived
  from that project's first event existing, not a stored flag.

## Known limitation

Wizard progress (which step, which project) lives only in the
client-side store, not persisted server-side. A full page reload
mid-wizard returns to step 2 (if a session exists) or step 1,
not wherever the visitor actually was. Re-submitting step 2 is safe
(idempotent); re-submitting step 3 with the same project name fails
gracefully (name already taken) without a way to jump back to the
already-created project from here — they'd finish via Settings
instead. Fixing this would mean persisting wizard progress
server-side, out of scope for Foundation.
