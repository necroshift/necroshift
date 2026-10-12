"use client"

import Link from "next/link"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ArrowLeftIcon } from "@phosphor-icons/react/ArrowLeft"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { getIssue, getLatestOccurrence, markResolved } from "./actions"

export function IssueDetail({ id }: { id: string }) {
  const queryClient = useQueryClient()
  const { data: issue, isPending } = useQuery({ queryKey: ["issue", id], queryFn: () => getIssue(id) })
  const { data: latestOccurrence } = useQuery({
    queryKey: ["issue", id, "latest-occurrence"],
    queryFn: () => getLatestOccurrence(id),
  })

  const mutation = useMutation({
    mutationFn: () => markResolved(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issue", id] })
      queryClient.invalidateQueries({ queryKey: ["issues"] })
    },
  })

  if (isPending) return null
  if (!issue) return <p className="text-muted-foreground p-6 text-sm">Issue not found.</p>

  return (
    <div className="flex flex-col gap-5 p-6">
      <Link href="/" className="text-muted-foreground flex w-fit items-center gap-1.5 text-sm">
        <ArrowLeftIcon size={14} />
        Back to Issues
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-lg font-semibold leading-snug">{issue.title}</h1>
          <div className="flex items-center gap-2.5">
            <Badge variant={issue.status === "open" ? "destructive" : "secondary"}>{issue.status}</Badge>
            <span className="text-muted-foreground text-xs">{issue.projectName}</span>
          </div>
        </div>
        {issue.status === "open" && (
          <Button variant="outline" disabled={mutation.isPending} onClick={() => mutation.mutate()}>
            Mark resolved
          </Button>
        )}
      </div>

      <div className="flex gap-7 border-y py-3.5">
        <Stat label="Occurrences" value={issue.occurrenceCount} />
        <Stat label="First seen" value={new Date(issue.firstSeenAt).toLocaleString()} />
        <Stat label="Last seen" value={new Date(issue.lastSeenAt).toLocaleString()} />
      </div>

      {latestOccurrence != null && (
        <div className="flex flex-col gap-2.5 rounded-lg border p-4">
          <span className="text-sm font-semibold">Latest occurrence</span>
          <pre className="bg-muted overflow-x-auto rounded-md p-3.5 font-mono text-xs leading-relaxed whitespace-pre-wrap">
            {JSON.stringify(latestOccurrence, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  )
}
