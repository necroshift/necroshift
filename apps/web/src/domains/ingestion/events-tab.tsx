"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Badge } from "@workspace/ui/components/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select"
import { listProjects } from "@/src/domains/projects/actions"
import { listIngestionEvents, type IngestionEventRow } from "./events-actions"

export function EventsTab() {
  const [projectId, setProjectId] = useState<string>("all")
  const [status, setStatus] = useState<string>("all")

  const { data: projects = [] } = useQuery({ queryKey: ["projects"], queryFn: listProjects })
  const { data: events = [] } = useQuery({
    queryKey: ["ingestion-events", projectId, status],
    queryFn: () =>
      listIngestionEvents({
        projectId: projectId === "all" ? undefined : projectId,
        status: status === "all" ? undefined : (status as "success" | "error"),
      }),
  })

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold">Integration Events</h2>
        <p className="text-muted-foreground text-sm">
          Every ingestion attempt, most recent first. Capped at 100 events per project.
        </p>
      </div>

      <div className="flex gap-2.5">
        <Select value={projectId} onValueChange={(value) => setProjectId(value ?? "all")}>
          <SelectTrigger className="w-48">
            <SelectValue>
              {projectId === "all" ? "All projects" : (projects.find((p) => p.id === projectId)?.name ?? "All projects")}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All projects</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(value) => setStatus(value ?? "all")}>
          <SelectTrigger className="w-40">
            <SelectValue>{status === "all" ? "All statuses" : status}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="success">success</SelectItem>
            <SelectItem value="error">error</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border">
        <div className="text-muted-foreground grid grid-cols-[150px_90px_110px_1fr] gap-3.5 border-b px-4 py-2.5 text-xs font-semibold tracking-wide uppercase">
          <span>Time</span>
          <span>Payload</span>
          <span>Status</span>
          <span>Error reason</span>
        </div>
        {events.length === 0 && <p className="text-muted-foreground p-4 text-sm">No ingestion events yet.</p>}
        {events.map((e) => (
          <EventRow key={e.id} event={e} />
        ))}
      </div>
    </div>
  )
}

function EventRow({ event }: { event: IngestionEventRow }) {
  return (
    <div className="grid grid-cols-[150px_90px_110px_1fr] items-center gap-3.5 border-b px-4 py-3 text-sm last:border-b-0">
      <span className="text-muted-foreground text-xs">{new Date(event.receivedAt).toLocaleString()}</span>
      <span>{event.payloadType}</span>
      <Badge variant={event.status === "success" ? "secondary" : "destructive"} className="w-fit">
        {event.status}
      </Badge>
      <span className="text-muted-foreground font-mono text-xs">{event.errorReason ?? "—"}</span>
    </div>
  )
}
