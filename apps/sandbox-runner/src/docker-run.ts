import { spawn } from "node:child_process"
import { mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import type { RunRequest } from "./types"

const TIMEOUT_MS = 15 * 60 * 1000
const SANDBOX_IMAGE = process.env.SANDBOX_IMAGE ?? "necroshift-sandbox"
const DOCKER_NETWORK = process.env.SANDBOX_DOCKER_NETWORK ?? "necroshift_default"

// Secrets go in a 0600 temp env-file, not `docker run -e`, which would put
// them in the host's process list (`ps aux`). The file is deleted right
// after the container is *created* (detached mode), not after it exits —
// `docker run`'s CLI reads --env-file synchronously before the daemon call
// returns, so holding the file on disk for the container's full run (up to
// TIMEOUT_MS) would leave secrets sitting in plaintext far longer than
// necessary.
export async function startSandboxContainer(input: RunRequest): Promise<void> {
  const dir = await mkdtemp(join(tmpdir(), "necroshift-run-"))
  const envFile = join(dir, ".env")
  const containerName = `necroshift-sandbox-${input.runId}`
  try {
    await writeFile(envFile, formatEnvFile(input), { mode: 0o600 })
    await createContainer(containerName, envFile)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
  await streamLogs(containerName)
  await waitWithTimeout(containerName)
}

function formatEnvFile(input: RunRequest): string {
  const lines = [
    `DATABASE_URL=${process.env.DATABASE_URL ?? ""}`,
    `RUN_ID=${input.runId}`,
    `REPO_URL=${input.repoUrl}`,
    `GITHUB_TOKEN=${input.githubToken}`,
    `LLM_PROVIDER=${input.llmProvider}`,
    `LLM_API_KEY=${input.llmApiKey}`,
    `ORGANIZATION_ID=${input.organizationId}`,
    `PROJECT_ID=${input.projectId}`,
    // base64'd: these can contain newlines (stack traces, a ticket target's
    // free-text name), which an env-file line can't.
    `ISSUE_TITLE_B64=${Buffer.from(input.issueTitle).toString("base64")}`,
    `LATEST_OCCURRENCE_B64=${Buffer.from(JSON.stringify(input.latestOccurrence ?? null)).toString("base64")}`,
    `TICKET_TARGET_B64=${Buffer.from(JSON.stringify(input.ticketTarget)).toString("base64")}`,
  ]
  return lines.join("\n")
}

function createContainer(containerName: string, envFile: string): Promise<void> {
  const args = [
    "run",
    "-d",
    "--rm",
    "--name",
    containerName,
    "--network",
    DOCKER_NETWORK,
    "--memory",
    "1g",
    "--cpus",
    "1",
    "--env-file",
    envFile,
    SANDBOX_IMAGE,
  ]
  return new Promise((resolve, reject) => {
    const child = spawn("docker", args)
    child.on("error", reject)
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`docker run exited with code ${code}`))))
  })
}

// Best-effort: `-d` mode means we lose the automatic stdout/stderr
// streaming a foreground `docker run` would give us, so stream logs
// separately for observability. Not awaited as part of the critical path.
function streamLogs(containerName: string): Promise<void> {
  spawn("docker", ["logs", "-f", containerName], { stdio: "inherit" })
  return Promise.resolve()
}

function waitWithTimeout(containerName: string): Promise<void> {
  const waiter = spawn("docker", ["wait", containerName])
  const timer = setTimeout(() => spawn("docker", ["kill", containerName]), TIMEOUT_MS)
  return new Promise((resolve) => {
    waiter.on("exit", () => {
      clearTimeout(timer)
      resolve()
    })
  })
}
