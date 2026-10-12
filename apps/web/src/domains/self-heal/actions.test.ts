import { afterAll, beforeAll, describe, expect, test } from "vitest"
import { eq } from "drizzle-orm"
import { db, pool } from "@workspace/db/client"
import { account, issue, organization, project, providerCredential, user } from "@workspace/db/schema"
import { encrypt } from "../api-keys/encryption"
import { computeSelfHealGuard } from "./actions"

const orgId = "test-org-self-heal"
const userId = "test-user-self-heal"
const projectNoRepoId = "test-project-no-repo"
const projectReadyId = "test-project-ready"
const issueNoRepoId = "test-issue-no-repo"
const issueReadyId = "test-issue-ready"

beforeAll(async () => {
  await db.insert(organization).values({ id: orgId, name: "Test Org", slug: orgId, createdAt: new Date() })
  await db.insert(user).values({ id: userId, name: "Owner", email: "owner-self-heal@example.com", emailVerified: true })
  await db.insert(project).values([
    { id: projectNoRepoId, organizationId: orgId, name: "No Repo", slug: "no-repo" },
    { id: projectReadyId, organizationId: orgId, name: "Ready", slug: "ready", repoUrl: "https://github.com/acme/ready" },
  ])
  await db.insert(issue).values([
    { id: issueNoRepoId, projectId: projectNoRepoId, fingerprint: "fp1", title: "A" },
    { id: issueReadyId, projectId: projectReadyId, fingerprint: "fp2", title: "B" },
  ])
  await seedLlmKey()
})

afterAll(async () => {
  await db.delete(organization).where(eq(organization.id, orgId))
  await db.delete(user).where(eq(user.id, userId))
  await pool.end()
})

async function seedLlmKey() {
  const { ciphertext, nonce } = encrypt("sk-test-key")
  await db.insert(providerCredential).values({ organizationId: orgId, provider: "anthropic", ciphertext, nonce })
}

describe("computeSelfHealGuard", () => {
  test("flags a missing repo URL", async () => {
    await withGithubAccount(async () => {
      const guard = await computeSelfHealGuard(issueNoRepoId, userId)
      expect(guard.canStart).toBe(false)
      expect(guard.missing.join(" ")).toContain("repo")
    })
  })

  test("flags a missing GitHub connection", async () => {
    const guard = await computeSelfHealGuard(issueReadyId, userId)
    expect(guard.canStart).toBe(false)
    expect(guard.missing.join(" ")).toContain("Connect GitHub")
  })

  test("passes once repo, GitHub, and an LLM key are all present", async () => {
    await withGithubAccount(async () => {
      const guard = await computeSelfHealGuard(issueReadyId, userId)
      expect(guard.canStart).toBe(true)
      expect(guard.missing).toEqual([])
    })
  })
})

async function withGithubAccount<T>(fn: () => Promise<T>): Promise<T> {
  await db.insert(account).values({ id: "test-account-self-heal", userId, providerId: "github", accountId: "gh-1" })
  try {
    return await fn()
  } finally {
    await db.delete(account).where(eq(account.id, "test-account-self-heal"))
  }
}
