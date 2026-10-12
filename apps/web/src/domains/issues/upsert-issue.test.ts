import { afterAll, beforeAll, describe, expect, test } from "vitest"
import { eq } from "drizzle-orm"
import { db, pool } from "@workspace/db/client"
import { issue, organization, project } from "@workspace/db/schema"
import { upsertIssueForCrash } from "./upsert-issue"

const orgId = "test-org-issues"
const projectId = "test-project-issues"

beforeAll(async () => {
  await db.insert(organization).values({ id: orgId, name: "Test Org", slug: orgId, createdAt: new Date() })
  await db.insert(project).values({ id: projectId, organizationId: orgId, name: "Test Project", slug: orgId })
})

afterAll(async () => {
  await db.delete(organization).where(eq(organization.id, orgId))
  await pool.end()
})

describe("upsertIssueForCrash", () => {
  test("first occurrence creates an open issue with occurrenceCount 1", async () => {
    const id = await upsertIssueForCrash({ projectId, message: "Boom A" })
    const [row] = await db.select().from(issue).where(eq(issue.id, id))
    expect(row?.status).toBe("open")
    expect(row?.occurrenceCount).toBe(1)
  })

  test("a second occurrence of the same message increments the same issue", async () => {
    const firstId = await upsertIssueForCrash({ projectId, message: "Boom B" })
    const secondId = await upsertIssueForCrash({ projectId, message: "Boom B" })
    expect(secondId).toBe(firstId)

    const [row] = await db.select().from(issue).where(eq(issue.id, firstId))
    expect(row?.occurrenceCount).toBe(2)
  })

  test("a different message creates a separate issue", async () => {
    const idA = await upsertIssueForCrash({ projectId, message: "Boom C" })
    const idB = await upsertIssueForCrash({ projectId, message: "Boom D" })
    expect(idA).not.toBe(idB)
  })

  test("a new occurrence reopens a resolved issue", async () => {
    const id = await upsertIssueForCrash({ projectId, message: "Boom E" })
    await db.update(issue).set({ status: "resolved" }).where(eq(issue.id, id))

    await upsertIssueForCrash({ projectId, message: "Boom E" })

    const [row] = await db.select().from(issue).where(eq(issue.id, id))
    expect(row?.status).toBe("open")
  })
})
