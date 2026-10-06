import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { AppShell } from "@/src/domains/shell/app-shell"
import { getShellContext } from "@/src/domains/shell/get-shell-context"
import { getCurrentSession } from "@/src/domains/auth/get-current-session"
import { ProjectsTab } from "@/src/domains/projects/projects-tab"
import { MembersTab } from "@/src/domains/auth/members-tab"

export default async function SettingsProjectsPage() {
  const session = await getCurrentSession()
  const context = await getShellContext()
  if (!session || !context) return null

  return (
    <AppShell active="projects" title="Settings" context={context} userEmail={session.user.email}>
      <div className="p-8">
        <Tabs defaultValue="projects">
          <TabsList>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
          </TabsList>
          <TabsContent value="projects" className="pt-6">
            <ProjectsTab />
          </TabsContent>
          <TabsContent value="members" className="pt-6">
            <MembersTab />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}
