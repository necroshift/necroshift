import "server-only"
import { getCurrentSession } from "./get-current-session"

// Server actions are directly callable endpoints, not just UI-gated
// buttons — every one that touches org data must check this itself.
export async function requireSession() {
  const session = await getCurrentSession()
  if (!session) throw new Error("Unauthorized")
  return session
}
