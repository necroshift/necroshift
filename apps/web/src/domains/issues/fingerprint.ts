import { createHash } from "node:crypto"

// Groups crash reports with the same message as one issue. Deliberately
// naive for v1 (exact message match, no stack-trace normalization) — see
// ISSUES.md's open question on grouping strategy.
export function fingerprintCrash(message: string | null): string {
  const normalized = (message ?? "unknown error").trim().toLowerCase()
  return createHash("sha256").update(normalized).digest("hex")
}
