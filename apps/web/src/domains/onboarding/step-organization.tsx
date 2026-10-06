"use client"

import { useMutation } from "@tanstack/react-query"
import { useForm } from "@tanstack/react-form"
import { toast } from "sonner"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { CaretLeftIcon } from "@phosphor-icons/react/CaretLeft"
import { GithubLogoIcon } from "@phosphor-icons/react/GithubLogo"
import { CheckCircleIcon } from "@phosphor-icons/react/CheckCircle"
import { authClient } from "@/src/domains/auth/auth-client"
import { completeOrgSetup } from "./actions"
import { useWizardStore } from "./wizard-store"

export function StepOrganization() {
  const goToStep = useWizardStore((s) => s.goToStep)
  const githubConnected = useWizardStore((s) => s.githubConnected)
  const githubPromptDismissed = useWizardStore((s) => s.githubPromptDismissed)
  const dismissGithubPrompt = useWizardStore((s) => s.dismissGithubPrompt)
  const setGithubConnected = useWizardStore((s) => s.setGithubConnected)

  const connectGithub = useMutation({
    mutationFn: () => {
      setGithubConnected()
      return authClient.linkSocial({ provider: "github", scopes: ["repo"], callbackURL: "/onboarding" })
    },
    onError: () => toast.error("Could not start connecting GitHub."),
  })

  const form = useForm({
    defaultValues: { name: "" },
    onSubmit: async ({ value }) => {
      const result = await completeOrgSetup(value)
      if (!result.success) return toast.error(result.error)
      goToStep(3)
    },
  })

  return (
    <div className="flex flex-col gap-6">
      <button type="button" onClick={() => goToStep(1)} className="text-muted-foreground flex items-center gap-1.5 text-sm">
        <CaretLeftIcon size={14} /> Back
      </button>

      <div className="flex flex-col gap-1.5">
        <h1 className="text-xl font-semibold">Name your organization</h1>
        <p className="text-muted-foreground text-sm">This is the workspace everyone on your team will share.</p>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault()
          void form.handleSubmit()
        }}
        className="flex flex-col gap-4"
      >
        <form.Field name="name" validators={{ onChange: ({ value }) => (value.trim() ? undefined : "Organization name is required") }}>
          {(field) => (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="org-name">Organization name</Label>
              <Input id="org-name" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} placeholder="Acme Inc" />
            </div>
          )}
        </form.Field>

        {!githubConnected && !githubPromptDismissed && (
          <div className="bg-muted flex flex-col gap-2.5 rounded-lg p-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">Connect GitHub</span>
              <span className="text-muted-foreground text-xs">Required for the self-heal agent to open pull requests.</span>
            </div>
            <div className="flex items-center gap-3">
              <Button type="button" size="sm" variant="outline" disabled={connectGithub.isPending} onClick={() => connectGithub.mutate()}>
                <GithubLogoIcon weight="fill" /> Connect
              </Button>
              <button type="button" onClick={dismissGithubPrompt} className="text-muted-foreground text-xs">
                I&apos;ll do this later in Settings
              </button>
            </div>
          </div>
        )}

        {githubConnected && (
          <div className="bg-muted flex items-center gap-2 rounded-lg p-3">
            <CheckCircleIcon weight="fill" className="text-chart-2" size={16} />
            <span className="text-sm font-medium">GitHub connected</span>
          </div>
        )}

        <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
          {([canSubmit, isSubmitting]) => (
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? "Creating…" : "Continue"}
            </Button>
          )}
        </form.Subscribe>
      </form>
    </div>
  )
}
