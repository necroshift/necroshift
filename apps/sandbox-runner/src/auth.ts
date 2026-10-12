import { createHash, timingSafeEqual } from "node:crypto"
import type { IncomingMessage } from "node:http"

// A plain === comparison leaks timing information an attacker could use to
// guess the secret byte by byte. Hashing both sides first gives a
// fixed-length comparison (so timingSafeEqual never throws on a length
// mismatch) without leaking the real secret's length either.
export function isAuthorized(req: IncomingMessage, sharedSecret: string): boolean {
  const header = req.headers.authorization ?? ""
  const expected = createHash("sha256").update(`Bearer ${sharedSecret}`).digest()
  const actual = createHash("sha256").update(header).digest()
  return timingSafeEqual(actual, expected)
}
