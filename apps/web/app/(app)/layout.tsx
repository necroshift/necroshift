import { redirect } from "next/navigation"
import { getCurrentSession } from "@/src/domains/auth/get-current-session"
import { needsOnboarding } from "@/src/domains/onboarding/needs-onboarding"

export const dynamic = "force-dynamic"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (await needsOnboarding()) {
    redirect("/onboarding")
  }

  const session = await getCurrentSession()
  if (!session) {
    redirect("/sign-in")
  }

  return children
}
