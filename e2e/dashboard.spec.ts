import { expect, test, type APIRequestContext } from "@playwright/test"
import { db } from "@workspace/db/client"
import { member, organization, project, user } from "@workspace/db/schema"

test.describe.configure({ mode: "serial" })

const email = "owner@example.com"
const password = "supersecret123"
const orgId = "e2e-dashboard-org"

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
    .values({ id: "e2e-dashboard-member", organizationId: orgId, userId: created.id, role: "owner", createdAt: new Date() })
}

async function signIn(page: import("@playwright/test").Page) {
  await page.goto("/sign-in")
  await page.getByLabel("Email").fill(email)
  await page.getByLabel("Password").fill(password)
  await page.getByRole("button", { name: "Sign in" }).click()
  await expect(page).toHaveURL("/")
}

test.describe("dashboard shell", () => {
  test.beforeAll(async ({ request }) => {
    await wipe()
    await seedOwner(request)
  })
  test.afterAll(wipe)

  test("shows a 'create a project' empty state with no projects yet", async ({ page }) => {
    await signIn(page)
    await expect(page.getByRole("heading", { level: 2 }).filter({ hasText: "No projects yet" })).toBeVisible()
    await expect(page.getByRole("link", { name: "Create a project" })).toBeVisible()
  })

  test("shows the ingestion snippet once a project exists", async ({ page }) => {
    await db.insert(project).values({ id: "e2e-dashboard-project", organizationId: orgId, name: "Payments API", slug: "payments-api" })

    await signIn(page)
    await expect(page.getByText("No issues yet")).toBeVisible()
    await expect(page.getByText("/api/ingest/payments-api/logs")).toBeVisible()
    await expect(page.getByRole("link", { name: "View ingestion key" })).toBeVisible()
  })

  test("sidebar nav links route to the right pages and tabs", async ({ page }) => {
    await signIn(page)

    await page.getByRole("link", { name: "Projects" }).click()
    await expect(page).toHaveURL("/settings/projects?tab=projects")
    await expect(page.getByRole("tab", { name: "Projects", selected: true })).toBeVisible()

    await page.getByRole("link", { name: "Members" }).click()
    await expect(page).toHaveURL("/settings/projects?tab=members")
    await expect(page.getByRole("tab", { name: "Members", selected: true })).toBeVisible()

    await page.getByRole("link", { name: "API Keys" }).click()
    await expect(page).toHaveURL("/settings/api-keys?tab=keys")
    await expect(page.getByRole("tab", { name: "API Keys", selected: true })).toBeVisible()

    await page.getByRole("link", { name: "Integration Events" }).click()
    await expect(page).toHaveURL("/settings/api-keys?tab=events")
    await expect(page.getByRole("tab", { name: "Integration Events", selected: true })).toBeVisible()

    await page.getByRole("link", { name: "Issues" }).click()
    await expect(page).toHaveURL("/")
  })
})
