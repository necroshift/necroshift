"use client"

import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
import { CaretLeftIcon } from "@phosphor-icons/react/CaretLeft"
import { CheckCircleIcon } from "@phosphor-icons/react/CheckCircle"
import { listIngestionEvents } from "@/src/domains/ingestion/events-actions"
import { useWizardStore } from "./wizard-store"

export function StepFirstEvent() {
  const goToStep = useWizardStore((s) => s.goToStep)
  const project = useWizardStore((s) => s.project)

  const { data: events = [], refetch } = useQuery({
    queryKey: ["ingestion-events", project?.id],
    queryFn: () => listIngestionEvents({ projectId: project?.id }),
    enabled: Boolean(project),
    refetchInterval: 4000,
  })
  const received = events.length > 0

  if (!project) return null

  return (
    <div className="flex flex-col gap-6">
      <button type="button" onClick={() => goToStep(3)} className="text-muted-foreground flex items-center gap-1.5 text-sm">
        <CaretLeftIcon size={14} /> Back
      </button>

      <div className="flex flex-col gap-1.5">
        <h1 className="text-xl font-semibold">Send your first event</h1>
        <p className="text-muted-foreground text-sm">
          Point your application&apos;s SDK at {project.name} using the ingestion key. Onboarding finishes
          automatically once we see your first log or crash report.
        </p>
      </div>

      <div className="bg-muted flex flex-col gap-2 rounded-lg p-4 font-mono text-xs leading-relaxed">
        <div>
          <span className="text-muted-foreground">POST</span> /api/ingest/{project.slug}/logs
        </div>
        <div className="text-muted-foreground">Authorization: Bearer {project.ingestionKey}</div>
        <div className="text-muted-foreground">{"{"}&quot;level&quot;:&quot;error&quot;,&quot;message&quot;:&quot;Payment failed&quot;{"}"}</div>
      </div>

      {!received && (
        <div className="flex flex-col items-center gap-3.5 rounded-lg border p-6">
          <span className="bg-primary size-2.5 rounded-full" />
          <span className="text-sm font-medium">Waiting for your first event…</span>
          <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
            I&apos;ve sent a test event
          </Button>
        </div>
      )}

      {received && (
        <div className="flex flex-col items-center gap-2 rounded-lg border p-6">
          <CheckCircleIcon weight="fill" className="text-chart-2" size={28} />
          <span className="text-sm font-semibold">First event received!</span>
          <span className="text-muted-foreground text-sm">{project.name} is connected. Onboarding complete.</span>
        </div>
      )}

      {received && (
        <Link
          href="/"
          className="bg-primary text-primary-foreground flex h-9 items-center justify-center rounded-md text-sm font-medium"
        >
          Go to dashboard
        </Link>
      )}

      <Link href="/" className="text-muted-foreground text-center text-sm">
        Skip for now
      </Link>
    </div>
  )
}
