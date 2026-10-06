"use server"

import { revalidatePath } from "next/cache"
import { desc, eq } from "drizzle-orm"
import { db } from "@workspace/db/client"
import { ingestionKey, project } from "@workspace/db/schema"
import { ok, fail, type ActionResult } from "@/src/lib/action-result"
import { getShellContext } from "@/src/domains/shell/get-shell-context"
import { generateIngestionKey } from "./ingestion-key"
import { slugify } from "./slugify"

export type ProjectSummary = {
  id: string
  name: string
  slug: string
  createdAt: Date
}

export async function listProjects(): Promise<ProjectSummary[]> {
  const context = await getShellContext()
  if (!context) return []
  return db
    .select({ id: project.id, name: project.name, slug: project.slug, createdAt: project.createdAt })
    .from(project)
    .where(eq(project.organizationId, context.organization.id))
    .orderBy(desc(project.createdAt))
}

export async function createProject(input: { name: string }): Promise<ActionResult<{ project: ProjectSummary; ingestionKey: string }>> {
  const name = input.name.trim()
  if (!name) return fail("Project name is required.")

  const context = await getShellContext()
  if (!context) return fail("No organization configured yet.")

  const { plaintext, hash } = generateIngestionKey()
  try {
    const [created] = await db
      .insert(project)
      .values({ organizationId: context.organization.id, name, slug: slugify(name) })
      .returning()
    await db.insert(ingestionKey).values({ projectId: created!.id, keyHash: hash })
    revalidatePath("/settings/projects")
    return ok({ project: created!, ingestionKey: plaintext })
  } catch {
    return fail("A project with that name already exists.")
  }
}
