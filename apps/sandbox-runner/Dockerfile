# sandbox-runner: the one service in this deployment that touches the
# Docker socket. It only launches ephemeral `necroshift-sandbox`
# containers (see ./Dockerfile.sandbox) and never runs untrusted code
# itself — see docs/superpowers/specs/2026-10-12-necroshift-self-heal-design.md.
FROM node:22-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends docker.io ca-certificates \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable

WORKDIR /repo
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/db/package.json packages/db/package.json
COPY packages/typescript-config/package.json packages/typescript-config/package.json
COPY packages/eslint-config/package.json packages/eslint-config/package.json
COPY apps/sandbox-runner/package.json apps/sandbox-runner/package.json
RUN pnpm install --frozen-lockfile --filter @workspace/sandbox-runner...

COPY packages/db packages/db
COPY packages/typescript-config packages/typescript-config
COPY packages/eslint-config packages/eslint-config
COPY apps/sandbox-runner apps/sandbox-runner

WORKDIR /repo/apps/sandbox-runner
CMD ["pnpm", "start"]
