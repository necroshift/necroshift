"use server"

import { revalidatePath } from "next/cache"
import { desc, eq } from "drizzle-orm"
import { db } from "@workspace/db/client"
import { crashReport, issue, project } from "@workspace/db/schema"
import { requireSession } from "@/src/domains/auth/require-session"

export type IssueSummary = {
  id: string
  title: string
  status: "open" | "resolved"
  occurrenceCount: number
  lastSeenAt: Date
  projectName: string
}

export type IssueDetail = IssueSummary & { firstSeenAt: Date }

export async function listIssues(): Promise<IssueSummary[]> {
  await requireSession()
  const rows = await db
    .select({
      id: issue.id,
      title: issue.title,
      status: issue.status,
      occurrenceCount: issue.occurrenceCount,
      lastSeenAt: issue.lastSeenAt,
      projectName: project.name,
    })
    .from(issue)
    .innerJoin(project, eq(issue.projectId, project.id))
    .orderBy(desc(issue.lastSeenAt))
  return rows
}

export async function getIssue(id: string): Promise<IssueDetail | null> {
  await requireSession()
  const [row] = await db
    .select({
      id: issue.id,
      title: issue.title,
      status: issue.status,
      occurrenceCount: issue.occurrenceCount,
      firstSeenAt: issue.firstSeenAt,
      lastSeenAt: issue.lastSeenAt,
      projectName: project.name,
    })
    .from(issue)
    .innerJoin(project, eq(issue.projectId, project.id))
    .where(eq(issue.id, id))
    .limit(1)
  return row ?? null
}

export async function getLatestOccurrence(issueId: string): Promise<unknown | null> {
  await requireSession()
  const [row] = await db
    .select({ rawPayload: crashReport.rawPayload })
    .from(crashReport)
    .where(eq(crashReport.issueId, issueId))
    .orderBy(desc(crashReport.receivedAt))
    .limit(1)
  return row?.rawPayload ?? null
}

export async function markResolved(id: string): Promise<void> {
  await requireSession()
  await db.update(issue).set({ status: "resolved" }).where(eq(issue.id, id))
  revalidatePath("/")
  revalidatePath(`/issues/${id}`)
}
