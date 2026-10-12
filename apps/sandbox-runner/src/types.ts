export type TicketTarget = {
  provider: "jira" | "linear"
  accessToken: string
  targetId: string
  targetName: string
  cloudId: string | null
  siteUrl: string | null
}

export type RunRequest = {
  runId: string
  repoUrl: string
  githubToken: string
  llmProvider: "anthropic" | "openai"
  llmApiKey: string
  issueTitle: string
  latestOccurrence: unknown
  ticketTarget: TicketTarget | null
  organizationId: string
  projectId: string
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

function isTicketTarget(value: unknown): value is TicketTarget {
  if (!value || typeof value !== "object") return false
  const v = value as Record<string, unknown>
  return (
    (v.provider === "jira" || v.provider === "linear") &&
    isSingleLineString(v.accessToken) &&
    isSingleLineString(v.targetId) &&
    typeof v.targetName === "string" &&
    (v.cloudId === null || isSingleLineString(v.cloudId)) &&
    (v.siteUrl === null || isSingleLineString(v.siteUrl))
  )
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
    typeof v.issueTitle === "string" &&
    (v.ticketTarget === null || isTicketTarget(v.ticketTarget)) &&
    isSingleLineString(v.organizationId) &&
    isSingleLineString(v.projectId)
  )
}
