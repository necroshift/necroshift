"use client"

import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { Badge } from "@workspace/ui/components/badge"
import { listIssues, type IssueSummary } from "./actions"
import { IssuesEmptyState } from "./empty-state"
import type { ShellContext } from "@/src/domains/shell/get-shell-context"

export function IssueList({ context }: { context: ShellContext }) {
  const { data: issues = [], isPending } = useQuery({ queryKey: ["issues"], queryFn: listIssues })

  if (isPending) return null
  if (issues.length === 0) return <IssuesEmptyState context={context} />

  return (
    <div className="flex flex-col gap-5 p-6">
      <div className="divide-y rounded-lg border">
        {issues.map((row) => (
          <IssueRow key={row.id} issue={row} />
        ))}
      </div>
    </div>
  )
}

function IssueRow({ issue }: { issue: IssueSummary }) {
  return (
    <Link
      href={`/issues/${issue.id}`}
      className="flex items-center gap-3.5 px-4 py-3 text-sm hover:bg-muted/50"
    >
      <span className={`size-2 shrink-0 rounded-full ${issue.status === "open" ? "bg-destructive" : "bg-muted-foreground"}`} />
      <span className="flex-1 truncate font-medium">{issue.title}</span>
      <span className="text-muted-foreground w-32 truncate text-xs">{issue.projectName}</span>
      <Badge variant={issue.status === "open" ? "destructive" : "secondary"} className="w-fit">
        {issue.status}
      </Badge>
      <span className="text-muted-foreground w-14 shrink-0 text-right text-xs">{issue.occurrenceCount}×</span>
      <span className="text-muted-foreground w-36 shrink-0 text-right text-xs">
        {new Date(issue.lastSeenAt).toLocaleString()}
      </span>
    </Link>
  )
}
