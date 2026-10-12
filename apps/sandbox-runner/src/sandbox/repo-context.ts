import { execFile } from "node:child_process"
import { readFile } from "node:fs/promises"
import { promisify } from "node:util"
import { WORKDIR } from "./git"

const run = promisify(execFile)
const MAX_FILES = 200

export async function listRepoFiles(): Promise<string[]> {
  const { stdout } = await run("git", ["-C", WORKDIR, "ls-files"])
  return stdout.split("\n").filter(Boolean).slice(0, MAX_FILES)
}

// Best-effort "targeted file access" for v1: if the crash text mentions a
// path that's actually in the repo, read it so the model has real code to
// work from instead of just a file listing — short of a full tool-use loop.
export function guessReferencedFile(text: string, files: string[]): string | null {
  return files.find((f) => text.includes(f)) ?? null
}

export async function readRepoFile(relativePath: string): Promise<string | null> {
  try {
    return await readFile(`${WORKDIR}/${relativePath}`, "utf8")
  } catch {
    return null
  }
}
