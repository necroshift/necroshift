import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@workspace/auth"
import { isFirstRun } from "@/src/domains/auth/is-first-run"

export const dynamic = "force-dynamic"

export default async function Page() {
  if (await isFirstRun()) {
    redirect("/onboarding")
  }

  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    redirect("/sign-in")
  }

  // The real dashboard shell lands in a later sub-project task.
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <p className="text-muted-foreground text-sm">Signed in as {session.user.email} — dashboard coming soon.</p>
    </div>
  )
}
