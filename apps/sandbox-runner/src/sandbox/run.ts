import { readSandboxEnv, type SandboxEnv, type SelfHealStepName } from "./types"
import { cloneRepo, createFixBranch, applyPatch, commitAll, pushBranch } from "./git"
import { listRepoFiles, guessReferencedFile, readRepoFile } from "./repo-context"
import { draftFix, type FixDraft } from "./llm"
import { runProjectTests, type TestResult } from "./test-runner"
import { openPullRequest } from "./github-api"
import { createJiraTicket } from "./jira-ticket"
import { createLinearTicket } from "./linear-ticket"
import { recordConnectionEvent } from "./record-connection-event"
import { startStep, finishStep, failRun, completeRun, closeDb } from "./report-progress"

async function main(): Promise<void> {
  const env = readSandboxEnv()
  try {
    await runPipeline(env)
  } catch (error) {
    console.error(`self-heal run ${env.runId} stopped`, error)
  } finally {
    await closeDb()
  }
}

async function runPipeline(env: SandboxEnv): Promise<void> {
  await runStep(env.runId, "investigate", async () => undefined)
  await finishStep(env.runId, "investigate", "Reviewed the issue title and latest crash payload.")

  const branchName = `necroshift/fix-${env.runId.slice(0, 8)}`
  await runStep(env.runId, "clone", () => cloneRepoAndBranch(env, branchName))
  await finishStep(env.runId, "clone", `Cloned the repo and checked out ${branchName}.`)

  const draft = await runStep(env.runId, "develop", () => developFix(env))
  await finishStep(env.runId, "develop", draft.summary)

  const testResult = await runStep(env.runId, "test", runProjectTests)
  if (testResult.verified && !testResult.passed) {
    await failRun(env.runId, "test", `The project's test suite failed:\n\n${truncate(testResult.output)}`)
    return
  }
  await finishStep(env.runId, "test", testDetail(testResult))

  const ticketUrl = await fileTicketIfConfigured(env)

  const prUrl = await runStep(env.runId, "open_pr", () => openPr(env, branchName, draft, testResult, ticketUrl))
  await finishStep(env.runId, "open_pr", `Opened ${prUrl}`)
  await completeRun(env.runId, draft.summary, prUrl)
}

async function runStep<T>(runId: string, name: SelfHealStepName, fn: () => Promise<T>): Promise<T> {
  await startStep(runId, name)
  try {
    return await fn()
  } catch (error) {
    await failRun(runId, name, error instanceof Error ? error.message : String(error))
    throw error
  }
}

async function cloneRepoAndBranch(env: SandboxEnv, branchName: string): Promise<void> {
  await cloneRepo(env.repoUrl, env.githubToken)
  await createFixBranch(branchName)
}

async function developFix(env: SandboxEnv): Promise<FixDraft> {
  const files = await listRepoFiles()
  const haystack = `${env.issueTitle}\n${JSON.stringify(env.latestOccurrence)}`
  const referencedPath = guessReferencedFile(haystack, files)
  const referencedFile = referencedPath ? { path: referencedPath, content: (await readRepoFile(referencedPath)) ?? "" } : null

  const draft = await draftFix({
    provider: env.llmProvider,
    apiKey: env.llmApiKey,
    issueTitle: env.issueTitle,
    latestOccurrence: env.latestOccurrence,
    fileListing: files,
    referencedFile,
  })
  await applyPatch(draft.diff)
  await commitAll(`Necroshift: ${draft.summary.slice(0, 72)}`)
  return draft
}

async function openPr(
  env: SandboxEnv,
  branchName: string,
  draft: FixDraft,
  testResult: TestResult,
  ticketUrl: string | null,
): Promise<string> {
  await pushBranch(branchName)
  return openPullRequest({
    repoUrl: env.repoUrl,
    githubToken: env.githubToken,
    branchName,
    title: `Necroshift: ${draft.summary.slice(0, 72)}`,
    body: prBody(env, draft, testResult, ticketUrl),
  })
}

function prBody(env: SandboxEnv, draft: FixDraft, testResult: TestResult, ticketUrl: string | null): string {
  const testNote = testResult.verified
    ? "The project's test suite passed."
    : "No runnable test suite was detected — this fix has not been verified by tests. Review carefully."
  return [
    "**Automated fix from Necroshift — please review before merging.**",
    "",
    `Issue: ${env.issueTitle}`,
    ...(ticketUrl ? ["", `Tracked at: ${ticketUrl}`] : []),
    "",
    draft.summary,
    "",
    testNote,
  ].join("\n")
}

// Ticket filing is opt-in per project and, per CLAUDE.md's Integrations
// decision, never blocks the fix: a failure here is recorded as a
// connection_event and the pipeline proceeds to open the PR unlinked.
async function fileTicketIfConfigured(env: SandboxEnv): Promise<string | null> {
  const target = env.ticketTarget
  if (!target) return null

  await startStep(env.runId, "file_ticket")
  try {
    const url = await fileTicket(env, target)
    await recordConnectionEvent({ organizationId: env.organizationId, provider: target.provider, projectId: env.projectId, status: "success" })
    await finishStep(env.runId, "file_ticket", `Created a ${providerLabel(target.provider)} ticket: ${url}`)
    return url
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    await recordConnectionEvent({
      organizationId: env.organizationId,
      provider: target.provider,
      projectId: env.projectId,
      status: "error",
      errorReason: message,
    })
    await finishStep(env.runId, "file_ticket", `Ticket creation failed, continuing without one: ${message}`)
    return null
  }
}

async function fileTicket(env: SandboxEnv, target: NonNullable<SandboxEnv["ticketTarget"]>): Promise<string> {
  const description = `Necroshift detected this issue and is drafting a fix.\n\nIssue: ${env.issueTitle}`
  if (target.provider === "jira") {
    if (!target.cloudId || !target.siteUrl) throw new Error("Jira connection is missing its site info.")
    const { url } = await createJiraTicket({
      accessToken: target.accessToken,
      cloudId: target.cloudId,
      siteUrl: target.siteUrl,
      projectKey: target.targetId,
      summary: `Necroshift: ${env.issueTitle}`,
      description,
    })
    return url
  }
  const { url } = await createLinearTicket({
    accessToken: target.accessToken,
    teamId: target.targetId,
    title: `Necroshift: ${env.issueTitle}`,
    description,
  })
  return url
}

function providerLabel(provider: "jira" | "linear"): string {
  return provider === "jira" ? "Jira" : "Linear"
}

function testDetail(result: TestResult): string {
  if (!result.verified) return "No runnable test suite detected — proceeding without test verification."
  return result.passed ? "Project test suite passed." : "Project test suite failed."
}

function truncate(text: string): string {
  return text.length > 4000 ? `${text.slice(0, 4000)}…` : text
}

main()
