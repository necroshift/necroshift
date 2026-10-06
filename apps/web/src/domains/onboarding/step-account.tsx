"use client"

import { useMutation } from "@tanstack/react-query"
import { useForm } from "@tanstack/react-form"
import { toast } from "sonner"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Separator } from "@workspace/ui/components/separator"
import { GithubLogoIcon } from "@phosphor-icons/react/GithubLogo"
import { authClient } from "@/src/domains/auth/auth-client"
import { isValidEmail, isValidPassword } from "@/src/domains/auth/validators"
import { useWizardStore } from "./wizard-store"

export function StepAccount() {
  const goToStep = useWizardStore((s) => s.goToStep)
  const setGithubConnected = useWizardStore((s) => s.setGithubConnected)

  const githubMutation = useMutation({
    mutationFn: () => {
      setGithubConnected()
      return authClient.signIn.social({ provider: "github", scopes: ["repo"], callbackURL: "/onboarding" })
    },
    onError: () => toast.error("Could not start GitHub sign-up."),
  })

  const form = useForm({
    defaultValues: { name: "", email: "", password: "" },
    onSubmit: async ({ value }) => {
      const { error } = await authClient.signUp.email(value)
      if (error) return toast.error(error.message ?? "Could not create that account.")
      goToStep(2)
    },
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-xl font-semibold">Welcome to Necroshift</h1>
        <p className="text-muted-foreground text-sm">
          No one has set this instance up yet. The account you create here becomes its <strong>owner</strong>.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Button type="button" variant="outline" disabled={githubMutation.isPending} onClick={() => githubMutation.mutate()}>
          <GithubLogoIcon weight="fill" /> Continue with GitHub
        </Button>
        <span className="text-muted-foreground text-center text-xs">Also connects GitHub for the self-heal agent.</span>
      </div>

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-muted-foreground text-xs">OR</span>
        <Separator className="flex-1" />
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault()
          void form.handleSubmit()
        }}
        className="flex flex-col gap-4"
      >
        <form.Field name="name" validators={{ onChange: ({ value }) => (value.trim() ? undefined : "Name is required") }}>
          {(field) => (
            <Field label="Name" htmlFor="name">
              <Input id="name" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} placeholder="Ada Lovelace" />
            </Field>
          )}
        </form.Field>

        <form.Field name="email" validators={{ onChange: ({ value }) => (isValidEmail(value) ? undefined : "Enter a valid email") }}>
          {(field) => (
            <Field label="Email" htmlFor="email">
              <Input id="email" type="email" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} placeholder="you@company.com" />
            </Field>
          )}
        </form.Field>

        <form.Field name="password" validators={{ onChange: ({ value }) => (isValidPassword(value) ? undefined : "Password is required") }}>
          {(field) => (
            <Field label="Password" htmlFor="password">
              <Input id="password" type="password" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} placeholder="••••••••" />
            </Field>
          )}
        </form.Field>

        <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
          {([canSubmit, isSubmitting]) => (
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? "Creating account…" : "Continue"}
            </Button>
          )}
        </form.Subscribe>
      </form>
    </div>
  )
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  )
}
