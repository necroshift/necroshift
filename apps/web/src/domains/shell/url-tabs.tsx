"use client"

import type { ReactNode } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"

type Tab = { value: string; label: string; content: ReactNode }

export function UrlTabs({ tabs }: { tabs: Tab[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const active = searchParams.get("tab") ?? tabs[0]!.value

  return (
    <Tabs value={active} onValueChange={(value) => router.replace(`?tab=${value}`, { scroll: false })}>
      <TabsList>
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className="pt-6">
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  )
}
