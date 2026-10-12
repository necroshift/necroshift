import { expect, test } from "@playwright/test"
import { eq } from "drizzle-orm"
import { db } from "@workspace/db/client"
import { connection, connectionEvent, organization, project, projectRouting, user } from "@workspace/db/schema"
import { encrypt } from "../apps/web/src/domains/api-keys/encryption"

// Never exercises a real OAuth flow here: no registered Jira/Linear OAuth
// apps exist in this environment (see docs/features/INTEGRATIONS.md). This
// suite verifies the connect/disconnect UI, routing picker, and events
// list against DB-seeded state instead.
test.describe.configure({ mode: "serial" })

const orgId = "e2e-connections-org"
const projectId = "e2e-connections-project"

async function wipe() {
  await db.delete(organization)
  await db.delete(user)
}

async function seed(request: import("@playwright/test").APIRequestContext) {
  await request.post("/api/auth/sign-up/email", {
    data: { email: "owner@example.com", password: "supersecret123", name: "Test Owner" },
  })
  await db.insert(organization).values({ id: orgId, name: "Acme Inc", slug: orgId, createdAt: new Date() })
  await db.insert(project).values({ id: projectId, organizationId: orgId, name: "Payments API", slug: "payments-api" })
}

async function signIn(page: import("@playwright/test").Page) {
  await page.goto("/sign-in")
  await page.getByLabel("Email").fill("owner@example.com")
  await page.getByLabel("Password").fill("supersecret123")
  await page.getByRole("button", { name: "Sign in" }).click()
  await expect(page).toHaveURL("/")
}

test.describe("connections", () => {
  test.beforeAll(async ({ request }) => {
    await wipe()
    await seed(request)
  })
  test.afterAll(wipe)

  test("shows both providers as not connected with no real connection yet", async ({ page }) => {
    await signIn(page)
    await page.goto("/settings/connections")
    await expect(page.getByText("Jira")).toBeVisible()
    await expect(page.getByText("Linear")).toBeVisible()
    await expect(page.getByText("Not connected")).toHaveCount(2)
    await expect(page.getByRole("link", { name: "Connect", exact: true })).toHaveCount(2)
  })

  test("a connected provider shows Connected and a Disconnect button", async ({ page }) => {
    const { ciphertext, nonce } = encrypt("jira-access-token")
    await db
      .insert(connection)
      .values({ organizationId: orgId, provider: "jira", accessTokenCiphertext: ciphertext, accessTokenNonce: nonce, siteUrl: "https://acme.atlassian.net" })

    await signIn(page)
    await page.goto("/settings/connections")
    await expect(page.getByText("Connected", { exact: true })).toBeVisible()
    await expect(page.getByText("https://acme.atlassian.net")).toBeVisible()
    await expect(page.getByRole("button", { name: "Disconnect" })).toBeVisible()
  })

  test("disconnecting removes the connection", async ({ page }) => {
    await signIn(page)
    await page.goto("/settings/connections")
    await page.getByRole("button", { name: "Disconnect" }).click()
    await expect(page.getByText("Not connected", { exact: true })).toHaveCount(2)

    const rows = await db.select().from(connection).where(eq(connection.organizationId, orgId))
    expect(rows).toHaveLength(0)
  })

  test("ticket-filing attempts show up in the events list", async ({ page }) => {
    await db.insert(connectionEvent).values([
      { organizationId: orgId, provider: "jira", projectId, status: "success" },
      { organizationId: orgId, provider: "linear", projectId, status: "error", errorReason: "no team configured" },
    ])

    await signIn(page)
    await page.goto("/settings/connections")
    await expect(page.getByText("Ticket-filing attempts")).toBeVisible()
    await expect(page.getByText("no team configured")).toBeVisible()
  })
})

test.describe("project routing", () => {
  test.beforeAll(async ({ request }) => {
    await wipe()
    await seed(request)
    const { ciphertext, nonce } = encrypt("jira-access-token")
    await db.insert(connection).values({
      organizationId: orgId,
      provider: "jira",
      accessTokenCiphertext: ciphertext,
      accessTokenNonce: nonce,
      cloudId: "cloud1",
      siteUrl: "https://acme.atlassian.net",
    })
    await db.insert(projectRouting).values({ projectId, provider: "jira", targetId: "PAY", targetName: "Payments (PAY)" })
  })
  test.afterAll(wipe)

  test("shows the project's current routing target once a provider is connected", async ({ page }) => {
    await signIn(page)
    await page.goto("/settings/connections")
    await expect(page.getByText("Project routing")).toBeVisible()
    await expect(page.getByText("Payments API").last()).toBeVisible()
    await expect(page.getByText("Payments (PAY)")).toBeVisible()
  })
})
