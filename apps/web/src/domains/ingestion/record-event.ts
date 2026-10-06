import "server-only"
import { sql } from "drizzle-orm"
import { db } from "@workspace/db/client"
import { ingestionEvent } from "@workspace/db/schema"

const RETENTION_PER_PROJECT = 100

export type IngestionEventInput = {
  projectId: string
  ingestionKeyId: string | null
  payloadType: "log" | "crash"
  status: "success" | "error"
  errorReason?: "invalid_key" | "invalid_payload" | "internal_error"
  httpStatus: number
}

// Never throws: event logging must not break ingestion itself (spec §5/§6).
export async function recordIngestionEvent(input: IngestionEventInput): Promise<void> {
  try {
    await db.insert(ingestionEvent).values(input)
    await trimToRetentionLimit(input.projectId)
  } catch (error) {
    console.error("Failed to record ingestion event", error)
  }
}

async function trimToRetentionLimit(projectId: string): Promise<void> {
  await db.execute(sql`
    DELETE FROM ingestion_event
    WHERE project_id = ${projectId}
      AND id NOT IN (
        SELECT id FROM ingestion_event
        WHERE project_id = ${projectId}
        ORDER BY received_at DESC
        LIMIT ${RETENTION_PER_PROJECT}
      )
  `)
}
