import { describe, expect, test } from "vitest"
import { buildJiraAuthorizeUrl } from "./jira-oauth"

describe("buildJiraAuthorizeUrl", () => {
  test("points at Atlassian's authorize endpoint with the right params", () => {
    const url = new URL(buildJiraAuthorizeUrl("state123"))
    expect(url.origin + url.pathname).toBe("https://auth.atlassian.com/authorize")
    expect(url.searchParams.get("audience")).toBe("api.atlassian.com")
    expect(url.searchParams.get("state")).toBe("state123")
    expect(url.searchParams.get("response_type")).toBe("code")
    expect(url.searchParams.get("redirect_uri")).toContain("/api/connections/jira/callback")
    expect(url.searchParams.get("scope")).toContain("write:jira-work")
  })
})
