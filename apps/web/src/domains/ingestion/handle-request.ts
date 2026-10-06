import "server-only"
import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@workspace/db/client"
import { crashReport, logEntry, project } from "@workspace/db/schema"
import { crashPayloadSchema, logPayloadSchema } from "@workspace/contracts/ingestion"
import { authenticateIngestionKey } from "./authenticate-key"
import { recordIngestionEvent } from "./record-event"

type PayloadType = "log" | "crash"

export async function handleIngestionRequest(request: Request, projectId: string, payloadType: PayloadType) {
  const projectExists = await projectRowExists(projectId)
  if (!projectExists) return NextResponse.json({ error: "not_found" }, { status: 404 })

  const key = await authenticateIngestionKey(projectId, bearerToken(request))
  if (!key) return respondAndLog(projectId, null, payloadType, 401, "invalid_key")

  const body = await request.json().catch(() => null)
  const parsed = (payloadType === "log" ? logPayloadSchema : crashPayloadSchema).safeParse(body)
  if (!parsed.success) return respondAndLog(projectId, key.id, payloadType, 400, "invalid_payload")

  try {
    await persistPayload(projectId, payloadType, parsed.data)
    await recordIngestionEvent({ projectId, ingestionKeyId: key.id, payloadType, status: "success", httpStatus: 200 })
    return NextResponse.json({ ok: true }, { status: 200 })
  } catch {
    return respondAndLog(projectId, key.id, payloadType, 500, "internal_error")
  }
}

async function projectRowExists(projectId: string): Promise<boolean> {
  const [row] = await db.select({ id: project.id }).from(project).where(eq(project.id, projectId)).limit(1)
  return Boolean(row)
}

function bearerToken(request: Request): string | null {
  const header = request.headers.get("authorization") ?? ""
  return header.startsWith("Bearer ") ? header.slice("Bearer ".length) : null
}

async function persistPayload(projectId: string, payloadType: PayloadType, data: Record<string, unknown>) {
  if (payloadType === "log") {
    await db.insert(logEntry).values({
      projectId,
      level: typeof data.level === "string" ? data.level : null,
      message: typeof data.message === "string" ? data.message : null,
      rawPayload: data,
    })
  } else {
    await db.insert(crashReport).values({
      projectId,
      message: typeof data.message === "string" ? data.message : null,
      rawPayload: data,
    })
  }
}

async function respondAndLog(
  projectId: string,
  ingestionKeyId: string | null,
  payloadType: PayloadType,
  httpStatus: 401 | 400 | 500,
  errorReason: "invalid_key" | "invalid_payload" | "internal_error",
) {
  await recordIngestionEvent({ projectId, ingestionKeyId, payloadType, status: "error", errorReason, httpStatus })
  return NextResponse.json({ error: errorReason }, { status: httpStatus })
}
