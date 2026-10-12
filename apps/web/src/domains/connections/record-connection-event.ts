import "server-only"
import { sql } from "drizzle-orm"
import { db } from "@workspace/db/client"
import { connectionEvent } from "@workspace/db/schema"

const RETENTION_PER_ORG_PROVIDER = 100

export type ConnectionEventInput = {
  organizationId: string
  provider: "jira" | "linear"
  projectId: string | null
  status: "success" | "error"
  errorReason?: string
}

// Never throws: event logging must not block ticket creation (mirrors
// ingestion's record-event.ts — same "diagnosable without server logs" goal).
export async function recordConnectionEvent(input: ConnectionEventInput): Promise<void> {
  try {
    await db.insert(connectionEvent).values(input)
    await trimToRetentionLimit(input.organizationId, input.provider)
  } catch (error) {
    console.error("Failed to record connection event", error)
  }
}

async function trimToRetentionLimit(organizationId: string, provider: string): Promise<void> {
  await db.execute(sql`
    DELETE FROM connection_event
    WHERE organization_id = ${organizationId} AND provider = ${provider}
      AND id NOT IN (
        SELECT id FROM connection_event
        WHERE organization_id = ${organizationId} AND provider = ${provider}
        ORDER BY created_at DESC
        LIMIT ${RETENTION_PER_ORG_PROVIDER}
      )
  `)
}
