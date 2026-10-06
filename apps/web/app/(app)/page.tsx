import { AppShell } from "@/src/domains/shell/app-shell"
import { getShellContext } from "@/src/domains/shell/get-shell-context"
import { getCurrentSession } from "@/src/domains/auth/get-current-session"

export default async function IssuesPage() {
  const session = await getCurrentSession()
  const context = await getShellContext()
  if (!session || !context) return null

  return (
    <AppShell active="issues" title="Issues" context={context} userEmail={session.user.email}>
      <div className="flex flex-1 items-center justify-center p-10">
        <p className="text-muted-foreground text-sm">Issues — coming soon.</p>
      </div>
    </AppShell>
  )
}
