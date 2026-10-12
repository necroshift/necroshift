"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select"
import { listProjects } from "@/src/domains/projects/actions"
import { listConnections, listProjectRouting, listRoutingTargets, setProjectRouting, type Provider } from "./actions"

export function ProjectRoutingTable() {
  const { data: projects = [] } = useQuery({ queryKey: ["projects"], queryFn: listProjects })
  const { data: connections = [] } = useQuery({ queryKey: ["connections"], queryFn: listConnections })
  const { data: routing = [] } = useQuery({ queryKey: ["project-routing"], queryFn: listProjectRouting })

  const connectedProviders = connections.filter((c) => c.connected).map((c) => c.provider)
  if (projects.length === 0 || connectedProviders.length === 0) return null

  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-semibold">Project routing</span>
      <div className="divide-y rounded-lg border">
        {projects.map((project) => (
          <div key={project.id} className="flex items-center gap-4 p-4">
            <span className="w-40 shrink-0 truncate text-sm font-medium">{project.name}</span>
            {connectedProviders.map((provider) => (
              <RoutingPicker
                key={provider}
                projectId={project.id}
                provider={provider}
                current={routing.find((r) => r.projectId === project.id && r.provider === provider)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function RoutingPicker({
  projectId,
  provider,
  current,
}: {
  projectId: string
  provider: Provider
  current: { targetId: string; targetName: string } | undefined
}) {
  const queryClient = useQueryClient()
  const { data: targets = [] } = useQuery({
    queryKey: ["routing-targets", provider],
    queryFn: () => listRoutingTargets(provider),
  })

  const mutation = useMutation({
    mutationFn: (targetId: string) => {
      const target = targets.find((t) => t.id === targetId)
      return setProjectRouting({ projectId, provider, targetId, targetName: target?.name ?? targetId })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["project-routing"] }),
  })

  return (
    <Select value={current?.targetId ?? ""} onValueChange={(value) => value && mutation.mutate(value)}>
      <SelectTrigger className="w-48">
        <SelectValue>{current?.targetName ?? `No ${provider} target`}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {targets.map((t) => (
          <SelectItem key={t.id} value={t.id}>
            {t.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
