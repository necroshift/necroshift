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

  test("rejects a repoUrl that isn't a plain github.com https URL", () => {
    expect(isRunRequest({ ...valid, repoUrl: "https://evil.example.com/acme/payments-api" })).toBe(false)
    expect(isRunRequest({ ...valid, repoUrl: "-x" })).toBe(false)
    expect(isRunRequest({ ...valid, repoUrl: "git@github.com:acme/payments-api.git" })).toBe(false)
  })

  test("rejects a newline in fields written verbatim into the sandbox's env-file", () => {
    expect(isRunRequest({ ...valid, githubToken: "ghp_abc\nEVIL=1" })).toBe(false)
    expect(isRunRequest({ ...valid, llmApiKey: "sk-abc\r\nEVIL=1" })).toBe(false)
    expect(isRunRequest({ ...valid, runId: "r1\nEVIL=1" })).toBe(false)
  })
})
