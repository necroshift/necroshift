export type RunRequest = {
  runId: string
  repoUrl: string
  githubToken: string
  llmProvider: "anthropic" | "openai"
  llmApiKey: string
  issueTitle: string
  latestOccurrence: unknown
}

export function isRunRequest(value: unknown): value is RunRequest {
  if (!value || typeof value !== "object") return false
  const v = value as Record<string, unknown>
  return (
    typeof v.runId === "string" &&
    typeof v.repoUrl === "string" &&
    typeof v.githubToken === "string" &&
    (v.llmProvider === "anthropic" || v.llmProvider === "openai") &&
    typeof v.llmApiKey === "string" &&
    typeof v.issueTitle === "string"
  )
}
