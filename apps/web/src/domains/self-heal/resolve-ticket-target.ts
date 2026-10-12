import "server-only"
import { eq } from "drizzle-orm"
import { db } from "@workspace/db/client"
import { projectRouting } from "@workspace/db/schema"
import { getDecryptedConnection } from "@/src/domains/connections/connection-store"

export type TicketTarget = {
  provider: "jira" | "linear"
  accessToken: string
  targetId: string
  targetName: string
  cloudId: string | null
  siteUrl: string | null
}

// Optional — most self-heal runs have no ticket target configured, and
// that's fine (CLAUDE.md: ticket filing is opt-in per project). Jira is
// preferred over Linear when a project is somehow routed to both — same
// arbitrary, documented tie-break pattern as resolve-llm-credential.ts.
export async function resolveTicketTarget(projectId: string, organizationId: string): Promise<TicketTarget | null> {
  const rows = await db.select().from(projectRouting).where(eq(projectRouting.projectId, projectId))
  const jira = rows.find((r) => r.provider === "jira")
  const linear = rows.find((r) => r.provider === "linear")
  const routing = jira ?? linear
  if (!routing) return null

  const conn = await getDecryptedConnection(organizationId, routing.provider)
  if (!conn) return null

  return {
    provider: routing.provider,
    accessToken: conn.accessToken,
    targetId: routing.targetId,
    targetName: routing.targetName,
    cloudId: conn.cloudId,
    siteUrl: conn.siteUrl,
  }
}
