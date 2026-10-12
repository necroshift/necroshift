"use client"

import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeftIcon } from "@phosphor-icons/react/ArrowLeft"
import { Badge } from "@workspace/ui/components/badge"
import { getLatestSelfHealRun } from "./actions"
import { SelfHealStepper } from "./self-heal-stepper"

const ACTIVE_STATUSES = new Set(["pending", "investigating", "cloning", "developing", "testing", "opening_pr"])

export function SelfHealRunView({ issueId }: { issueId: string }) {
  const { data: run, isPending } = useQuery({
    queryKey: ["self-heal-run", issueId],
    queryFn: () => getLatestSelfHealRun(issueId),
    refetchInterval: (query) => (ACTIVE_STATUSES.has(query.state.data?.status ?? "") ? 2000 : false),
  })

  if (isPending) return null
  if (!run) return <p className="text-muted-foreground p-6 text-sm">No self-heal run yet.</p>

  return (
    <div className="flex max-w-3xl flex-col gap-5 p-6">
      <Link href={`/issues/${issueId}`} className="text-muted-foreground flex w-fit items-center gap-1.5 text-sm">
        <ArrowLeftIcon size={14} />
        Back to issue
      </Link>

      <div className="flex items-center gap-2.5">
        <h1 className="text-lg font-semibold">Self-heal run</h1>
        <Badge variant={run.status === "failed" ? "destructive" : run.status === "done" ? "secondary" : "default"}>
          {run.status}
        </Badge>
      </div>

      <SelfHealStepper run={run} />

      {run.summary && (
        <div className="flex flex-col gap-2 rounded-lg border p-4">
          <span className="text-sm font-semibold">Agent summary</span>
          <p className="text-muted-foreground text-sm leading-relaxed">{run.summary}</p>
        </div>
      )}

      {run.errorMessage && (
        <div className="border-destructive/30 bg-destructive/5 text-destructive flex flex-col gap-2 rounded-lg border p-4">
          <span className="text-sm font-semibold">Error</span>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{run.errorMessage}</p>
        </div>
      )}

      {run.prUrl ? (
        <a
          href={run.prUrl}
          target="_blank"
          rel="noreferrer"
          className="bg-primary text-primary-foreground flex h-9 w-fit items-center rounded-md px-4 text-sm font-medium"
        >
          View pull request →
        </a>
      ) : (
        <div className="text-muted-foreground flex h-10 items-center justify-center rounded-lg border border-dashed text-sm">
          Pull request will appear here once the fix is tested
        </div>
      )}
    </div>
  )
}
