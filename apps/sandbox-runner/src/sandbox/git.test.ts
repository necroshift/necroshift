import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"
import { execFileSync } from "node:child_process"
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

let remoteDir: string
let workDir: string

// WORKDIR is read from SANDBOX_WORKDIR at module-load time, so the module
// under test must be re-evaluated after the env var is set — a static
// top-level import would capture the default "/work/repo" instead.
async function freshGit() {
  vi.resetModules()
  return import("./git")
}

beforeEach(() => {
  remoteDir = mkdtempSync(join(tmpdir(), "necroshift-remote-"))
  execFileSync("git", ["init", "--bare", "--initial-branch=main"], { cwd: remoteDir })

  const seedDir = mkdtempSync(join(tmpdir(), "necroshift-seed-"))
  execFileSync("git", ["clone", remoteDir, seedDir])
  writeFileSync(join(seedDir, "a.txt"), "hello\n")
  gitAs(seedDir, "add", "-A")
  gitAs(seedDir, "commit", "-m", "init")
  execFileSync("git", ["-C", seedDir, "push", "origin", "HEAD:main"])

  workDir = join(mkdtempSync(join(tmpdir(), "necroshift-work-")), "repo")
  execFileSync("git", ["clone", remoteDir, workDir])
  process.env.SANDBOX_WORKDIR = workDir
})

afterEach(() => {
  delete process.env.SANDBOX_WORKDIR
  rmSync(remoteDir, { recursive: true, force: true })
})

function gitAs(dir: string, ...args: string[]): void {
  execFileSync("git", ["-C", dir, "-c", "user.email=t@t.com", "-c", "user.name=t", ...args])
}

describe("git helpers", () => {
  test("applyPatch + commitAll + pushBranch lands a change on the remote", async () => {
    const git = await freshGit()
    await git.createFixBranch("necroshift/fix-test")

    const diff = ["--- a/a.txt", "+++ b/a.txt", "@@ -1 +1 @@", "-hello", "+hello world"].join("\n") + "\n"
    await git.applyPatch(diff)
    await git.commitAll("test fix")
    await git.pushBranch("necroshift/fix-test")

    const checkDir = mkdtempSync(join(tmpdir(), "necroshift-check-"))
    execFileSync("git", ["clone", "--branch", "necroshift/fix-test", remoteDir, checkDir])
    expect(readFileSync(join(checkDir, "a.txt"), "utf8")).toBe("hello world\n")
    rmSync(checkDir, { recursive: true, force: true })
  })
})

describe("authenticatedCloneUrl", () => {
  test("embeds the token as the password on an https URL", async () => {
    const git = await freshGit()
    const url = git.authenticatedCloneUrl("https://github.com/acme/repo", "ghp_abc123")
    expect(url).toBe("https://x-access-token:ghp_abc123@github.com/acme/repo")
  })
})
