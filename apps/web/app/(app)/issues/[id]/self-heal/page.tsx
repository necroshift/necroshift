import { AppShell } from "@/src/domains/shell/app-shell"
import { getShellContext } from "@/src/domains/shell/get-shell-context"
import { getCurrentSession } from "@/src/domains/auth/get-current-session"
import { SelfHealRunView } from "@/src/domains/self-heal/self-heal-run-view"

export default async function SelfHealRunPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getCurrentSession()
  const context = await getShellContext()
  if (!session || !context) return null

  return (
    <AppShell active="issues" title="Issues" context={context} userEmail={session.user.email}>
      <SelfHealRunView issueId={id} />
    </AppShell>
  )
}
