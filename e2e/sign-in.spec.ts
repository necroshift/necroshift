import { expect, test } from "@playwright/test"
import { db } from "@workspace/db/client"
import { organization, user } from "@workspace/db/schema"

test.describe.configure({ mode: "serial" })

async function wipeAuthTables() {
  // organization/user cascade to every table that references them
  // (member, invitation, session, account, project, ...).
  await db.delete(organization)
  await db.delete(user)
}

test.describe("first access", () => {
  test.beforeEach(wipeAuthTables)
  test.afterAll(wipeAuthTables)

  test("redirects to onboarding when no users exist yet", async ({ page }) => {
    await page.goto("/")
    await expect(page).toHaveURL("/onboarding")
  })

  test("sign-in redirects to onboarding too, on a fresh deployment", async ({ page }) => {
    await page.goto("/sign-in")
    await expect(page).toHaveURL("/onboarding")
  })
})

test.describe("sign in", () => {
  const email = "owner@example.com"
  const password = "supersecret123"

  test.beforeAll(async ({ request }) => {
    await wipeAuthTables()
    await request.post("/api/auth/sign-up/email", {
      data: { email, password, name: "Test Owner" },
    })
  })

  test.afterAll(wipeAuthTables)

  test("signs in with email and password", async ({ page }) => {
    await page.goto("/sign-in")
    await page.getByLabel("Email").fill(email)
    await page.getByLabel("Password").fill(password)
    await page.getByRole("button", { name: "Sign in" }).click()
    await expect(page).toHaveURL("/")
    await expect(page.getByText(`Signed in as ${email}`)).toBeVisible()
  })

  test("rejects an uninvited second sign-up", async ({ request }) => {
    const response = await request.post("/api/auth/sign-up/email", {
      data: { email: "stranger@example.com", password: "supersecret123", name: "Stranger" },
    })
    expect(response.status()).toBe(403)
  })
})
