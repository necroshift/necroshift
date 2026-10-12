"use client"

import { useQuery } from "@tanstack/react-query"
import { listConnections } from "./actions"
import { ConnectionCard } from "./connection-card"
import { ConnectionEventsList } from "./connection-events-list"
import { ProjectRoutingTable } from "./project-routing-table"

export function ConnectionsView() {
  const { data: connections = [] } = useQuery({ queryKey: ["connections"], queryFn: listConnections })

  return (
    <div className="flex flex-col gap-7 p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold">Connections</h2>
        <p className="text-muted-foreground text-sm">
          Connect Jira or Linear so self-heal files a tracked ticket before opening a fix PR.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {connections.map((summary) => (
          <ConnectionCard key={summary.provider} summary={summary} />
        ))}
      </div>

      <ProjectRoutingTable />
      <ConnectionEventsList />
    </div>
  )
}
