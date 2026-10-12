"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { disconnectConnection, type ConnectionSummary, type Provider } from "./actions"

const LABELS: Record<Provider, string> = { jira: "Jira", linear: "Linear" }

export function ConnectionCard({ summary }: { summary: ConnectionSummary }) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: () => disconnectConnection(summary.provider),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["connections"] }),
  })

  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold">{LABELS[summary.provider]}</span>
        <div className="flex items-center gap-2">
          <Badge variant={summary.connected ? "secondary" : "outline"} className="w-fit">
            {summary.connected ? "Connected" : "Not connected"}
          </Badge>
          {summary.connected && summary.label && <span className="text-muted-foreground text-xs">{summary.label}</span>}
        </div>
      </div>
      {summary.connected ? (
        <Button variant="outline" disabled={mutation.isPending} onClick={() => mutation.mutate()}>
          Disconnect
        </Button>
      ) : (
        <a href={`/api/connections/${summary.provider}/authorize`}>
          <Button>Connect</Button>
        </a>
      )}
    </div>
  )
}
