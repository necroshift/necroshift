import { describe, expect, test } from "vitest"
import { crashPayloadSchema, logPayloadSchema } from "./ingestion"

describe("logPayloadSchema", () => {
  test("accepts a level and message", () => {
    const result = logPayloadSchema.safeParse({ level: "error", message: "Payment failed" })
    expect(result.success).toBe(true)
  })

  test("accepts an empty object (both fields optional)", () => {
    expect(logPayloadSchema.safeParse({}).success).toBe(true)
  })

  test("keeps unknown fields (passthrough) for the raw payload", () => {
    const result = logPayloadSchema.parse({ message: "x", requestId: "abc" })
    expect(result.requestId).toBe("abc")
  })

  test("rejects a non-object payload", () => {
    expect(logPayloadSchema.safeParse("not an object").success).toBe(false)
  })
})

describe("crashPayloadSchema", () => {
  test("accepts a message", () => {
    expect(crashPayloadSchema.safeParse({ message: "Segfault" }).success).toBe(true)
  })

  test("rejects a non-object payload", () => {
    expect(crashPayloadSchema.safeParse(null).success).toBe(false)
  })
})
