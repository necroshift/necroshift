import { afterAll, beforeAll, describe, expect, test } from "vitest"
import { eq } from "drizzle-orm"
import { db, pool } from "@workspace/db/client"
import { connectionEvent, organization } from "@workspace/db/schema"
import { recordConnectionEvent } from "./record-connection-event"

const orgId = "test-org-connection-events"

beforeAll(async () => {
  await db.insert(organization).values({ id: orgId, name: "Test Org", slug: orgId, createdAt: new Date() })
  await seedHundredEvents()
})

afterAll(async () => {
  await db.delete(organization).where(eq(organization.id, orgId))
  await pool.end()
})

async function seedHundredEvents() {
  const rows = Array.from({ length: 100 }, (_, i) => ({
    id: i === 0 ? "oldest" : `event-${i}`,
    organizationId: orgId,
    provider: "jira" as const,
    status: "success" as const,
    createdAt: new Date(Date.now() - (100 - i) * 1000),
  }))
  await db.insert(connectionEvent).values(rows)
}

describe("recordConnectionEvent FIFO trim", () => {
  test("keeps exactly 100 events per org+provider, dropping only the oldest", async () => {
    await recordConnectionEvent({ organizationId: orgId, provider: "jira", projectId: null, status: "success" })

    const remaining = await db.select().from(connectionEvent).where(eq(connectionEvent.organizationId, orgId))
    expect(remaining).toHaveLength(100)
    expect(remaining.map((r) => r.id)).not.toContain("oldest")
  })
})
