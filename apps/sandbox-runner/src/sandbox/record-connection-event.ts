import { db } from "@workspace/db/client"
import { connectionEvent } from "@workspace/db/schema"

// Mirrors the web app's record-connection-event.ts (same table, same
// "never block the real work" contract) — the sandbox has its own direct
// Postgres connection, so it writes this event itself rather than calling
// back through the web app.
export async function recordConnectionEvent(input: {
  organizationId: string
  provider: "jira" | "linear"
  projectId: string
  status: "success" | "error"
  errorReason?: string
}): Promise<void> {
  try {
    await db.insert(connectionEvent).values(input)
  } catch (error) {
    console.error("Failed to record connection event", error)
  }
}
