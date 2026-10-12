import { NextResponse } from "next/server"
import { requireSession } from "@/src/domains/auth/require-session"
import { createOAuthState } from "@/src/domains/connections/oauth-state"
import { buildJiraAuthorizeUrl } from "@/src/domains/connections/jira-oauth"
import { buildLinearAuthorizeUrl } from "@/src/domains/connections/linear-oauth"

export async function GET(_request: Request, { params }: { params: Promise<{ provider: string }> }) {
  await requireSession()
  const { provider } = await params
  const state = await createOAuthState()
  if (provider === "jira") return NextResponse.redirect(buildJiraAuthorizeUrl(state))
  if (provider === "linear") return NextResponse.redirect(buildLinearAuthorizeUrl(state))
  return NextResponse.json({ error: "unknown_provider" }, { status: 404 })
}
