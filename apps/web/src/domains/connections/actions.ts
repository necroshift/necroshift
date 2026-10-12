"use server"

import { and, desc, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@workspace/db/client"
import { connection, connectionEvent, project, projectRouting } from "@workspace/db/schema"
import { requireSession } from "@/src/domains/auth/require-session"
import { getShellContext } from "@/src/domains/shell/get-shell-context"
import { ok, type ActionResult } from "@/src/lib/action-result"
import { getDecryptedConnection } from "./connection-store"
import { listJiraProjects, listLinearTeams, type RoutingTarget } from "./list-targets"

export type Provider = "jira" | "linear"

export type ConnectionSummary = { provider: Provider; connected: boolean; label: string | null }

export async function listConnections(): Promise<ConnectionSummary[]> {
  await requireSession()
  const context = await getShellContext()
  if (!context) return emptyConnections()
  const rows = await db.select().from(connection).where(eq(connection.organizationId, context.organization.id))
  return (["jira", "linear"] as const).map((provider) => summarize(provider, rows))
}

function emptyConnections(): ConnectionSummary[] {
  return (["jira", "linear"] as const).map((provider) => ({ provider, connected: false, label: null }))
}

function summarize(provider: Provider, rows: (typeof connection.$inferSelect)[]): ConnectionSummary {
  const row = rows.find((r) => r.provider === provider)
  if (!row) return { provider, connected: false, label: null }
  return { provider, connected: true, label: row.siteUrl ?? "Connected" }
}

export async function disconnectConnection(provider: Provider): Promise<void> {
  await requireSession()
  const context = await getShellContext()
  if (!context) return
  await db
    .delete(connection)
    .where(and(eq(connection.organizationId, context.organization.id), eq(connection.provider, provider)))
  revalidatePath("/settings/connections")
}

export type RoutingRow = { projectId: string; provider: Provider; targetId: string; targetName: string }

export async function listProjectRouting(): Promise<RoutingRow[]> {
  await requireSession()
  const context = await getShellContext()
  if (!context) return []
  return db
    .select({
      projectId: projectRouting.projectId,
      provider: projectRouting.provider,
      targetId: projectRouting.targetId,
      targetName: projectRouting.targetName,
    })
    .from(projectRouting)
    .innerJoin(project, eq(projectRouting.projectId, project.id))
    .where(eq(project.organizationId, context.organization.id))
}

export async function setProjectRouting(input: {
  projectId: string
  provider: Provider
  targetId: string
  targetName: string
}): Promise<ActionResult<null>> {
  await requireSession()
  await db
    .insert(projectRouting)
    .values(input)
    .onConflictDoUpdate({
      target: [projectRouting.projectId, projectRouting.provider],
      set: { targetId: input.targetId, targetName: input.targetName },
    })
  revalidatePath("/settings/connections")
  return ok(null)
}

export async function clearProjectRouting(projectId: string, provider: Provider): Promise<void> {
  await requireSession()
  await db.delete(projectRouting).where(and(eq(projectRouting.projectId, projectId), eq(projectRouting.provider, provider)))
  revalidatePath("/settings/connections")
}

export async function listRoutingTargets(provider: Provider): Promise<RoutingTarget[]> {
  await requireSession()
  const context = await getShellContext()
  if (!context) return []
  const conn = await getDecryptedConnection(context.organization.id, provider)
  if (!conn) return []
  if (provider === "jira") return conn.cloudId ? listJiraProjects(conn.accessToken, conn.cloudId) : []
  return listLinearTeams(conn.accessToken)
}

export type ConnectionEventRow = {
  id: string
  provider: Provider
  status: "success" | "error"
  errorReason: string | null
  createdAt: Date
}

export async function listConnectionEvents(): Promise<ConnectionEventRow[]> {
  await requireSession()
  const context = await getShellContext()
  if (!context) return []
  return db
    .select({
      id: connectionEvent.id,
      provider: connectionEvent.provider,
      status: connectionEvent.status,
      errorReason: connectionEvent.errorReason,
      createdAt: connectionEvent.createdAt,
    })
    .from(connectionEvent)
    .where(eq(connectionEvent.organizationId, context.organization.id))
    .orderBy(desc(connectionEvent.createdAt))
    .limit(100)
}
