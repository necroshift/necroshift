import { AppShell } from "@/src/domains/shell/app-shell"
import { getShellContext } from "@/src/domains/shell/get-shell-context"
import { getCurrentSession } from "@/src/domains/auth/get-current-session"
import { ConnectionsView } from "@/src/domains/connections/connections-view"

export default async function ConnectionsPage() {
  const session = await getCurrentSession()
  const context = await getShellContext()
  if (!session || !context) return null

  return (
    <AppShell active="connections" title="Settings" context={context} userEmail={session.user.email}>
      <ConnectionsView />
    </AppShell>
  )
}
