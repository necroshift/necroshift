import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto"

const ALGORITHM = "aes-256-gcm"
const AUTH_TAG_LENGTH = 16

function getEncryptionKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY
  if (!raw) throw new Error("Missing required env var: ENCRYPTION_KEY")
  const key = Buffer.from(raw, "base64")
  if (key.length !== 32) throw new Error("ENCRYPTION_KEY must decode to exactly 32 bytes")
  return key
}

export function encrypt(plaintext: string): { ciphertext: string; nonce: string } {
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGORITHM, getEncryptionKey(), iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final(), cipher.getAuthTag()])
  return { ciphertext: encrypted.toString("base64"), nonce: iv.toString("base64") }
}

export function decrypt(ciphertext: string, nonce: string): string {
  const data = Buffer.from(ciphertext, "base64")
  const authTag = data.subarray(data.length - AUTH_TAG_LENGTH)
  const encrypted = data.subarray(0, data.length - AUTH_TAG_LENGTH)
  const decipher = createDecipheriv(ALGORITHM, getEncryptionKey(), Buffer.from(nonce, "base64"))
  decipher.setAuthTag(authTag)
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8")
}

export function maskSecret(plaintext: string): string {
  const prefix = plaintext.slice(0, 7)
  const suffix = plaintext.slice(-4)
  return `${prefix}${"•".repeat(8)}${suffix}`
}
