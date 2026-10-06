"use client"

import Link from "next/link"
import { useForm } from "@tanstack/react-form"
import { toast } from "sonner"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { CaretLeftIcon } from "@phosphor-icons/react/CaretLeft"
import { createProject } from "@/src/domains/projects/actions"
import { useWizardStore } from "./wizard-store"

export function StepProject() {
  const goToStep = useWizardStore((s) => s.goToStep)
  const project = useWizardStore((s) => s.project)
  const setProject = useWizardStore((s) => s.setProject)

  const form = useForm({
    defaultValues: { name: "" },
    onSubmit: async ({ value }) => {
      const result = await createProject(value)
      if (!result.success) return toast.error(result.error)
      setProject({ ...result.data.project, ingestionKey: result.data.ingestionKey })
    },
  })

  return (
    <div className="flex flex-col gap-6">
      <button type="button" onClick={() => goToStep(2)} className="text-muted-foreground flex items-center gap-1.5 text-sm">
        <CaretLeftIcon size={14} /> Back
      </button>

      <div className="flex flex-col gap-1.5">
        <h1 className="text-xl font-semibold">Create your first project</h1>
        <p className="text-muted-foreground text-sm">Each project gets its own ingestion key for your application&apos;s SDK.</p>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault()
          void form.handleSubmit()
        }}
        className="flex flex-col gap-4"
      >
        <form.Field name="name" validators={{ onChange: ({ value }) => (value.trim() ? undefined : "Project name is required") }}>
          {(field) => (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="project-name">Project name</Label>
              <Input
                id="project-name"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Payments API"
                disabled={Boolean(project)}
              />
            </div>
          )}
        </form.Field>

        {project && (
          <div className="bg-muted flex flex-col gap-2 rounded-lg p-4">
            <span className="text-sm font-medium">Ingestion key</span>
            <div className="bg-background rounded-md border px-2.5 py-2 font-mono text-xs break-all">{project.ingestionKey}</div>
            <span className="text-muted-foreground text-xs">
              Copy this now — shown only once. You can always view it again in Settings.
            </span>
          </div>
        )}

        {!project && (
          <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
            {([canSubmit, isSubmitting]) => (
              <Button type="submit" disabled={!canSubmit || isSubmitting}>
                {isSubmitting ? "Creating…" : "Create project"}
              </Button>
            )}
          </form.Subscribe>
        )}

        {project && (
          <Button type="button" onClick={() => goToStep(4)}>
            Continue
          </Button>
        )}
      </form>

      <Link href="/" className="text-muted-foreground text-center text-sm">
        Skip for now
      </Link>
    </div>
  )
}
