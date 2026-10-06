import { createHash, randomBytes } from "node:crypto"
import { expect, test, type APIRequestContext } from "@playwright/test"
import { db } from "@workspace/db/client"
import { ingestionKey, organization, project, user } from "@workspace/db/schema"

test.describe.configure({ mode: "serial" })

const orgId = "e2e-ingestion-org"
const projectId = "e2e-ingestion-project"
const projectSlug = "payments-api"
// Mirrors apps/web/src/domains/ingestion/ingestion-key.ts's scheme — kept
// standalone here rather than reaching across the app boundary from e2e/.
const validKey = `nk_live_${randomBytes(24).toString("base64url")}`
const validKeyHash = createHash("sha256").update(validKey).digest("hex")

async function wipe() {
  await db.delete(organization)
  await db.delete(user)
}

async function seed(request: APIRequestContext) {
  await request.post("/api/auth/sign-up/email", {
    data: { email: "owner@example.com", password: "supersecret123", name: "Test Owner" },
  })
  await db.insert(organization).values({ id: orgId, name: "Acme Inc", slug: orgId, createdAt: new Date() })
  await db
    .insert(project)
    .values({ id: projectId, organizationId: orgId, name: "Payments API", slug: projectSlug })
  await db.insert(ingestionKey).values({ projectId, keyHash: validKeyHash })
}

test.describe("ingestion API", () => {
  test.beforeAll(async ({ request }) => {
    await wipe()
    await seed(request)
  })
  test.afterAll(wipe)

  test("valid key + valid payload succeeds", async ({ request }) => {
    const response = await request.post(`/api/ingest/${projectSlug}/logs`, {
      headers: { Authorization: `Bearer ${validKey}` },
      data: { level: "error", message: "Payment failed" },
    })
    expect(response.status()).toBe(200)
  })

  test("invalid key is rejected", async ({ request }) => {
    const response = await request.post(`/api/ingest/${projectSlug}/logs`, {
      headers: { Authorization: "Bearer nk_live_not-a-real-key" },
      data: { message: "hi" },
    })
    expect(response.status()).toBe(401)
  })

  test("invalid payload is rejected", async ({ request }) => {
    const response = await request.post(`/api/ingest/${projectSlug}/crashes`, {
      headers: { Authorization: `Bearer ${validKey}` },
      data: "not-an-object",
    })
    expect(response.status()).toBe(400)
  })

  test("the Integration Events table reflects all three attempts", async ({ page }) => {
    await page.goto("/sign-in")
    await page.getByLabel("Email").fill("owner@example.com")
    await page.getByLabel("Password").fill("supersecret123")
    await page.getByRole("button", { name: "Sign in" }).click()
    await expect(page).toHaveURL("/")

    await page.goto("/settings/api-keys")
    await page.getByRole("tab", { name: "Integration Events" }).click()
    await expect(page.getByText("invalid_key")).toBeVisible()
    await expect(page.getByText("invalid_payload")).toBeVisible()
    await expect(page.getByText("success")).toBeVisible()
  })
})
