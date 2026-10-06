import { describe, expect, test } from "vitest"
import { generateIngestionKey, hashIngestionKey } from "./ingestion-key"

describe("generateIngestionKey", () => {
  test("produces a key with the nk_live_ prefix", () => {
    const { plaintext } = generateIngestionKey()
    expect(plaintext.startsWith("nk_live_")).toBe(true)
  })

  test("produces a hash matching hashIngestionKey(plaintext)", () => {
    const { plaintext, hash } = generateIngestionKey()
    expect(hashIngestionKey(plaintext)).toBe(hash)
  })

  test("produces a different key on every call", () => {
    expect(generateIngestionKey().plaintext).not.toBe(generateIngestionKey().plaintext)
  })
})
