import { expect, test } from "@playwright/test"

test("the app boots and serves the root route", async ({ page }) => {
  const response = await page.goto("/")
  expect(response?.ok()).toBe(true)
})
