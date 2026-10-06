import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { AppShell } from "@/src/domains/shell/app-shell"
import { getShellContext } from "@/src/domains/shell/get-shell-context"
import { getCurrentSession } from "@/src/domains/auth/get-current-session"
import { EventsTab } from "@/src/domains/ingestion/events-tab"

export default async function SettingsApiKeysPage() {
  const session = await getCurrentSession()
  const context = await getShellContext()
  if (!session || !context) return null

  return (
    <AppShell active="api-keys" title="Settings" context={context} userEmail={session.user.email}>
      <div className="p-8">
        <Tabs defaultValue="keys">
          <TabsList>
            <TabsTrigger value="keys">API Keys</TabsTrigger>
            <TabsTrigger value="events">Integration Events</TabsTrigger>
          </TabsList>
          <TabsContent value="keys" className="pt-6">
            <p className="text-muted-foreground text-sm">API Keys — coming soon.</p>
          </TabsContent>
          <TabsContent value="events" className="pt-6">
            <EventsTab />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}
