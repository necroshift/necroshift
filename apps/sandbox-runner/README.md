# sandbox-runner

The self-heal pipeline's execution side (NEC-6). Two things live here:

1. **`src/index.ts`** — a small HTTP service (`POST /runs`) that owns
   the Docker socket and launches ephemeral sandbox containers. This is
   the *only* place in the whole deployment with Docker socket access
   — see `docs/superpowers/specs/2026-10-12-necroshift-self-heal-design.md`
   for why that's a dedicated service instead of mounting the socket
   into the `web` container.
2. **`src/sandbox/`** — the code that actually runs *inside* each
   ephemeral `necroshift-sandbox` container: clone the repo, draft a
   fix via the configured LLM, run the project's tests, open a PR.
   Reports its own progress directly to Postgres
   (`self_heal_run`/`self_heal_step`) — the runner service above
   doesn't track run state itself.

Two separate Docker images, one package: `Dockerfile` (the runner
service) and `Dockerfile.sandbox` (the sandbox image, entrypoint
`src/sandbox/run.ts`).

## Building the sandbox image

`docker compose build` only builds the long-running `sandbox-runner`
service. The `necroshift-sandbox` image it launches on each run is
built separately, once (rebuild it after changing anything under
`src/sandbox/`):

```sh
docker build -f apps/sandbox-runner/Dockerfile.sandbox -t necroshift-sandbox .
```

## Safety

- Secrets (GitHub token, LLM key) go into a `0600` temp env-file for
  `docker run --env-file`, never `-e`, which would otherwise leave
  them visible in `ps` on the host for the life of the spawn
  (`docker-run.ts`).
- Each sandbox run is `--rm`, resource-limited (`--memory 1g --cpus 1`),
  and killed after a 15-minute hard timeout.
- A failing test suite blocks PR creation (`run.ts`); the pipeline
  never claims a fix is good when its own test run said otherwise.

## Pipeline steps (`src/sandbox/run.ts`)

investigate → clone → develop → test → open_pr, each reported to
`self_heal_step` as it starts/finishes/fails
(`report-progress.ts`). See the design spec for what each step does
and the v1 simplifications (single-shot fix generation, no ticket
filing yet, etc).
