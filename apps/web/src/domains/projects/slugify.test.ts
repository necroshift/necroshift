import { describe, expect, test } from "vitest"
import { slugify } from "./slugify"

describe("slugify", () => {
  test("lowercases and dashes spaces", () => {
    expect(slugify("Payments API")).toBe("payments-api")
  })

  test("collapses punctuation into a single dash", () => {
    expect(slugify("Notifications & Worker!!")).toBe("notifications-worker")
  })

  test("trims leading and trailing dashes", () => {
    expect(slugify("  --Edge Case--  ")).toBe("edge-case")
  })
})
