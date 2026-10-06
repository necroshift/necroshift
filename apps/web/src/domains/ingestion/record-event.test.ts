import { afterAll, beforeAll, describe, expect, test } from "vitest"
import { eq } from "drizzle-orm"
import { db, pool } from "@workspace/db/client"
import { ingestionEvent, organization, project } from "@workspace/db/schema"
import { recordIngestionEvent } from "./record-event"

const orgId = "test-org-fifo"
const projectId = "test-project-fifo"
const oldestEventId = "test-event-oldest"
const secondOldestEventId = "test-event-second-oldest"

beforeAll(async () => {
  await db.insert(organization).values({ id: orgId, name: "Test Org", slug: orgId, createdAt: new Date() })
  await db.insert(project).values({ id: projectId, organizationId: orgId, name: "Test Project", slug: "test-project-fifo" })
  await seedHundredEvents()
})

afterAll(async () => {
  await db.delete(organization).where(eq(organization.id, orgId))
  await pool.end()
})

async function seedHundredEvents() {
  const rows = Array.from({ length: 100 }, (_, i) => ({
    id: i === 0 ? oldestEventId : i === 1 ? secondOldestEventId : `test-event-${i}`,
    projectId,
    payloadType: "log" as const,
    status: "success" as const,
    httpStatus: 200,
    receivedAt: new Date(Date.now() - (100 - i) * 1000),
  }))
  await db.insert(ingestionEvent).values(rows)
}

describe("recordIngestionEvent FIFO trim", () => {
  test("keeps exactly 100 events per project, dropping only the oldest", async () => {
    await recordIngestionEvent({ projectId, ingestionKeyId: null, payloadType: "log", status: "success", httpStatus: 200 })

    const remaining = await db.select().from(ingestionEvent).where(eq(ingestionEvent.projectId, projectId))
    expect(remaining).toHaveLength(100)

    const ids = remaining.map((r) => r.id)
    expect(ids).not.toContain(oldestEventId)
    expect(ids).toContain(secondOldestEventId)
  })
})
