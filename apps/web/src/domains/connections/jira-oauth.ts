import "server-only"

function requiredEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required env var: ${name}`)
  return value
}

function redirectUri(): string {
  return `${requiredEnv("BETTER_AUTH_URL")}/api/connections/jira/callback`
}

// read:jira-work/write:jira-work for issue creation, offline_access for a
// refresh token (Jira Cloud access tokens are short-lived).
const SCOPE = "read:jira-work write:jira-work offline_access"

export function buildJiraAuthorizeUrl(state: string): string {
  const url = new URL("https://auth.atlassian.com/authorize")
  url.searchParams.set("audience", "api.atlassian.com")
  url.searchParams.set("client_id", requiredEnv("JIRA_CLIENT_ID"))
  url.searchParams.set("scope", SCOPE)
  url.searchParams.set("redirect_uri", redirectUri())
  url.searchParams.set("state", state)
  url.searchParams.set("response_type", "code")
  url.searchParams.set("prompt", "consent")
  return url.toString()
}

export type JiraTokens = { accessToken: string; refreshToken: string | null; expiresInSeconds: number }

export async function exchangeJiraCode(code: string): Promise<JiraTokens> {
  const response = await fetch("https://auth.atlassian.com/oauth/token", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      client_id: requiredEnv("JIRA_CLIENT_ID"),
      client_secret: requiredEnv("JIRA_CLIENT_SECRET"),
      code,
      redirect_uri: redirectUri(),
    }),
  })
  if (!response.ok) throw new Error(`Jira token exchange failed (${response.status})`)
  const data = (await response.json()) as { access_token: string; refresh_token?: string; expires_in: number }
  return { accessToken: data.access_token, refreshToken: data.refresh_token ?? null, expiresInSeconds: data.expires_in }
}

export type JiraSite = { cloudId: string; siteUrl: string }

// One access token can technically cover multiple sites; v1 takes the
// first accessible one, matching "one connection per provider per
// deployment" — picking a specific site among several isn't in scope yet.
export async function resolveJiraSite(accessToken: string): Promise<JiraSite> {
  const response = await fetch("https://api.atlassian.com/oauth/token/accessible-resources", {
    headers: { authorization: `Bearer ${accessToken}`, accept: "application/json" },
  })
  if (!response.ok) throw new Error(`Could not resolve a Jira site (${response.status})`)
  const sites = (await response.json()) as { id: string; url: string }[]
  const site = sites[0]
  if (!site) throw new Error("This Atlassian account has no accessible Jira sites.")
  return { cloudId: site.id, siteUrl: site.url }
}
