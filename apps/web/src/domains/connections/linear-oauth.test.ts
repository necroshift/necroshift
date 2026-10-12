import { afterEach, describe, expect, test, vi } from "vitest"
import { buildLinearAuthorizeUrl, isLinearConfigured } from "./linear-oauth"

describe("buildLinearAuthorizeUrl", () => {
  test("points at Linear's authorize endpoint with the right params", () => {
    const url = new URL(buildLinearAuthorizeUrl("state123"))
    expect(url.origin + url.pathname).toBe("https://linear.app/oauth/authorize")
    expect(url.searchParams.get("state")).toBe("state123")
    expect(url.searchParams.get("response_type")).toBe("code")
    expect(url.searchParams.get("scope")).toBe("read,write")
    expect(url.searchParams.get("redirect_uri")).toContain("/api/connections/linear/callback")
  })
})

describe("isLinearConfigured", () => {
  afterEach(() => vi.unstubAllEnvs())

  test("true when both LINEAR_CLIENT_ID and LINEAR_CLIENT_SECRET are set", () => {
    vi.stubEnv("LINEAR_CLIENT_ID", "id")
    vi.stubEnv("LINEAR_CLIENT_SECRET", "secret")
    expect(isLinearConfigured()).toBe(true)
  })

  test("false when LINEAR_CLIENT_ID is missing", () => {
    vi.stubEnv("LINEAR_CLIENT_ID", "")
    vi.stubEnv("LINEAR_CLIENT_SECRET", "secret")
    expect(isLinearConfigured()).toBe(false)
  })

  test("false when LINEAR_CLIENT_SECRET is missing", () => {
    vi.stubEnv("LINEAR_CLIENT_ID", "id")
    vi.stubEnv("LINEAR_CLIENT_SECRET", "")
    expect(isLinearConfigured()).toBe(false)
  })
})
