import { describe, expect, test } from "vitest"
import { toAdf } from "./jira-ticket"

describe("toAdf", () => {
  test("wraps plain text in the minimal valid Atlassian Document Format shape", () => {
    expect(toAdf("hello world")).toEqual({
      type: "doc",
      version: 1,
      content: [{ type: "paragraph", content: [{ type: "text", text: "hello world" }] }],
    })
  })
})
