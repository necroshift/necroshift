import { describe, expect, test } from "vitest"
import { decrypt, encrypt, maskSecret } from "./encryption"

describe("encrypt/decrypt", () => {
  test("round-trips a plaintext value", () => {
    const { ciphertext, nonce } = encrypt("sk-ant-super-secret-key")
    expect(decrypt(ciphertext, nonce)).toBe("sk-ant-super-secret-key")
  })

  test("never stores the plaintext in the ciphertext", () => {
    const { ciphertext } = encrypt("sk-ant-super-secret-key")
    expect(ciphertext).not.toContain("super-secret-key")
  })

  test("produces a different ciphertext and nonce on every call", () => {
    const a = encrypt("same-value")
    const b = encrypt("same-value")
    expect(a.ciphertext).not.toBe(b.ciphertext)
    expect(a.nonce).not.toBe(b.nonce)
  })
})

describe("maskSecret", () => {
  test("keeps the prefix and last 4 characters, masking the middle", () => {
    expect(maskSecret("sk-ant-abcdefghijklwX9k")).toBe("sk-ant-••••••••wX9k")
  })
})

describe("fail-fast on a missing or malformed ENCRYPTION_KEY", () => {
  const original = process.env.ENCRYPTION_KEY

  test("throws when ENCRYPTION_KEY is unset", () => {
    delete process.env.ENCRYPTION_KEY
    expect(() => encrypt("x")).toThrow(/ENCRYPTION_KEY/)
    process.env.ENCRYPTION_KEY = original
  })

  test("throws when ENCRYPTION_KEY does not decode to 32 bytes", () => {
    process.env.ENCRYPTION_KEY = Buffer.from("too short").toString("base64")
    expect(() => encrypt("x")).toThrow(/32 bytes/)
    process.env.ENCRYPTION_KEY = original
  })
})
