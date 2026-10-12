"use server"

import { revalidatePath } from "next/cache"
import { desc, eq } from "drizzle-orm"
import { db } from "@workspace/db/client"
import { ingestionKey, project } from "@workspace/db/schema"
import { ok, fail, type ActionResult } from "@/src/lib/action-result"
import { getShellContext } from "@/src/domains/shell/get-shell-context"
import { requireSession } from "@/src/domains/auth/require-session"
import { generateIngestionKey } from "@/src/domains/ingestion/ingestion-key"
import { slugify } from "./slugify"

export type ProjectSummary = {
  id: string
  name: string
  slug: string
  repoUrl: string | null
  createdAt: Date
}

export async function listProjects(): Promise<ProjectSummary[]> {
  await requireSession()
  const context = await getShellContext()
  if (!context) return []
  return db
    .select({
      id: project.id,
      name: project.name,
      slug: project.slug,
      repoUrl: project.repoUrl,
      createdAt: project.createdAt,
    })
    .from(project)
    .where(eq(project.organizationId, context.organization.id))
    .orderBy(desc(project.createdAt))
}

export async function setProjectRepo(input: { projectId: string; repoUrl: string }): Promise<ActionResult<null>> {
  await requireSession()
  const repoUrl = input.repoUrl.trim()
  if (!/^https:\/\/github\.com\/[^/\s]+\/[^/\s]+$/.test(repoUrl)) {
    return fail("Enter a GitHub repo URL, e.g. https://github.com/org/repo")
  }
  await db.update(project).set({ repoUrl }).where(eq(project.id, input.projectId))
  revalidatePath("/settings/projects")
  return ok(null)
}

export async function createProject(input: { name: string }): Promise<ActionResult<{ project: ProjectSummary; ingestionKey: string }>> {
  await requireSession()
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
