export const STEP_NAMES = ["investigate", "clone", "develop", "test", "file_ticket", "open_pr"] as const
export type SelfHealStepName = (typeof STEP_NAMES)[number]

export type TicketTarget = {
  provider: "jira" | "linear"
  accessToken: string
  targetId: string
  targetName: string
  cloudId: string | null
  siteUrl: string | null
}

export type SandboxEnv = {
  runId: string
  repoUrl: string
  githubToken: string
  llmProvider: "anthropic" | "openai"
  llmApiKey: string
  issueTitle: string
  latestOccurrence: unknown
  organizationId: string
  projectId: string
  ticketTarget: TicketTarget | null
}

export function readSandboxEnv(): SandboxEnv {
  const require = (name: string): string => {
    const value = process.env[name]
    if (!value) throw new Error(`Missing required env var: ${name}`)
    return value
  }
  const decodeB64 = (name: string): string => Buffer.from(require(name), "base64").toString("utf8")
  return {
    runId: require("RUN_ID"),
    repoUrl: require("REPO_URL"),
    githubToken: require("GITHUB_TOKEN"),
    llmProvider: require("LLM_PROVIDER") as "anthropic" | "openai",
    llmApiKey: require("LLM_API_KEY"),
    issueTitle: decodeB64("ISSUE_TITLE_B64"),
    latestOccurrence: JSON.parse(decodeB64("LATEST_OCCURRENCE_B64")),
    organizationId: require("ORGANIZATION_ID"),
    projectId: require("PROJECT_ID"),
    ticketTarget: JSON.parse(decodeB64("TICKET_TARGET_B64")) as TicketTarget | null,
  }
}
