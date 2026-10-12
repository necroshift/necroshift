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

// docker-run.ts writes runId/repoUrl/githubToken/llmApiKey verbatim as
// KEY=VALUE lines in a docker --env-file; a value containing a newline
// could inject an extra, attacker-chosen env var into the sandbox
// container's environment. None of these are ever legitimately multi-line.
function isSingleLineString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && !/[\r\n]/.test(value)
}

export function isRunRequest(value: unknown): value is RunRequest {
  if (!value || typeof value !== "object") return false
  const v = value as Record<string, unknown>
  return (
    isSingleLineString(v.runId) &&
    isSingleLineString(v.repoUrl) &&
    GITHUB_HTTPS_URL.test(v.repoUrl) &&
    isSingleLineString(v.githubToken) &&
    (v.llmProvider === "anthropic" || v.llmProvider === "openai") &&
    isSingleLineString(v.llmApiKey) &&
    typeof v.issueTitle === "string"
  )
}
