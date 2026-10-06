import { redirect } from "next/navigation"
import { needsOnboarding } from "@/src/domains/onboarding/needs-onboarding"
import { getCurrentSession } from "@/src/domains/auth/get-current-session"
import { hasGithubAccount } from "@/src/domains/onboarding/has-github-account"
import { OnboardingWizard } from "@/src/domains/onboarding/onboarding-wizard"

export const dynamic = "force-dynamic"

export default async function OnboardingPage() {
  const [needsSetup, session] = await Promise.all([needsOnboarding(), getCurrentSession()])

  // Next re-renders this server component after every Server Action the
  // wizard calls (its default post-action router refresh) — including the
  // one that creates the organization in step 2. Gating on needsSetup
  // alone would flip to "redirect" mid-wizard, the instant step 2
  // succeeds, kicking a signed-in owner out before step 4. A session
  // means onboarding is still in progress for THIS visitor; only a
  // sessionless visitor after setup is complete should bounce to sign-in.
  if (!needsSetup && !session) {
    redirect("/sign-in")
  }

  const githubConnected = session ? await hasGithubAccount(session.user.id) : false

  return <OnboardingWizard hasSession={Boolean(session)} githubConnected={githubConnected} />
}
