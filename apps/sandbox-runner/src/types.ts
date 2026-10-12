export type RunRequest = {
  runId: string
  repoUrl: string
  githubToken: string
  llmProvider: "anthropic" | "openai"
  llmApiKey: string
  issueTitle: string
  latestOccurrence: unknown
}

// Defense in depth: the web app already validates repoUrl's shape before a
// project can save it, but this service shouldn't trust that — a request
// here is the boundary where an unvalidated string would reach `git clone`
// as an argument (which has known argument-injection pitfalls for a value
// starting with "-").
const GITHUB_HTTPS_URL = /^https:\/\/github\.com\/[^/\s]+\/[^/\s]+\/?$/

export function isRunRequest(value: unknown): value is RunRequest {
  if (!value || typeof value !== "object") return false
  const v = value as Record<string, unknown>
  return (
    typeof v.runId === "string" &&
    typeof v.repoUrl === "string" &&
    GITHUB_HTTPS_URL.test(v.repoUrl) &&
    typeof v.githubToken === "string" &&
    (v.llmProvider === "anthropic" || v.llmProvider === "openai") &&
    typeof v.llmApiKey === "string" &&
    typeof v.issueTitle === "string"
  )
}
