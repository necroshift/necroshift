"use client"

import { useRouter } from "next/navigation"
import { useMutation } from "@tanstack/react-query"
import { useForm } from "@tanstack/react-form"
import { toast } from "sonner"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Separator } from "@workspace/ui/components/separator"
import { GithubLogoIcon } from "@phosphor-icons/react/GithubLogo"
import { signIn } from "./auth-client"
import { isValidEmail, isValidPassword } from "./validators"

function FieldError({ errors }: { errors: string[] }) {
  if (errors.length === 0) return null
  return <span className="text-destructive text-xs">{errors.join(", ")}</span>
}

function GitHubSignInButton() {
  const mutation = useMutation({
    mutationFn: () => signIn.social({ provider: "github", callbackURL: "/" }),
    onError: () => toast.error("Could not start GitHub sign-in."),
  })
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      disabled={mutation.isPending}
      onClick={() => mutation.mutate()}
    >
      <GithubLogoIcon weight="fill" /> Continue with GitHub
    </Button>
  )
}

export function SignInForm() {
  const router = useRouter()

  const mutation = useMutation({
    mutationFn: async (value: { email: string; password: string }) => {
      const { error } = await signIn.email(value)
      if (error) throw new Error(error.message ?? "Invalid email or password.")
    },
    onSuccess: () => router.push("/"),
    onError: (error) => toast.error(error.message),
  })

  const form = useForm({
    defaultValues: { email: "", password: "" },
    onSubmit: async ({ value }) => mutation.mutateAsync(value),
  })

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        void form.handleSubmit()
      }}
      className="flex flex-col gap-6"
    >
      <GitHubSignInButton />

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-muted-foreground text-xs">OR</span>
        <Separator className="flex-1" />
      </div>

      <form.Field
        name="email"
        validators={{ onChange: ({ value }) => (isValidEmail(value) ? undefined : "Enter a valid email") }}
      >
        {(field) => (
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@company.com"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
            />
            <FieldError errors={field.state.meta.errors as string[]} />
          </div>
        )}
      </form.Field>

      <form.Field
        name="password"
        validators={{ onChange: ({ value }) => (isValidPassword(value) ? undefined : "Password is required") }}
      >
        {(field) => (
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
            />
            <FieldError errors={field.state.meta.errors as string[]} />
          </div>
        )}
      </form.Field>

      <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
        {([canSubmit, isSubmitting]) => (
          <Button type="submit" className="w-full" disabled={!canSubmit || isSubmitting}>
            {isSubmitting ? "Signing in…" : "Sign in"}
          </Button>
        )}
      </form.Subscribe>
    </form>
  )
}
