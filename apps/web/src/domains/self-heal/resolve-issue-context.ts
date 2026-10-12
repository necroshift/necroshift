import "server-only"
import { desc, eq } from "drizzle-orm"
import { db } from "@workspace/db/client"
import { crashReport, issue, project } from "@workspace/db/schema"

export type IssueContext = {
  issueId: string
  title: string
  projectId: string
  organizationId: string
  repoUrl: string | null
  latestOccurrence: unknown | null
}

export async function resolveIssueContext(issueId: string): Promise<IssueContext | null> {
  const [row] = await db
    .select({
      title: issue.title,
      projectId: project.id,
      organizationId: project.organizationId,
      repoUrl: project.repoUrl,
    })
    .from(issue)
    .innerJoin(project, eq(issue.projectId, project.id))
    .where(eq(issue.id, issueId))
    .limit(1)
  if (!row) return null

  const [crash] = await db
    .select({ rawPayload: crashReport.rawPayload })
    .from(crashReport)
    .where(eq(crashReport.issueId, issueId))
    .orderBy(desc(crashReport.receivedAt))
    .limit(1)

  return { issueId, ...row, latestOccurrence: crash?.rawPayload ?? null }
}
