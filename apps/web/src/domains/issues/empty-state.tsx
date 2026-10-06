"use client"

import Link from "next/link"
import { TrayIcon } from "@phosphor-icons/react/Tray"
import type { ShellContext } from "@/src/domains/shell/get-shell-context"

export function IssuesEmptyState({ context }: { context: ShellContext }) {
  if (!context.firstProject) return <NoProjectYet />
  return <WaitingForData projectName={context.firstProject.name} projectSlug={context.firstProject.slug} />
}

function NoProjectYet() {
  return (
    <Centered>
      <IconBadge />
      <Copy heading="No projects yet" body="Create a project in Settings to get its ingestion key and start seeing issues here." />
      <Link
        href="/settings/projects"
        className="bg-primary text-primary-foreground flex h-9 items-center rounded-md px-4 text-sm font-medium"
      >
        Create a project
      </Link>
    </Centered>
  )
}

function WaitingForData({ projectName, projectSlug }: { projectName: string; projectSlug: string }) {
  return (
    <Centered>
      <IconBadge />
      <Copy
        heading="No issues yet"
        body={`Once ${projectName} starts streaming logs and crash reports, anything that needs attention will show up here.`}
      />
      <div className="bg-muted text-foreground rounded-lg p-4 font-mono text-xs leading-relaxed">
        <div>
          <span className="text-muted-foreground">POST</span> /api/ingest/{projectSlug}/logs
        </div>
        <div className="text-muted-foreground">Authorization: Bearer &lt;ingestion_key&gt;</div>
      </div>
      <Link href="/settings/projects" className="flex h-9 items-center rounded-md border px-4 text-sm font-medium">
        View ingestion key
      </Link>
    </Centered>
  )
}

function IconBadge() {
  return (
    <div className="bg-muted flex size-14 items-center justify-center rounded-full">
      <TrayIcon className="text-muted-foreground" size={26} />
    </div>
  )
}

function Copy({ heading, body }: { heading: string; body: string }) {
  return (
    <div className="flex max-w-105 flex-col items-center gap-1.5 text-center">
      <h2 className="text-base font-semibold">{heading}</h2>
      <p className="text-muted-foreground text-sm">{body}</p>
    </div>
  )
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-1 flex-col items-center justify-center gap-4 p-10">{children}</div>
}
