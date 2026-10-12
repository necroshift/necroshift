import { NextResponse } from "next/server"
import { requireSession } from "@/src/domains/auth/require-session"
import { verifyAndConsumeOAuthState } from "@/src/domains/connections/oauth-state"
import { exchangeJiraCode, resolveJiraSite } from "@/src/domains/connections/jira-oauth"
import { exchangeLinearCode } from "@/src/domains/connections/linear-oauth"
import { saveConnection } from "@/src/domains/connections/connection-store"

export async function GET(request: Request, { params }: { params: Promise<{ provider: string }> }) {
  await requireSession()
  const { provider } = await params
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const state = url.searchParams.get("state")
  const stateOk = await verifyAndConsumeOAuthState(state)

  if (!code || !stateOk || (provider !== "jira" && provider !== "linear")) {
    return NextResponse.redirect(new URL("/settings/connections?error=oauth_failed", url))
  }

  try {
    if (provider === "jira") await connectJira(code)
    else await connectLinear(code)
  } catch (error) {
    console.error(`Failed to connect ${provider}`, error)
    return NextResponse.redirect(new URL("/settings/connections?error=oauth_failed", url))
  }
  return NextResponse.redirect(new URL("/settings/connections", url))
}

async function connectJira(code: string): Promise<void> {
  const tokens = await exchangeJiraCode(code)
  const site = await resolveJiraSite(tokens.accessToken)
  await saveConnection({ provider: "jira", ...tokens, cloudId: site.cloudId, siteUrl: site.siteUrl })
}

async function connectLinear(code: string): Promise<void> {
  const tokens = await exchangeLinearCode(code)
  await saveConnection({ provider: "linear", ...tokens })
}
