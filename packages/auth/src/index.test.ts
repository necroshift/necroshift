import { eq } from "drizzle-orm"
import { afterAll, beforeAll, describe, expect, test } from "vitest"
import { db, pool } from "@workspace/db/client"
import * as schema from "@workspace/db/schema"
import { isRegistrationAllowed } from "./index.ts"

const orgId = "test-org-registration-gate"
const userId = "test-user-registration-gate"
const invitationId = "test-invitation-registration-gate"
const invitedEmail = "invited@example.com"
const uninvitedEmail = "stranger@example.com"

beforeAll(async () => {
  await db.insert(schema.organization).values({
    id: orgId,
    name: "Test Org",
    slug: orgId,
    createdAt: new Date(),
  })
  await db.insert(schema.user).values({
    id: userId,
    name: "Existing Owner",
    email: "owner@example.com",
  })
  await db.insert(schema.invitation).values({
    id: invitationId,
    organizationId: orgId,
    email: invitedEmail,
    status: "pending",
    expiresAt: new Date(Date.now() + 86_400_000),
    inviterId: userId,
  })
})

afterAll(async () => {
  await db.delete(schema.invitation).where(eq(schema.invitation.id, invitationId))
  await db.delete(schema.user).where(eq(schema.user.id, userId))
  await db.delete(schema.organization).where(eq(schema.organization.id, orgId))
  await pool.end()
})

describe("isRegistrationAllowed", () => {
  test("allows an email with a pending invitation", async () => {
    expect(await isRegistrationAllowed(invitedEmail)).toBe(true)
  })

  test("rejects an email with no invitation once a user already exists", async () => {
    expect(await isRegistrationAllowed(uninvitedEmail)).toBe(false)
  })
})
