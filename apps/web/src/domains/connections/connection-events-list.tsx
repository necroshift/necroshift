"use client"

import { useQuery } from "@tanstack/react-query"
import { Badge } from "@workspace/ui/components/badge"
import { listConnectionEvents } from "./actions"

export function ConnectionEventsList() {
  const { data: events = [] } = useQuery({ queryKey: ["connection-events"], queryFn: listConnectionEvents })
  if (events.length === 0) return null

  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-semibold">Ticket-filing attempts</span>
      <div className="divide-y rounded-lg border">
        {events.map((event) => (
          <div key={event.id} className="flex items-center gap-3.5 px-4 py-2.5 text-sm">
            <span className="text-muted-foreground w-14 shrink-0 text-xs">{new Date(event.createdAt).toLocaleString()}</span>
            <span className="w-16 shrink-0 capitalize">{event.provider}</span>
            <Badge variant={event.status === "success" ? "secondary" : "destructive"} className="w-fit">
              {event.status}
            </Badge>
            <span className="text-muted-foreground truncate font-mono text-xs">{event.errorReason ?? "—"}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
