import { expect, test } from "@playwright/test"
import { eq } from "drizzle-orm"
import { db } from "@workspace/db/client"
import { account, crashReport, issue, organization, project, providerCredential, selfHealRun, selfHealStep, user } from "@workspace/db/schema"
import { encrypt } from "../apps/web/src/domains/api-keys/encryption"

// Deliberately never clicks "Start self-heal" for real here: that would hit
// the live sandbox-runner service and launch a real Docker container
// against fake credentials. This suite verifies the guard UI and the run
// view by seeding DB rows directly, the same way the sandbox itself would
// report progress — see the self-heal design spec's test strategy notes.
test.describe.configure({ mode: "serial" })

const orgId = "e2e-self-heal-org"
const projectId = "e2e-self-heal-project"
const issueId = "e2e-self-heal-issue"

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
  await db.insert(issue).values({ id: issueId, projectId, fingerprint: "fp", title: "NullPointerException in charge()" })
  await db.insert(crashReport).values({ projectId, issueId, message: "NullPointerException in charge()", rawPayload: {} })
}

async function signIn(page: import("@playwright/test").Page) {
  await page.goto("/sign-in")
  await page.getByLabel("Email").fill("owner@example.com")
  await page.getByLabel("Password").fill("supersecret123")
  await page.getByRole("button", { name: "Sign in" }).click()
  await expect(page).toHaveURL("/")
}

test.describe("self-heal guard", () => {
  test.beforeAll(async ({ request }) => {
    await wipe()
    await seed(request)
  })
  test.afterAll(wipe)

  test("shows what's missing when nothing is configured yet", async ({ page }) => {
    await signIn(page)
    await page.goto(`/issues/${issueId}`)
    await expect(page.getByRole("button", { name: "Start self-heal" })).toBeDisabled()
    await expect(page.getByText("Set a GitHub repo", { exact: false })).toBeVisible()
  })

  test("still blocks when only the repo is set", async ({ page }) => {
    await db.update(project).set({ repoUrl: "https://github.com/acme/payments-api" }).where(eq(project.id, projectId))
    await signIn(page)
    await page.goto(`/issues/${issueId}`)
    await expect(page.getByRole("button", { name: "Start self-heal" })).toBeDisabled()
    await expect(page.getByText("Connect GitHub", { exact: false })).toBeVisible()
  })

  test("enables once repo, GitHub, and an LLM key are all present", async ({ page }) => {
    await seedGithubAccountAndLlmKey()
    await signIn(page)
    await page.goto(`/issues/${issueId}`)
    await expect(page.getByRole("button", { name: "Start self-heal" })).toBeEnabled()
  })
})

test.describe("self-heal run view", () => {
  test.beforeAll(async ({ request }) => {
    await wipe()
    await seed(request)
    await seedInProgressRun()
  })
  test.afterAll(wipe)

  test("renders step statuses, summary, and a pending-PR placeholder", async ({ page }) => {
    await signIn(page)
    await page.goto(`/issues/${issueId}/self-heal`)
    await expect(page.getByText("Clone repository")).toBeVisible()
    await expect(page.getByText("Develop fix")).toBeVisible()
    await expect(page.getByText("Reviewed the issue title")).toBeVisible()
    await expect(page.getByText("Pull request will appear here")).toBeVisible()
  })

  test("hides the start button and guard text on the issue card while a run is in progress", async ({ page }) => {
    await signIn(page)
    await page.goto(`/issues/${issueId}`)
    await expect(page.getByRole("link", { name: "View self-heal run →" })).toBeVisible()
    await expect(page.getByRole("button", { name: /Start self-heal|Start again/ })).toHaveCount(0)
    await expect(page.getByText("Needed first:")).toHaveCount(0)
  })
})

async function seedGithubAccountAndLlmKey() {
  await db.insert(account).values({ id: "e2e-self-heal-account", userId: await ownerUserId(), providerId: "github", accountId: "gh-1" })
  const { ciphertext, nonce } = encrypt("sk-test-key")
  await db.insert(providerCredential).values({ organizationId: orgId, provider: "anthropic", ciphertext, nonce })
}

async function ownerUserId(): Promise<string> {
  const [row] = await db.select({ id: user.id }).from(user).limit(1)
  return row!.id
}

async function seedInProgressRun() {
  const [run] = await db.insert(selfHealRun).values({ issueId, status: "developing" }).returning()
  await db.insert(selfHealStep).values([
    { runId: run!.id, name: "investigate", status: "done", detail: "Reviewed the issue title and latest crash payload." },
    { runId: run!.id, name: "clone", status: "done", detail: "Cloned the repo and checked out a fix branch." },
    { runId: run!.id, name: "develop", status: "active" },
    { runId: run!.id, name: "test", status: "pending" },
    { runId: run!.id, name: "open_pr", status: "pending" },
  ])
}
