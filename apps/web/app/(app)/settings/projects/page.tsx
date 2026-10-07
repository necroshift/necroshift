import { AppShell } from "@/src/domains/shell/app-shell"
import { UrlTabs } from "@/src/domains/shell/url-tabs"
import { getShellContext } from "@/src/domains/shell/get-shell-context"
import { getCurrentSession } from "@/src/domains/auth/get-current-session"
import { ProjectsTab } from "@/src/domains/projects/projects-tab"
import { MembersTab } from "@/src/domains/auth/members-tab"

export default async function SettingsProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const session = await getCurrentSession()
  const context = await getShellContext()
  if (!session || !context) return null

  const { tab } = await searchParams

  return (
    <AppShell active={tab === "members" ? "members" : "projects"} title="Settings" context={context} userEmail={session.user.email}>
      <div className="p-8">
        <UrlTabs
          tabs={[
            { value: "projects", label: "Projects", content: <ProjectsTab /> },
            { value: "members", label: "Members", content: <MembersTab /> },
          ]}
        />
      </div>
    </AppShell>
  )
}
