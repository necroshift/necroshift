"use client"

import { useEffect } from "react"
import { LogoMark } from "@/src/domains/shell/logo-mark"
import { ThemeToggleButton } from "@/src/domains/shell/theme-toggle-button"
import { useWizardStore } from "./wizard-store"
import { StepAccount } from "./step-account"
import { StepOrganization } from "./step-organization"
import { StepProject } from "./step-project"
import { StepFirstEvent } from "./step-first-event"

export function OnboardingWizard({ hasSession, githubConnected }: { hasSession: boolean; githubConnected: boolean }) {
  const step = useWizardStore((s) => s.step)
  const goToStep = useWizardStore((s) => s.goToStep)
  const setGithubConnected = useWizardStore((s) => s.setGithubConnected)

  useEffect(() => {
    if (githubConnected) setGithubConnected()
    if (hasSession && step === 1) goToStep(2)
    // Only on mount: a session appearing later (step 1 completing) must
    // not yank the user forward mid-interaction.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex min-h-svh flex-col">
      <ThemeToggleButton />
      <Header step={step} />
      <div className="flex flex-1 items-center justify-center px-10 pb-16">
        <div className="w-full max-w-110">
          {step === 1 && <StepAccount />}
          {step === 2 && <StepOrganization />}
          {step === 3 && <StepProject />}
          {step === 4 && <StepFirstEvent />}
        </div>
      </div>
    </div>
  )
}

function Header({ step }: { step: 1 | 2 | 3 | 4 }) {
  return (
    <div className="flex items-center justify-between px-10 py-6">
      <div className="flex items-center gap-2.5">
        <LogoMark />
        <span className="text-sm font-semibold tracking-tight">necroshift</span>
      </div>
      <div className="flex items-center gap-2.5">
        <span className="text-muted-foreground text-xs">Step {step} of 4</span>
        <div className="flex gap-1">
          {[1, 2, 3, 4].map((n) => (
            <span key={n} className={`h-1 w-7 rounded-full ${n <= step ? "bg-primary" : "bg-border"}`} />
          ))}
        </div>
      </div>
    </div>
  )
}
