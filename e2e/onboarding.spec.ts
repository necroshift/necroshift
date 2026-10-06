import { expect, test, type Page } from "@playwright/test"
import { db } from "@workspace/db/client"
import { organization, user } from "@workspace/db/schema"

test.describe.configure({ mode: "serial" })

async function wipe() {
  await db.delete(organization)
  await db.delete(user)
}

async function fillStep1(page: Page) {
  await page.goto("/onboarding")
  await page.getByLabel("Name").fill("Test Owner")
  await page.getByLabel("Email").fill("owner@example.com")
  await page.getByLabel("Password").fill("supersecret123")
  await page.getByRole("button", { name: "Continue", exact: true }).click()
  await expect(page.getByRole("heading", { name: "Name your organization" })).toBeVisible()
}

async function fillStep2(page: Page) {
  // The GitHub-skip path: dismiss the "Connect GitHub" prompt rather than
  // use it, since it's an external OAuth redirect with no app registered
  // in this environment.
  await page.getByRole("button", { name: "I'll do this later in Settings" }).click()
  await page.getByLabel("Organization name").fill("Acme Inc")
  await page.getByRole("button", { name: "Continue", exact: true }).click()
  await expect(page.getByRole("heading", { name: "Create your first project" })).toBeVisible()
}

test.describe("onboarding wizard", () => {
  test.beforeEach(wipe)
  test.afterAll(wipe)

  test("walks all 4 steps and detects the first real event", async ({ page, request }) => {
    await fillStep1(page)
    await fillStep2(page)

    await page.getByLabel("Project name").fill("Payments API")
    await page.getByRole("button", { name: "Create project" }).click()
    await expect(page.getByText("Ingestion key")).toBeVisible()
    const key = await page.locator(".font-mono.text-xs.break-all").innerText()

    await page.getByRole("button", { name: "Continue", exact: true }).click()
    await expect(page.getByRole("heading", { name: "Send your first event" })).toBeVisible()
    await expect(page.getByText("Waiting for your first event")).toBeVisible()

    const response = await request.post("/api/ingest/payments-api/logs", {
      headers: { Authorization: `Bearer ${key}` },
      data: { level: "error", message: "Payment failed" },
    })
    expect(response.status()).toBe(200)

    await page.getByRole("button", { name: "I've sent a test event" }).click()
    await expect(page.getByText("First event received!")).toBeVisible()

    await page.getByRole("link", { name: "Go to dashboard" }).click()
    await expect(page).toHaveURL("/")
    await expect(page.getByRole("heading", { level: 2 }).filter({ hasText: "No issues yet" })).toBeVisible()
  })

  test("skipping project creation lands on the dashboard with no projects", async ({ page }) => {
    await fillStep1(page)
    await fillStep2(page)

    await page.getByRole("link", { name: "Skip for now" }).click()
    await expect(page).toHaveURL("/")
    await expect(page.getByRole("heading", { level: 2 }).filter({ hasText: "No projects yet" })).toBeVisible()
  })

  test("skipping the first-event wait lands on the dashboard", async ({ page }) => {
    await fillStep1(page)
    await fillStep2(page)

    await page.getByLabel("Project name").fill("Payments API")
    await page.getByRole("button", { name: "Create project" }).click()
    await page.getByRole("button", { name: "Continue", exact: true }).click()
    await expect(page.getByRole("heading", { name: "Send your first event" })).toBeVisible()

    await page.getByRole("link", { name: "Skip for now" }).click()
    await expect(page).toHaveURL("/")
    await expect(page.getByRole("heading", { level: 2 }).filter({ hasText: "No issues yet" })).toBeVisible()
  })
})
