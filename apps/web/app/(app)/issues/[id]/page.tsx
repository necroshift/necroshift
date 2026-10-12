import { AppShell } from "@/src/domains/shell/app-shell"
import { getShellContext } from "@/src/domains/shell/get-shell-context"
import { getCurrentSession } from "@/src/domains/auth/get-current-session"
import { IssueDetail } from "@/src/domains/issues/issue-detail"

export default async function IssueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getCurrentSession()
  const context = await getShellContext()
  if (!session || !context) return null

  return (
    <AppShell active="issues" title="Issues" context={context} userEmail={session.user.email}>
      <IssueDetail id={id} />
    </AppShell>
  )
}
