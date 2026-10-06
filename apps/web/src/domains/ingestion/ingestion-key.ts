import { createHash, randomBytes } from "node:crypto"

export function generateIngestionKey(): { plaintext: string; hash: string } {
  const plaintext = `nk_live_${randomBytes(24).toString("base64url")}`
  return { plaintext, hash: hashIngestionKey(plaintext) }
}

export function hashIngestionKey(plaintext: string): string {
  return createHash("sha256").update(plaintext).digest("hex")
}
