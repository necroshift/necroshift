"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { GithubLogoIcon } from "@phosphor-icons/react/GithubLogo"
import { Input } from "@workspace/ui/components/input"
import { Button } from "@workspace/ui/components/button"
import { setProjectRepo } from "./actions"

export function ProjectRepoField({ projectId, repoUrl }: { projectId: string; repoUrl: string | null }) {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(repoUrl ?? "")

  const mutation = useMutation({
    mutationFn: () => setProjectRepo({ projectId, repoUrl: value }),
    onSuccess: (result) => {
      if (!result.success) return toast.error(result.error)
      setEditing(false)
      queryClient.invalidateQueries({ queryKey: ["projects"] })
    },
  })

  if (editing) {
    return (
      <div className="flex flex-1 items-center gap-2">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="https://github.com/org/repo"
          className="h-8 text-xs"
        />
        <Button size="sm" disabled={mutation.isPending} onClick={() => mutation.mutate()}>
          Save
        </Button>
        <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
          Cancel
        </Button>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="text-muted-foreground flex flex-1 items-center gap-1.5 text-left text-xs hover:text-foreground"
    >
      <GithubLogoIcon size={14} />
      {repoUrl ?? "Connect a repo for self-heal"}
    </button>
  )
}
