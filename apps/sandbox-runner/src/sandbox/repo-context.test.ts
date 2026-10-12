import { describe, expect, test } from "vitest"
import { guessReferencedFile } from "./repo-context"

describe("guessReferencedFile", () => {
  const files = ["src/PaymentService.java", "src/ChargeController.java", "README.md"]

  test("finds a file path mentioned in the text", () => {
    expect(guessReferencedFile("at src/PaymentService.java:142", files)).toBe("src/PaymentService.java")
  })

  test("returns null when nothing matches", () => {
    expect(guessReferencedFile("totally unrelated text", files)).toBeNull()
  })
})
