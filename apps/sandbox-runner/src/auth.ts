import type { IncomingMessage } from "node:http"

export function isAuthorized(req: IncomingMessage, sharedSecret: string): boolean {
  const header = req.headers.authorization ?? ""
  return header === `Bearer ${sharedSecret}`
}
