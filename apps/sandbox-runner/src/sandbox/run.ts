import { readSandboxEnv, type SandboxEnv, type SelfHealStepName } from "./types"
import { cloneRepo, createFixBranch, applyPatch, commitAll, pushBranch } from "./git"
import { listRepoFiles, guessReferencedFile, readRepoFile } from "./repo-context"
import { draftFix, type FixDraft } from "./llm"
import { runProjectTests, type TestResult } from "./test-runner"
import { openPullRequest } from "./github-api"
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

  const prUrl = await runStep(env.runId, "open_pr", () => openPr(env, branchName, draft, testResult))
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

async function openPr(env: SandboxEnv, branchName: string, draft: FixDraft, testResult: TestResult): Promise<string> {
  await pushBranch(branchName)
  return openPullRequest({
    repoUrl: env.repoUrl,
    githubToken: env.githubToken,
    branchName,
    title: `Necroshift: ${draft.summary.slice(0, 72)}`,
    body: prBody(env, draft, testResult),
  })
}

function prBody(env: SandboxEnv, draft: FixDraft, testResult: TestResult): string {
  const testNote = testResult.verified
    ? "The project's test suite passed."
    : "No runnable test suite was detected — this fix has not been verified by tests. Review carefully."
  return [
    "**Automated fix from Necroshift — please review before merging.**",
    "",
    `Issue: ${env.issueTitle}`,
    "",
    draft.summary,
    "",
    testNote,
  ].join("\n")
}

function testDetail(result: TestResult): string {
  if (!result.verified) return "No runnable test suite detected — proceeding without test verification."
  return result.passed ? "Project test suite passed." : "Project test suite failed."
}

function truncate(text: string): string {
  return text.length > 4000 ? `${text.slice(0, 4000)}…` : text
}

main()
