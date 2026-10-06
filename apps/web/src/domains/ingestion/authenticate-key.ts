import "server-only"
import { and, eq } from "drizzle-orm"
import { db } from "@workspace/db/client"
import { ingestionKey } from "@workspace/db/schema"
import { hashIngestionKey } from "./ingestion-key"

export async function authenticateIngestionKey(
  projectId: string,
  bearerToken: string | null,
): Promise<{ id: string } | null> {
  if (!bearerToken) return null
  const hash = hashIngestionKey(bearerToken)
  const [key] = await db
    .select({ id: ingestionKey.id })
    .from(ingestionKey)
    .where(and(eq(ingestionKey.projectId, projectId), eq(ingestionKey.keyHash, hash)))
    .limit(1)
  return key ?? null
}
