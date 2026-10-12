import "server-only"

function requiredEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required env var: ${name}`)
  return value
}

function redirectUri(): string {
  return `${requiredEnv("BETTER_AUTH_URL")}/api/connections/linear/callback`
}

export function buildLinearAuthorizeUrl(state: string): string {
  const url = new URL("https://linear.app/oauth/authorize")
  url.searchParams.set("client_id", requiredEnv("LINEAR_CLIENT_ID"))
  url.searchParams.set("redirect_uri", redirectUri())
  url.searchParams.set("response_type", "code")
  url.searchParams.set("scope", "read,write")
  url.searchParams.set("state", state)
  return url.toString()
}

export type LinearTokens = { accessToken: string; refreshToken: string | null; expiresInSeconds: number }

export async function exchangeLinearCode(code: string): Promise<LinearTokens> {
  const response = await fetch("https://api.linear.app/oauth/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: requiredEnv("LINEAR_CLIENT_ID"),
      client_secret: requiredEnv("LINEAR_CLIENT_SECRET"),
      code,
      redirect_uri: redirectUri(),
    }),
  })
  if (!response.ok) throw new Error(`Linear token exchange failed (${response.status})`)
  const data = (await response.json()) as { access_token: string; refresh_token?: string; expires_in: number }
  return { accessToken: data.access_token, refreshToken: data.refresh_token ?? null, expiresInSeconds: data.expires_in }
}
