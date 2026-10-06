import { redirect } from "next/navigation"
import { isFirstRun } from "@/src/domains/auth/is-first-run"

export const dynamic = "force-dynamic"

export default async function OnboardingPage() {
  if (!(await isFirstRun())) {
    redirect("/sign-in")
  }

  // The full 4-step wizard (owner account, organization, first project,
  // integration docs + first-event check) lands in a later sub-project task.
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <p className="text-muted-foreground text-sm">Owner setup — coming soon.</p>
    </div>
  )
}
