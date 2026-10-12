import { describe, expect, test } from "vitest"
import { parseResponse } from "./llm"

describe("parseResponse", () => {
  test("extracts summary and diff from a well-formed response", () => {
    const raw = [
      "SUMMARY: Null check added for guest checkouts.",
      "",
      "DIFF:",
      "```diff",
      "--- a/x.js",
      "+++ b/x.js",
      "@@ -1 +1 @@",
      "-old",
      "+new",
      "```",
    ].join("\n")
    const result = parseResponse(raw)
    expect(result.summary).toBe("Null check added for guest checkouts.")
    expect(result.diff).toContain("+new")
  })

  test("falls back to a plain code fence if 'diff' isn't labeled", () => {
    const raw = "SUMMARY: Fixed it.\n\nDIFF:\n```\n--- a/x\n+++ b/x\n```"
    expect(parseResponse(raw).diff).toContain("--- a/x")
  })

  test("throws when no diff block is present", () => {
    expect(() => parseResponse("SUMMARY: Could not find a fix.")).toThrow()
  })
})
