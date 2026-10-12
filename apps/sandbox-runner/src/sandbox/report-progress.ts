import { and, eq } from "drizzle-orm"
import { db, pool } from "@workspace/db/client"
import { selfHealRun, selfHealStep } from "@workspace/db/schema"
import type { SelfHealStepName } from "./types"

type RunStatus = typeof selfHealRun.$inferInsert.status
type StepPatch = Partial<typeof selfHealStep.$inferInsert>

export async function setRunStatus(runId: string, status: RunStatus): Promise<void> {
  await db.update(selfHealRun).set({ status }).where(eq(selfHealRun.id, runId))
}

export async function startStep(runId: string, name: SelfHealStepName): Promise<void> {
  await updateStep(runId, name, { status: "active", startedAt: new Date() })
}

export async function finishStep(runId: string, name: SelfHealStepName, detail: string): Promise<void> {
  await updateStep(runId, name, { status: "done", detail, finishedAt: new Date() })
}

export async function failRun(runId: string, name: SelfHealStepName, errorMessage: string): Promise<void> {
  await updateStep(runId, name, { status: "failed", detail: errorMessage, finishedAt: new Date() })
  await db
    .update(selfHealRun)
    .set({ status: "failed", errorMessage, finishedAt: new Date() })
    .where(eq(selfHealRun.id, runId))
}

export async function completeRun(runId: string, summary: string, prUrl: string): Promise<void> {
  await db
    .update(selfHealRun)
    .set({ status: "done", summary, prUrl, finishedAt: new Date() })
    .where(eq(selfHealRun.id, runId))
}

async function updateStep(runId: string, name: SelfHealStepName, patch: StepPatch): Promise<void> {
  await db
    .update(selfHealStep)
    .set(patch)
    .where(and(eq(selfHealStep.runId, runId), eq(selfHealStep.name, name)))
}

export async function closeDb(): Promise<void> {
  await pool.end()
}
