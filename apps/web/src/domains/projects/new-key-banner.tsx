"use client"

import { toast } from "sonner"
import { Button } from "@workspace/ui/components/button"

export function NewKeyBanner({ ingestionKey, onDismiss }: { ingestionKey: string; onDismiss: () => void }) {
  return (
    <div className="bg-muted flex flex-col gap-2 rounded-lg p-4">
      <span className="text-sm font-medium">Ingestion key</span>
      <div className="bg-background rounded-md border px-2.5 py-2 font-mono text-xs break-all">{ingestionKey}</div>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-xs">Copy this now — shown only once.</span>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              void navigator.clipboard.writeText(ingestionKey)
              toast.success("Copied to clipboard.")
            }}
          >
            Copy
          </Button>
          <Button size="sm" variant="ghost" onClick={onDismiss}>
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  )
}
