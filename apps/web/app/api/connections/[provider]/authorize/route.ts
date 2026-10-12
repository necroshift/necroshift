import { NextResponse } from "next/server"
import { requireSession } from "@/src/domains/auth/require-session"
import { createOAuthState } from "@/src/domains/connections/oauth-state"
import { buildJiraAuthorizeUrl, isJiraConfigured } from "@/src/domains/connections/jira-oauth"
import { buildLinearAuthorizeUrl, isLinearConfigured } from "@/src/domains/connections/linear-oauth"

export async function GET(request: Request, { params }: { params: Promise<{ provider: string }> }) {
  await requireSession()
  const { provider } = await params
  if (provider !== "jira" && provider !== "linear") return NextResponse.json({ error: "unknown_provider" }, { status: 404 })

  // Defense in depth: the UI already disables Connect when a provider isn't
  // configured, but this route is directly reachable, so re-check here too
  // rather than letting a missing env var surface as a 500 (NEC-7 follow-up).
  const configured = provider === "jira" ? isJiraConfigured() : isLinearConfigured()
  if (!configured) return NextResponse.redirect(new URL("/settings/connections?error=not_configured", request.url))

  const state = await createOAuthState()
  if (provider === "jira") return NextResponse.redirect(buildJiraAuthorizeUrl(state))
  return NextResponse.redirect(buildLinearAuthorizeUrl(state))
}
