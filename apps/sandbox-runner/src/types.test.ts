import { describe, expect, test } from "vitest"
import { isRunRequest } from "./types"

const valid = {
  runId: "r1",
  repoUrl: "https://github.com/acme/payments-api",
  githubToken: "ghp_abc",
  llmProvider: "anthropic",
  llmApiKey: "sk-abc",
  issueTitle: "NullPointerException",
  latestOccurrence: { message: "boom" },
}

describe("isRunRequest", () => {
  test("accepts a well-formed request", () => {
    expect(isRunRequest(valid)).toBe(true)
  })

  test("rejects a missing field", () => {
    const { repoUrl: _repoUrl, ...rest } = valid
    expect(isRunRequest(rest)).toBe(false)
  })

  test("rejects an invalid llmProvider", () => {
    expect(isRunRequest({ ...valid, llmProvider: "cohere" })).toBe(false)
  })

  test("rejects non-objects", () => {
    expect(isRunRequest(null)).toBe(false)
    expect(isRunRequest("hello")).toBe(false)
  })
})
