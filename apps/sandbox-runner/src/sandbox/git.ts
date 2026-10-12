import { execFile, spawn } from "node:child_process"
import { promisify } from "node:util"

const run = promisify(execFile)
// Overridable for tests; the sandbox image always uses the default (see
// Dockerfile.sandbox's `mkdir -p /work/repo`).
export const WORKDIR = process.env.SANDBOX_WORKDIR ?? "/work/repo"

export function authenticatedCloneUrl(repoUrl: string, githubToken: string): string {
  const url = new URL(repoUrl)
  url.username = "x-access-token"
  url.password = githubToken
  return url.toString()
}

export async function cloneRepo(repoUrl: string, githubToken: string): Promise<void> {
  await run("git", ["clone", "--depth", "1", authenticatedCloneUrl(repoUrl, githubToken), WORKDIR])
}

export async function createFixBranch(branchName: string): Promise<void> {
  await run("git", ["-C", WORKDIR, "checkout", "-b", branchName])
}

export function applyPatch(diff: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn("git", ["-C", WORKDIR, "apply", "--whitespace=fix", "-"])
    child.on("error", reject)
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`git apply exited with code ${code}`))))
    child.stdin.end(diff)
  })
}

export async function commitAll(message: string): Promise<void> {
  await run("git", ["-C", WORKDIR, "-c", "user.email=necroshift@localhost", "-c", "user.name=Necroshift", "add", "-A"])
  await run("git", [
    "-C",
    WORKDIR,
    "-c",
    "user.email=necroshift@localhost",
    "-c",
    "user.name=Necroshift",
    "commit",
    "-m",
    message,
  ])
}

export async function pushBranch(branchName: string): Promise<void> {
  await run("git", ["-C", WORKDIR, "push", "origin", branchName])
}
