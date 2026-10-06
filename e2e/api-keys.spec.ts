import { expect, test, type APIRequestContext } from "@playwright/test"
import { db } from "@workspace/db/client"
import { member, organization, user } from "@workspace/db/schema"

test.describe.configure({ mode: "serial" })

const email = "owner@example.com"
const password = "supersecret123"
const orgId = "e2e-apikeys-org"

async function wipe() {
  await db.delete(organization)
  await db.delete(user)
}

async function seedOwner(request: APIRequestContext) {
  const response = await request.post("/api/auth/sign-up/email", {
    data: { email, password, name: "Test Owner" },
  })
  const { user: created } = await response.json()
  await db.insert(organization).values({ id: orgId, name: "Acme Inc", slug: orgId, createdAt: new Date() })
  await db
    .insert(member)
    .values({ id: "e2e-apikeys-member", organizationId: orgId, userId: created.id, role: "owner", createdAt: new Date() })
}

test.describe("settings / api keys", () => {
  test.beforeAll(async ({ request }) => {
    await wipe()
    await seedOwner(request)
  })
  test.afterAll(wipe)

  test("adds and removes an OpenAI key", async ({ page }) => {
    await page.goto("/sign-in")
    await page.getByLabel("Email").fill(email)
    await page.getByLabel("Password").fill(password)
    await page.getByRole("button", { name: "Sign in" }).click()
    await expect(page).toHaveURL("/")

    await page.goto("/settings/api-keys")
    const openaiCard = page.getByTestId("provider-card-openai")
    await expect(openaiCard.getByText("No key configured")).toBeVisible()

    await openaiCard.getByRole("button", { name: "Add key" }).click()
    await page.getByLabel("OpenAI API key").fill("sk-test-abcdefghijklmnop1234")
    await openaiCard.getByRole("button", { name: "Save" }).click()

    await expect(openaiCard.getByText("sk-test")).toBeVisible()
    await expect(openaiCard.getByText("No key configured")).not.toBeVisible()

    await openaiCard.getByRole("button", { name: "Remove" }).click()
    await expect(openaiCard.getByText("No key configured")).toBeVisible()
  })
})
