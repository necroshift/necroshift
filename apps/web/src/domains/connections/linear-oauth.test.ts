import { describe, expect, test } from "vitest"
import { buildLinearAuthorizeUrl } from "./linear-oauth"

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
