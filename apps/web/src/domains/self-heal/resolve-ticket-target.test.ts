import { afterAll, beforeAll, describe, expect, test } from "vitest"
import { eq } from "drizzle-orm"
import { db, pool } from "@workspace/db/client"
import { connection, organization, project, projectRouting } from "@workspace/db/schema"
import { encrypt } from "@/src/domains/api-keys/encryption"
import { resolveTicketTarget } from "./resolve-ticket-target"

const orgId = "test-org-ticket-target"
const projectNoRoutingId = "test-project-no-routing"
const projectJiraId = "test-project-jira-routing"
const projectBothId = "test-project-both-routing"

beforeAll(async () => {
  await db.insert(organization).values({ id: orgId, name: "Test Org", slug: orgId, createdAt: new Date() })
  await db.insert(project).values([
    { id: projectNoRoutingId, organizationId: orgId, name: "No routing", slug: "no-routing" },
    { id: projectJiraId, organizationId: orgId, name: "Jira routed", slug: "jira-routed" },
    { id: projectBothId, organizationId: orgId, name: "Both routed", slug: "both-routed" },
  ])

  const jiraToken = encrypt("jira-access-token")
  const linearToken = encrypt("linear-access-token")
  await db.insert(connection).values([
    {
      organizationId: orgId,
      provider: "jira",
      accessTokenCiphertext: jiraToken.ciphertext,
      accessTokenNonce: jiraToken.nonce,
      cloudId: "cloud1",
      siteUrl: "https://acme.atlassian.net",
    },
    {
      organizationId: orgId,
      provider: "linear",
      accessTokenCiphertext: linearToken.ciphertext,
      accessTokenNonce: linearToken.nonce,
    },
  ])

  await db.insert(projectRouting).values([
    { projectId: projectJiraId, provider: "jira", targetId: "PAY", targetName: "Payments" },
    { projectId: projectBothId, provider: "jira", targetId: "PAY", targetName: "Payments" },
    { projectId: projectBothId, provider: "linear", targetId: "team1", targetName: "Platform" },
  ])
})

afterAll(async () => {
  await db.delete(organization).where(eq(organization.id, orgId))
  await pool.end()
})

describe("resolveTicketTarget", () => {
  test("returns null when no routing is configured", async () => {
    expect(await resolveTicketTarget(projectNoRoutingId, orgId)).toBeNull()
  })

  test("resolves the configured provider's decrypted token", async () => {
    const target = await resolveTicketTarget(projectJiraId, orgId)
    expect(target?.provider).toBe("jira")
    expect(target?.accessToken).toBe("jira-access-token")
    expect(target?.cloudId).toBe("cloud1")
    expect(target?.siteUrl).toBe("https://acme.atlassian.net")
  })

  test("prefers jira over linear when a project is routed to both", async () => {
    const target = await resolveTicketTarget(projectBothId, orgId)
    expect(target?.provider).toBe("jira")
  })
})
