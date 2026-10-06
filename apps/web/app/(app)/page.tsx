import { AppShell } from "@/src/domains/shell/app-shell"
import { getShellContext } from "@/src/domains/shell/get-shell-context"
import { getCurrentSession } from "@/src/domains/auth/get-current-session"
import { IssuesEmptyState } from "@/src/domains/issues/empty-state"

export default async function IssuesPage() {
  const session = await getCurrentSession()
  const context = await getShellContext()
  if (!session || !context) return null

  return (
    <AppShell active="issues" title="Issues" context={context} userEmail={session.user.email}>
      <IssuesEmptyState context={context} />
    </AppShell>
  )
}
