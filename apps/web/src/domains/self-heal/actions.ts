"use server"

import { desc, eq } from "drizzle-orm"
import { db } from "@workspace/db/client"
import { selfHealRun, selfHealStep } from "@workspace/db/schema"
import { ok, fail, type ActionResult } from "@/src/lib/action-result"
import { requireSession } from "@/src/domains/auth/require-session"
import { hasGithubAccount } from "@/src/domains/onboarding/has-github-account"
import { getGithubAccessToken } from "@/src/domains/auth/github-token"
import { resolveIssueContext } from "./resolve-issue-context"
import { resolveLlmCredential } from "./resolve-llm-credential"
import { STEP_NAMES, type SelfHealRunRow } from "./types"

export type SelfHealGuard = { canStart: boolean; missing: string[] }

export async function getSelfHealGuard(issueId: string): Promise<SelfHealGuard> {
  const session = await requireSession()
  return computeSelfHealGuard(issueId, session.user.id)
}

// Split from getSelfHealGuard so it can be unit-tested without a Next.js
// request context (requireSession's headers() call needs one) and reused
// by startSelfHealRun without a redundant session lookup.
export async function computeSelfHealGuard(issueId: string, userId: string): Promise<SelfHealGuard> {
  const context = await resolveIssueContext(issueId)
  const missing: string[] = []
  if (!context?.repoUrl) missing.push("Set a GitHub repo for this project in Settings")
  if (!(await hasGithubAccount(userId))) missing.push("Connect GitHub")
  if (context && !(await resolveLlmCredential(context.organizationId))) missing.push("Add an LLM provider key")
  return { canStart: missing.length === 0, missing }
}

export async function startSelfHealRun(issueId: string): Promise<ActionResult<{ runId: string }>> {
  const session = await requireSession()
  const guard = await computeSelfHealGuard(issueId, session.user.id)
  if (!guard.canStart) return fail(guard.missing.join(", "))
  if (await hasRunInProgress(issueId)) return fail("A self-heal run is already in progress for this issue.")

  const context = await resolveIssueContext(issueId)
  const llm = context ? await resolveLlmCredential(context.organizationId) : null
  const githubToken = await getGithubAccessToken(session.user.id)
  if (!context || !llm || !githubToken) return fail("Missing self-heal configuration.")

  const runId = await createPendingRun(issueId)
  await dispatchToSandboxRunner({ runId, context, llm, githubToken })
  return ok({ runId })
}

async function hasRunInProgress(issueId: string): Promise<boolean> {
  const rows = await db.select({ status: selfHealRun.status }).from(selfHealRun).where(eq(selfHealRun.issueId, issueId))
  return rows.some((r) => r.status !== "done" && r.status !== "failed")
}

async function createPendingRun(issueId: string): Promise<string> {
  const [run] = await db.insert(selfHealRun).values({ issueId }).returning()
  await db.insert(selfHealStep).values(STEP_NAMES.map((name) => ({ runId: run!.id, name })))
  return run!.id
}

async function dispatchToSandboxRunner(input: {
  runId: string
  context: NonNullable<Awaited<ReturnType<typeof resolveIssueContext>>>
  llm: NonNullable<Awaited<ReturnType<typeof resolveLlmCredential>>>
  githubToken: string
}): Promise<void> {
  const url = process.env.SANDBOX_RUNNER_URL
  const secret = process.env.SANDBOX_RUNNER_SECRET
  if (!url) throw new Error("Missing required env var: SANDBOX_RUNNER_URL")
  if (!secret) throw new Error("Missing required env var: SANDBOX_RUNNER_SECRET")
  const response = await fetch(`${url}/runs`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${secret}` },
    body: JSON.stringify({
      runId: input.runId,
      repoUrl: input.context.repoUrl,
      githubToken: input.githubToken,
      llmProvider: input.llm.provider,
      llmApiKey: input.llm.apiKey,
      issueTitle: input.context.title,
      latestOccurrence: input.context.latestOccurrence,
    }),
  })
  if (!response.ok) await markRunFailed(input.runId, `sandbox-runner rejected the run (${response.status})`)
}

async function markRunFailed(runId: string, errorMessage: string): Promise<void> {
  await db.update(selfHealRun).set({ status: "failed", errorMessage, finishedAt: new Date() }).where(eq(selfHealRun.id, runId))
}

export async function getLatestSelfHealRun(issueId: string): Promise<SelfHealRunRow | null> {
  await requireSession()
  const [run] = await db
    .select()
    .from(selfHealRun)
    .where(eq(selfHealRun.issueId, issueId))
    .orderBy(desc(selfHealRun.startedAt))
    .limit(1)
  if (!run) return null
  const steps = await db.select().from(selfHealStep).where(eq(selfHealStep.runId, run.id))
  return { ...run, steps: orderSteps(steps) }
}

function orderSteps(steps: SelfHealRunRow["steps"]): SelfHealRunRow["steps"] {
  return STEP_NAMES.map((name) => steps.find((s) => s.name === name)).filter((s): s is SelfHealRunRow["steps"][number] =>
    Boolean(s),
  )
}
