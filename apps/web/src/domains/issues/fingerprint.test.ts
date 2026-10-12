import { describe, expect, test } from "vitest"
import { fingerprintCrash } from "./fingerprint"

describe("fingerprintCrash", () => {
  test("same message produces the same fingerprint", () => {
    expect(fingerprintCrash("NullPointerException in charge()")).toBe(
      fingerprintCrash("NullPointerException in charge()"),
    )
  })

  test("is case- and whitespace-insensitive", () => {
    expect(fingerprintCrash("  Null Pointer  ")).toBe(fingerprintCrash("null pointer"))
  })

  test("different messages produce different fingerprints", () => {
    expect(fingerprintCrash("Error A")).not.toBe(fingerprintCrash("Error B"))
  })

  test("null and missing messages still produce a stable fingerprint", () => {
    expect(fingerprintCrash(null)).toBe(fingerprintCrash(null))
  })
})
