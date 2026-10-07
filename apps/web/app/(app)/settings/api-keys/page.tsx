import { AppShell } from "@/src/domains/shell/app-shell"
import { UrlTabs } from "@/src/domains/shell/url-tabs"
import { getShellContext } from "@/src/domains/shell/get-shell-context"
import { getCurrentSession } from "@/src/domains/auth/get-current-session"
import { EventsTab } from "@/src/domains/ingestion/events-tab"
import { ApiKeysTab } from "@/src/domains/api-keys/api-keys-tab"

export default async function SettingsApiKeysPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const session = await getCurrentSession()
  const context = await getShellContext()
  if (!session || !context) return null

  const { tab } = await searchParams

  return (
    <AppShell active={tab === "events" ? "events" : "api-keys"} title="Settings" context={context} userEmail={session.user.email}>
      <div className="p-8">
        <UrlTabs
          tabs={[
            { value: "keys", label: "API Keys", content: <ApiKeysTab /> },
            { value: "events", label: "Integration Events", content: <EventsTab /> },
          ]}
        />
      </div>
    </AppShell>
  )
}
