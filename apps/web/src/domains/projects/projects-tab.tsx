"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { FolderSimpleIcon } from "@phosphor-icons/react/FolderSimple"
import { createProject, listProjects } from "./actions"
import { NewKeyBanner } from "./new-key-banner"
import { ProjectRepoField } from "./project-repo-field"

export function ProjectsTab() {
  const queryClient = useQueryClient()
  const [showNewProject, setShowNewProject] = useState(false)
  const [name, setName] = useState("")
  const [justCreatedKey, setJustCreatedKey] = useState<string | null>(null)

  const { data: projects = [] } = useQuery({ queryKey: ["projects"], queryFn: listProjects })

  const mutation = useMutation({
    mutationFn: () => createProject({ name }),
    onSuccess: (result) => {
      if (!result.success) return toast.error(result.error)
      setJustCreatedKey(result.data.ingestionKey)
      setName("")
      setShowNewProject(false)
      queryClient.invalidateQueries({ queryKey: ["projects"] })
    },
  })

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold">Projects</h2>
          <p className="text-muted-foreground text-sm">Each project gets its own ingestion key for the SDK.</p>
        </div>
        <Button onClick={() => setShowNewProject((v) => !v)}>New project</Button>
      </div>

      {showNewProject && (
        <div className="bg-muted flex items-end gap-2.5 rounded-lg p-4">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="project-name">Project name</Label>
            <Input id="project-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Notifications Worker" />
          </div>
          <Button disabled={mutation.isPending || !name.trim()} onClick={() => mutation.mutate()}>
            Create
          </Button>
          <Button variant="outline" onClick={() => setShowNewProject(false)}>
            Cancel
          </Button>
        </div>
      )}

      {justCreatedKey && <NewKeyBanner ingestionKey={justCreatedKey} onDismiss={() => setJustCreatedKey(null)} />}

      <div className="divide-y rounded-lg border">
        {projects.length === 0 && <p className="text-muted-foreground p-4 text-sm">No projects yet.</p>}
        {projects.map((p) => (
          <div key={p.id} className="flex items-center gap-3.5 p-4">
            <FolderSimpleIcon className="text-muted-foreground" size={18} />
            <div className="flex min-w-40 flex-col gap-0.5">
              <span className="text-sm font-medium">{p.name}</span>
              <span className="text-muted-foreground text-xs">{p.slug}</span>
            </div>
            <div className="text-muted-foreground bg-muted rounded-md px-2.5 py-1.5 font-mono text-xs">
              nk_live_••••••••••••••••
            </div>
            <ProjectRepoField projectId={p.id} repoUrl={p.repoUrl} />
            <span className="text-muted-foreground text-xs">{new Date(p.createdAt).toLocaleDateString()}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
