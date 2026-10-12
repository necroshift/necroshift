"use client"

import { CheckCircleIcon } from "@phosphor-icons/react/CheckCircle"
import { CircleIcon } from "@phosphor-icons/react/Circle"
import type { SelfHealRunRow } from "./types"

const STEP_LABELS: Record<string, string> = {
  investigate: "Investigate logs",
  clone: "Clone repository",
  develop: "Develop fix",
  test: "Test fix",
  open_pr: "Open pull request",
}

export function SelfHealStepper({ run }: { run: SelfHealRunRow }) {
  return (
    <div className="flex flex-col rounded-lg border p-5">
      {run.steps.map((step, i) => (
        <StepRow key={step.id} step={step} isLast={i === run.steps.length - 1} />
      ))}
    </div>
  )
}

function StepRow({ step, isLast }: { step: SelfHealRunRow["steps"][number]; isLast: boolean }) {
  return (
    <div className="flex gap-3.5 pb-5 last:pb-0">
      <div className="flex flex-col items-center">
        <StepIcon status={step.status} />
        {!isLast && <div className="bg-border mt-1 w-px flex-1" />}
      </div>
      <div className="flex flex-col gap-0.5 pb-1">
        <span className="text-sm font-medium">{STEP_LABELS[step.name]}</span>
        {step.detail && <span className="text-muted-foreground text-xs leading-relaxed">{step.detail}</span>}
      </div>
    </div>
  )
}

function StepIcon({ status }: { status: string }) {
  if (status === "done") return <CheckCircleIcon weight="fill" className="text-green-500" size={20} />
  if (status === "failed") return <CircleIcon weight="fill" className="text-destructive" size={20} />
  if (status === "active") return <CircleIcon weight="fill" className="animate-pulse text-amber-500" size={20} />
  return <CircleIcon className="text-muted-foreground" size={20} />
}
