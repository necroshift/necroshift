import Link from "next/link"
import type { ReactNode } from "react"
import { cn } from "@workspace/ui/lib/utils"

export function NavLink({
  href,
  active,
  icon,
  children,
}: {
  href: string
  active: boolean
  icon: ReactNode
  children: ReactNode
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm font-medium",
        active ? "bg-primary/10 text-primary" : "text-sidebar-foreground hover:bg-sidebar-accent",
      )}
    >
      {icon}
      {children}
    </Link>
  )
}
