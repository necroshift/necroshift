import { afterAll, describe, expect, test } from "vitest"
import { db, pool } from "./client"
import * as schema from "./schema/index"

const tables = {
  user: schema.user,
  session: schema.session,
  account: schema.account,
  verification: schema.verification,
  organization: schema.organization,
  member: schema.member,
  invitation: schema.invitation,
  project: schema.project,
  ingestionKey: schema.ingestionKey,
  logEntry: schema.logEntry,
  crashReport: schema.crashReport,
  ingestionEvent: schema.ingestionEvent,
  providerCredential: schema.providerCredential,
}

afterAll(async () => {
  await pool.end()
})

describe("database schema", () => {
  for (const [name, table] of Object.entries(tables)) {
    test(`${name} table is queryable`, async () => {
      const rows = await db.select().from(table).limit(1)
      expect(Array.isArray(rows)).toBe(true)
    })
  }
})
