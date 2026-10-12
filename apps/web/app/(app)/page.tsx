import { AppShell } from "@/src/domains/shell/app-shell"
import { getShellContext } from "@/src/domains/shell/get-shell-context"
import { getCurrentSession } from "@/src/domains/auth/get-current-session"
import { IssueList } from "@/src/domains/issues/issue-list"

export default async function IssuesPage() {
  const session = await getCurrentSession()
  const context = await getShellContext()
  if (!session || !context) return null

  return (
    <AppShell active="issues" title="Issues" context={context} userEmail={session.user.email}>
      <IssueList context={context} />
    </AppShell>
  )
}
