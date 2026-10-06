import { redirect } from "next/navigation"
import { getCurrentSession } from "@/src/domains/auth/get-current-session"
import { isFirstRun } from "@/src/domains/auth/is-first-run"

export const dynamic = "force-dynamic"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (await isFirstRun()) {
    redirect("/onboarding")
  }

  const session = await getCurrentSession()
  if (!session) {
    redirect("/sign-in")
  }

  return children
}
