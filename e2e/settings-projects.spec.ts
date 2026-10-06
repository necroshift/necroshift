import { expect, test, type APIRequestContext } from "@playwright/test"
import { eq } from "drizzle-orm"
import { db } from "@workspace/db/client"
import { member, organization, project, user } from "@workspace/db/schema"

test.describe.configure({ mode: "serial" })

const email = "owner@example.com"
const password = "supersecret123"
const orgId = "e2e-org"

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
    .values({ id: "e2e-member", organizationId: orgId, userId: created.id, role: "owner", createdAt: new Date() })
}

async function signIn(page: import("@playwright/test").Page) {
  await page.goto("/sign-in")
  await page.getByLabel("Email").fill(email)
  await page.getByLabel("Password").fill(password)
  await page.getByRole("button", { name: "Sign in" }).click()
  await expect(page).toHaveURL("/")
}

test.describe("settings / projects & members", () => {
  test.beforeAll(async ({ request }) => {
    await wipe()
    await seedOwner(request)
  })
  test.afterAll(wipe)

  test("creates a project and reveals its ingestion key once", async ({ page }) => {
    await signIn(page)
    await page.goto("/settings/projects")
    await page.getByRole("button", { name: "New project" }).click()
    await page.getByLabel("Project name").fill("Payments API")
    await page.getByRole("button", { name: "Create" }).click()

    await expect(page.getByText("Ingestion key")).toBeVisible()
    await expect(page.getByText("Copy this now — shown only once.")).toBeVisible()
    await expect(page.getByText(/^nk_live_(?!•)/)).toBeVisible()
    await expect(page.getByRole("tabpanel", { name: "Projects" }).getByText("Payments API")).toBeVisible()

    const [created] = await db.select().from(project).where(eq(project.organizationId, orgId))
    expect(created).toBeTruthy()
  })

  test("invites a member", async ({ page }) => {
    await signIn(page)
    await page.goto("/settings/projects")
    await page.getByRole("tab", { name: "Members" }).click()
    await page.getByRole("button", { name: "Invite member" }).click()
    await page.getByLabel("Email").fill("teammate@example.com")
    await page.getByRole("button", { name: "Send invite" }).click()
    await expect(page.getByText("Invited teammate@example.com.")).toBeVisible()
  })

  test("changes a member's role", async ({ page }) => {
    await signIn(page)
    await page.goto("/settings/projects")
    await page.getByRole("tab", { name: "Members" }).click()
    await page.getByRole("button", { name: "Member actions" }).click()
    await page.getByRole("menuitem", { name: "Make admin" }).click()
    await expect(page.getByText("admin")).toBeVisible()
  })
})
