import "server-only"
import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@workspace/db/client"
import { crashReport, logEntry, project } from "@workspace/db/schema"
import { crashPayloadSchema, logPayloadSchema } from "@workspace/contracts/ingestion"
import { authenticateIngestionKey } from "./authenticate-key"
import { recordIngestionEvent } from "./record-event"

type PayloadType = "log" | "crash"

// The URL names a project by its slug (readable, the form every ingestion
// snippet shown in the UI uses) — resolve that to the real id once, then
// work with the id everywhere else (ingestion_key/log_entry/crash_report/
// ingestion_event all reference project.id, not its slug).
export async function handleIngestionRequest(request: Request, projectSlug: string, payloadType: PayloadType) {
  const projectId = await resolveProjectId(projectSlug)
  if (!projectId) return NextResponse.json({ error: "not_found" }, { status: 404 })

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

async function resolveProjectId(slug: string): Promise<string | null> {
  const [row] = await db.select({ id: project.id }).from(project).where(eq(project.slug, slug)).limit(1)
  return row?.id ?? null
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
