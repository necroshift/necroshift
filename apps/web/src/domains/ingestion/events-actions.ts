"use server"

import { and, desc, eq } from "drizzle-orm"
import { db } from "@workspace/db/client"
import { ingestionEvent, project } from "@workspace/db/schema"
import { getShellContext } from "@/src/domains/shell/get-shell-context"
import { requireSession } from "@/src/domains/auth/require-session"

export type IngestionEventRow = {
  id: string
  projectName: string
  payloadType: "log" | "crash"
  status: "success" | "error"
  errorReason: string | null
  httpStatus: number
  receivedAt: Date
}

export async function listIngestionEvents(filter: {
  projectId?: string
  status?: "success" | "error"
}): Promise<IngestionEventRow[]> {
  await requireSession()
  const context = await getShellContext()
  if (!context) return []

  const conditions = [eq(project.organizationId, context.organization.id)]
  if (filter.projectId) conditions.push(eq(ingestionEvent.projectId, filter.projectId))
  if (filter.status) conditions.push(eq(ingestionEvent.status, filter.status))

  return db
    .select({
      id: ingestionEvent.id,
      projectName: project.name,
      payloadType: ingestionEvent.payloadType,
      status: ingestionEvent.status,
      errorReason: ingestionEvent.errorReason,
      httpStatus: ingestionEvent.httpStatus,
      receivedAt: ingestionEvent.receivedAt,
    })
    .from(ingestionEvent)
    .innerJoin(project, eq(project.id, ingestionEvent.projectId))
    .where(and(...conditions))
    .orderBy(desc(ingestionEvent.receivedAt))
    .limit(200)
}
