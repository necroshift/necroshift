import { execFile } from "node:child_process"
import { readFile } from "node:fs/promises"
import { promisify } from "node:util"
import { WORKDIR } from "./git"

const run = promisify(execFile)
const TEST_TIMEOUT_MS = 5 * 60 * 1000

export type TestResult = { verified: boolean; passed: boolean; output: string }

// "Verified" here means "a test suite ran to completion" — distinct from
// "passed". Install or detection failures aren't the fix's fault, so they
// fall into unverified-but-not-blocking, same as "no tests exist" (see the
// self-heal design spec's resolution of "what does 'tested' mean").
export async function runProjectTests(): Promise<TestResult> {
  if (!(await hasTestScript())) return { verified: false, passed: false, output: "No test script found in package.json." }
  if (!(await installDependencies())) return { verified: false, passed: false, output: "Dependency install failed." }
  return runTestScript()
}

async function hasTestScript(): Promise<boolean> {
  try {
    const pkg = JSON.parse(await readFile(`${WORKDIR}/package.json`, "utf8"))
    return Boolean(pkg.scripts?.test)
  } catch {
    return false
  }
}

async function installDependencies(): Promise<boolean> {
  try {
    await run("npm", ["install", "--no-audit", "--no-fund"], { cwd: WORKDIR, timeout: TEST_TIMEOUT_MS })
    return true
  } catch {
    return false
  }
}

async function runTestScript(): Promise<TestResult> {
  try {
    const { stdout, stderr } = await run("npm", ["test", "--silent"], { cwd: WORKDIR, timeout: TEST_TIMEOUT_MS })
    return { verified: true, passed: true, output: `${stdout}\n${stderr}`.trim() }
  } catch (error) {
    return { verified: true, passed: false, output: formatFailure(error) }
  }
}

function formatFailure(error: unknown): string {
  if (error && typeof error === "object" && "stdout" in error) {
    const e = error as { stdout?: string; stderr?: string }
    return `${e.stdout ?? ""}\n${e.stderr ?? ""}`.trim()
  }
  return String(error)
}
