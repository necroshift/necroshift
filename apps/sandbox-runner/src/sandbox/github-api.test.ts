import { describe, expect, test } from "vitest"
import { parseRepoUrl } from "./github-api"

describe("parseRepoUrl", () => {
  test("parses a plain https GitHub URL", () => {
    expect(parseRepoUrl("https://github.com/acme/payments-api")).toEqual({ owner: "acme", repo: "payments-api" })
  })

  test("strips a trailing .git", () => {
    expect(parseRepoUrl("https://github.com/acme/payments-api.git")).toEqual({ owner: "acme", repo: "payments-api" })
  })

  test("strips a trailing slash", () => {
    expect(parseRepoUrl("https://github.com/acme/payments-api/")).toEqual({ owner: "acme", repo: "payments-api" })
  })

  test("throws on a non-GitHub URL", () => {
    expect(() => parseRepoUrl("https://gitlab.com/acme/payments-api")).toThrow()
  })
})
