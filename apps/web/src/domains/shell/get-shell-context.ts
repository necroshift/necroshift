import "server-only"
import { eq } from "drizzle-orm"
import { db } from "@workspace/db/client"
import { organization, project } from "@workspace/db/schema"

export type ShellContext = {
  organization: { id: string; name: string }
  firstProject: { id: string; name: string; slug: string } | null
}

// Necroshift is one deployment per organization: there is exactly one
// organization row for the lifetime of a deployment, created by onboarding.
export async function getShellContext(): Promise<ShellContext | null> {
  const [org] = await db.select({ id: organization.id, name: organization.name }).from(organization).limit(1)
  if (!org) return null
  const [firstProject] = await db
    .select({ id: project.id, name: project.name, slug: project.slug })
    .from(project)
    .where(eq(project.organizationId, org.id))
    .limit(1)
  return { organization: org, firstProject: firstProject ?? null }
}
