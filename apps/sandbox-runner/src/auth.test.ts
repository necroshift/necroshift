import { describe, expect, test } from "vitest"
import type { IncomingMessage } from "node:http"
import { isAuthorized } from "./auth"

function requestWith(authorization?: string): IncomingMessage {
  return { headers: { authorization } } as IncomingMessage
}

describe("isAuthorized", () => {
  test("accepts the exact shared secret as a bearer token", () => {
    expect(isAuthorized(requestWith("Bearer s3cret"), "s3cret")).toBe(true)
  })

  test("rejects a missing header", () => {
    expect(isAuthorized(requestWith(undefined), "s3cret")).toBe(false)
  })

  test("rejects a wrong secret", () => {
    expect(isAuthorized(requestWith("Bearer wrong"), "s3cret")).toBe(false)
  })

  test("rejects a malformed scheme", () => {
    expect(isAuthorized(requestWith("s3cret"), "s3cret")).toBe(false)
  })
})
