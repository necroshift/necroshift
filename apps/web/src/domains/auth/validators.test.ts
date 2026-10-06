import { describe, expect, test } from "vitest"
import { isValidEmail, isValidPassword } from "./validators"

describe("isValidEmail", () => {
  test("accepts a well-formed email", () => {
    expect(isValidEmail("owner@example.com")).toBe(true)
  })

  test("rejects text with no @", () => {
    expect(isValidEmail("not-an-email")).toBe(false)
  })

  test("rejects an empty string", () => {
    expect(isValidEmail("")).toBe(false)
  })
})

describe("isValidPassword", () => {
  test("accepts any non-empty value", () => {
    expect(isValidPassword("x")).toBe(true)
  })

  test("rejects an empty string", () => {
    expect(isValidPassword("")).toBe(false)
  })
})
