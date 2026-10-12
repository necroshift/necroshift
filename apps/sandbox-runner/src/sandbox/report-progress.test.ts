import { afterAll, beforeEach, describe, expect, test } from "vitest"
import { eq } from "drizzle-orm"
import { db, pool } from "@workspace/db/client"
import { issue, organization, project, selfHealRun, selfHealStep } from "@workspace/db/schema"
import { STEP_NAMES } from "./types"
import { completeRun, failRun, finishStep, startStep } from "./report-progress"

const orgId = "test-org-report-progress"
const projectId = "test-project-report-progress"
const issueId = "test-issue-report-progress"
let runId: string

beforeEach(async () => {
  await db.delete(organization).where(eq(organization.id, orgId))
  await db.insert(organization).values({ id: orgId, name: "Test Org", slug: orgId, createdAt: new Date() })
  await db.insert(project).values({ id: projectId, organizationId: orgId, name: "P", slug: orgId })
  await db.insert(issue).values({ id: issueId, projectId, fingerprint: "fp", title: "T" })
  const [run] = await db.insert(selfHealRun).values({ issueId }).returning()
  runId = run!.id
  await db.insert(selfHealStep).values(STEP_NAMES.map((name) => ({ runId, name })))
})

afterAll(async () => {
  await db.delete(organization).where(eq(organization.id, orgId))
  await pool.end()
})

describe("report-progress", () => {
  test("startStep + finishStep update only the named step", async () => {
    await startStep(runId, "clone")
    await finishStep(runId, "clone", "cloned ok")

    const steps = await db.select().from(selfHealStep).where(eq(selfHealStep.runId, runId))
    const clone = steps.find((s) => s.name === "clone")
    const develop = steps.find((s) => s.name === "develop")
    expect(clone?.status).toBe("done")
    expect(clone?.detail).toBe("cloned ok")
    expect(develop?.status).toBe("pending")
  })

  test("failRun marks the named step failed and the run failed, leaving other steps alone", async () => {
    await startStep(runId, "test")
    await failRun(runId, "test", "tests did not pass")

    const [run] = await db.select().from(selfHealRun).where(eq(selfHealRun.id, runId))
    const steps = await db.select().from(selfHealStep).where(eq(selfHealStep.runId, runId))
    expect(run?.status).toBe("failed")
    expect(run?.errorMessage).toBe("tests did not pass")
    expect(steps.find((s) => s.name === "test")?.status).toBe("failed")
    expect(steps.find((s) => s.name === "open_pr")?.status).toBe("pending")
  })

  test("completeRun records the summary and PR url", async () => {
    await completeRun(runId, "Fixed the null check.", "https://github.com/acme/repo/pull/1")

    const [run] = await db.select().from(selfHealRun).where(eq(selfHealRun.id, runId))
    expect(run?.status).toBe("done")
    expect(run?.summary).toBe("Fixed the null check.")
    expect(run?.prUrl).toBe("https://github.com/acme/repo/pull/1")
  })
})
