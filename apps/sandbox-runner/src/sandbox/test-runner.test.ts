import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

let workDir: string

async function freshRunner() {
  vi.resetModules()
  return import("./test-runner")
}

beforeEach(() => {
  workDir = mkdtempSync(join(tmpdir(), "necroshift-testrunner-"))
  process.env.SANDBOX_WORKDIR = workDir
})

afterEach(() => {
  delete process.env.SANDBOX_WORKDIR
  rmSync(workDir, { recursive: true, force: true })
})

function writePackageJson(testScript: string | undefined): void {
  const pkg = { name: "fixture", version: "1.0.0", scripts: testScript ? { test: testScript } : {} }
  writeFileSync(join(workDir, "package.json"), JSON.stringify(pkg))
}

describe("runProjectTests", () => {
  test("reports unverified when there's no test script", async () => {
    writePackageJson(undefined)
    const { runProjectTests } = await freshRunner()
    const result = await runProjectTests()
    expect(result).toEqual({ verified: false, passed: false, output: "No test script found in package.json." })
  }, 30_000)

  test("passes when the test script exits 0", async () => {
    writePackageJson('node -e "process.exit(0)"')
    const { runProjectTests } = await freshRunner()
    const result = await runProjectTests()
    expect(result.verified).toBe(true)
    expect(result.passed).toBe(true)
  }, 30_000)

  test("fails when the test script exits non-zero", async () => {
    writePackageJson('node -e "process.exit(1)"')
    const { runProjectTests } = await freshRunner()
    const result = await runProjectTests()
    expect(result.verified).toBe(true)
    expect(result.passed).toBe(false)
  }, 30_000)
})
