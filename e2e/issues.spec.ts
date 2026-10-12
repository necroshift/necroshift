import { createHash, randomBytes } from "node:crypto"
import { expect, test, type APIRequestContext } from "@playwright/test"
import { db } from "@workspace/db/client"
import { ingestionKey, organization, project, user } from "@workspace/db/schema"

test.describe.configure({ mode: "serial" })

const orgId = "e2e-issues-org"
const projectId = "e2e-issues-project"
const projectSlug = "payments-api"
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
  await db.insert(project).values({ id: projectId, organizationId: orgId, name: "Payments API", slug: projectSlug })
  await db.insert(ingestionKey).values({ projectId, keyHash: validKeyHash })
}

async function postCrash(request: APIRequestContext, message: string) {
  return request.post(`/api/ingest/${projectSlug}/crashes`, {
    headers: { Authorization: `Bearer ${validKey}` },
    data: { message },
  })
}

async function signIn(page: import("@playwright/test").Page) {
  await page.goto("/sign-in")
  await page.getByLabel("Email").fill("owner@example.com")
  await page.getByLabel("Password").fill("supersecret123")
  await page.getByRole("button", { name: "Sign in" }).click()
  await expect(page).toHaveURL("/")
}

test.describe("issues", () => {
  test.beforeAll(async ({ request }) => {
    await wipe()
    await seed(request)
  })
  test.afterAll(wipe)

  test("two crashes with the same message group into one issue with occurrenceCount 2", async ({ request, page }) => {
    const first = await postCrash(request, "NullPointerException in charge()")
    const second = await postCrash(request, "NullPointerException in charge()")
    expect(first.status()).toBe(200)
    expect(second.status()).toBe(200)

    await signIn(page)
    await expect(page.getByText("NullPointerException in charge()")).toBeVisible()
    await expect(page.getByText("2×")).toBeVisible()
  })

  test("a different crash message creates a separate issue", async ({ request, page }) => {
    const response = await postCrash(request, "Timeout connecting to database")
    expect(response.status()).toBe(200)

    await signIn(page)
    await expect(page.getByText("Timeout connecting to database")).toBeVisible()
    await expect(page.getByText("NullPointerException in charge()")).toBeVisible()
  })

  test("the detail view shows stats, the latest raw payload, and marking resolved updates status", async ({ page }) => {
    await signIn(page)
    await page.getByText("NullPointerException in charge()").click()
    await expect(page).toHaveURL(/\/issues\//)

    await expect(page.getByText("Occurrences")).toBeVisible()
    await expect(page.getByText("NullPointerException in charge()", { exact: false }).first()).toBeVisible()

    await page.getByRole("button", { name: "Mark resolved" }).click()
    await expect(page.getByText("resolved")).toBeVisible()
  })

  test("a new occurrence reopens a resolved issue", async ({ request, page }) => {
    const response = await postCrash(request, "NullPointerException in charge()")
    expect(response.status()).toBe(200)

    await signIn(page)
    await page.getByText("NullPointerException in charge()").click()
    await expect(page).toHaveURL(/\/issues\//)
    await expect(page.getByText("open", { exact: true })).toBeVisible()
  })
})
