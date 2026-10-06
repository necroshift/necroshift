"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { MoonIcon } from "@phosphor-icons/react/Moon"
import { SunIcon } from "@phosphor-icons/react/Sun"
import { Button } from "@workspace/ui/components/button"

export function ThemeToggleButton() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="fixed top-3.5 right-5 z-10 rounded-full"
      aria-label="Toggle theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      {mounted && resolvedTheme === "dark" ? <SunIcon /> : <MoonIcon />}
    </Button>
  )
}
