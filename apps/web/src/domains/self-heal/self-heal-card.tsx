"use client"

import Link from "next/link"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@workspace/ui/components/button"
import { getSelfHealGuard, getLatestSelfHealRun, startSelfHealRun } from "./actions"

export function SelfHealCard({ issueId }: { issueId: string }) {
  const queryClient = useQueryClient()
  const { data: guard } = useQuery({ queryKey: ["self-heal-guard", issueId], queryFn: () => getSelfHealGuard(issueId) })
  const { data: run } = useQuery({
    queryKey: ["self-heal-run", issueId],
    queryFn: () => getLatestSelfHealRun(issueId),
  })

  const mutation = useMutation({
    mutationFn: () => startSelfHealRun(issueId),
    onSuccess: (result) => {
      if (!result.success) return toast.error(result.error)
      queryClient.invalidateQueries({ queryKey: ["self-heal-run", issueId] })
    },
  })

  const inProgress = run && run.status !== "done" && run.status !== "failed"

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4">
      <span className="text-sm font-semibold">Self-heal</span>
      {run ? <RunSummary issueId={issueId} /> : <p className="text-muted-foreground text-sm">Not started yet.</p>}
      {!inProgress && (
        <>
          <Button
            variant="outline"
            disabled={!guard?.canStart || mutation.isPending}
            onClick={() => mutation.mutate()}
            className="w-fit"
          >
            {run ? "Start again" : "Start self-heal"}
          </Button>
          {guard && !guard.canStart && (
            <p className="text-muted-foreground text-xs">Needed first: {guard.missing.join(", ")}</p>
          )}
        </>
      )}
    </div>
  )
}

function RunSummary({ issueId }: { issueId: string }) {
  return (
    <Link href={`/issues/${issueId}/self-heal`} className="text-primary w-fit text-sm font-medium">
      View self-heal run →
    </Link>
  )
}
