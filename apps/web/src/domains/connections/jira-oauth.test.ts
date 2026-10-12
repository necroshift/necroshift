import { afterEach, describe, expect, test, vi } from "vitest"
import { buildJiraAuthorizeUrl, isJiraConfigured } from "./jira-oauth"

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

describe("isJiraConfigured", () => {
  afterEach(() => vi.unstubAllEnvs())

  test("true when both JIRA_CLIENT_ID and JIRA_CLIENT_SECRET are set", () => {
    vi.stubEnv("JIRA_CLIENT_ID", "id")
    vi.stubEnv("JIRA_CLIENT_SECRET", "secret")
    expect(isJiraConfigured()).toBe(true)
  })

  test("false when JIRA_CLIENT_ID is missing", () => {
    vi.stubEnv("JIRA_CLIENT_ID", "")
    vi.stubEnv("JIRA_CLIENT_SECRET", "secret")
    expect(isJiraConfigured()).toBe(false)
  })

  test("false when JIRA_CLIENT_SECRET is missing", () => {
    vi.stubEnv("JIRA_CLIENT_ID", "id")
    vi.stubEnv("JIRA_CLIENT_SECRET", "")
    expect(isJiraConfigured()).toBe(false)
  })
})
