"use client"

import { CaretDownIcon } from "@phosphor-icons/react/CaretDown"
import { FolderSimpleIcon } from "@phosphor-icons/react/FolderSimple"
import { ListBulletsIcon } from "@phosphor-icons/react/ListBullets"
import { LockIcon } from "@phosphor-icons/react/Lock"
import { PulseIcon } from "@phosphor-icons/react/Pulse"
import { UsersIcon } from "@phosphor-icons/react/Users"
import type { ReactNode } from "react"
import { NavLink } from "./nav-link"
import { ThemeToggleButton } from "./theme-toggle-button"
import type { ShellContext } from "./get-shell-context"

type ActiveSection = "issues" | "projects" | "members" | "api-keys" | "events"

export function AppShell({
  active,
  title,
  context,
  userEmail,
  children,
}: {
  active: ActiveSection
  title: string
  context: ShellContext
  userEmail: string
  children: ReactNode
}) {
  return (
    <div className="flex min-h-svh">
      <ThemeToggleButton />
      <Sidebar active={active} context={context} userEmail={userEmail} />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-14 shrink-0 items-center border-b px-6">
          <span className="text-sm font-semibold">{title}</span>
        </div>
        {children}
      </div>
    </div>
  )
}

function Sidebar({
  active,
  context,
  userEmail,
}: {
  active: ActiveSection
  context: ShellContext
  userEmail: string
}) {
  return (
    <div className="bg-sidebar flex w-60 shrink-0 flex-col justify-between border-r p-5">
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-2.5 px-1">
          <div className="bg-primary flex size-7 items-center justify-center rounded-md">
            <PulseIcon className="text-primary-foreground" weight="bold" size={16} />
          </div>
          <span className="text-sm font-semibold tracking-tight">necroshift</span>
        </div>

        <OrgSwitcher context={context} />

        <nav className="flex flex-col gap-0.5">
          <NavLink href="/" active={active === "issues"} icon={<PulseIcon size={16} />}>
            Issues
          </NavLink>

          <div className="text-muted-foreground mt-4 px-2.5 text-xs font-semibold tracking-wide uppercase">
            Settings
          </div>

          <NavLink href="/settings/projects" active={active === "projects"} icon={<FolderSimpleIcon size={16} />}>
            Projects
          </NavLink>
          <NavLink href="/settings/projects" active={active === "members"} icon={<UsersIcon size={16} />}>
            Members
          </NavLink>
          <NavLink href="/settings/api-keys" active={active === "api-keys"} icon={<LockIcon size={16} />}>
            API Keys
          </NavLink>
          <NavLink href="/settings/api-keys" active={active === "events"} icon={<ListBulletsIcon size={16} />}>
            Integration Events
          </NavLink>
        </nav>
      </div>

      <div className="flex items-center gap-2.5 border-t p-2">
        <div className="bg-sidebar-accent flex size-7.5 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
          {userEmail.slice(0, 2).toUpperCase()}
        </div>
        <span className="truncate text-sm font-medium">{userEmail}</span>
      </div>
    </div>
  )
}

function OrgSwitcher({ context }: { context: ShellContext }) {
  return (
    <button
      type="button"
      className="border-border flex h-11 items-center justify-between rounded-md border px-2.5"
    >
      <span className="flex flex-col items-start gap-0.5">
        <span className="text-sm font-semibold">{context.organization.name}</span>
        <span className="text-muted-foreground text-xs">{context.firstProject?.name ?? "No projects yet"}</span>
      </span>
      <CaretDownIcon className="text-muted-foreground" size={14} />
    </button>
  )
}
