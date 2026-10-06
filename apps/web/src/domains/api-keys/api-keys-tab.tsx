"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { listProviderCredentials, removeProviderCredential, setProviderCredential, type Provider } from "./actions"

const LABELS: Record<Provider, string> = { anthropic: "Anthropic", openai: "OpenAI" }

export function ApiKeysTab() {
  const { data: credentials = [] } = useQuery({ queryKey: ["provider-credentials"], queryFn: listProviderCredentials })

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold">API Keys</h2>
        <p className="text-muted-foreground text-sm">Used by the self-heal agent to call your chosen LLM provider.</p>
      </div>
      {credentials.map((c) => (
        <ProviderCard key={c.provider} credential={c} />
      ))}
    </div>
  )
}

function ProviderCard({ credential }: { credential: Awaited<ReturnType<typeof listProviderCredentials>>[number] }) {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [apiKey, setApiKey] = useState("")
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["provider-credentials"] })

  const save = useMutation({
    mutationFn: () => setProviderCredential({ provider: credential.provider, apiKey }),
    onSuccess: (result) => {
      if (!result.success) return toast.error(result.error)
      setApiKey("")
      setShowForm(false)
      invalidate()
    },
  })
  const remove = useMutation({
    mutationFn: () => removeProviderCredential(credential.provider),
    onSuccess: (result) => (result.success ? invalidate() : toast.error(result.error)),
  })

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4" data-testid={`provider-card-${credential.provider}`}>
      <div className="flex items-center gap-3.5">
        <div className="bg-muted flex size-9 items-center justify-center rounded-md text-sm font-semibold">
          {LABELS[credential.provider][0]}
        </div>
        <div className="flex min-w-40 flex-col gap-0.5">
          <span className="text-sm font-medium">{LABELS[credential.provider]}</span>
          <span className="text-muted-foreground font-mono text-xs">
            {credential.connected ? credential.masked : "No key configured"}
          </span>
        </div>
        {credential.connected ? (
          <>
            <span className="text-muted-foreground flex-1 text-right text-xs">
              Updated {new Date(credential.updatedAt!).toLocaleDateString()}
            </span>
            <Button variant="outline" size="sm" onClick={() => setShowForm((v) => !v)}>
              Edit
            </Button>
            <Button variant="outline" size="sm" className="text-destructive" onClick={() => remove.mutate()}>
              Remove
            </Button>
          </>
        ) : (
          <Button size="sm" className="ml-auto" onClick={() => setShowForm((v) => !v)}>
            Add key
          </Button>
        )}
      </div>

      {showForm && (
        <div className="bg-muted flex items-end gap-2.5 rounded-lg p-4">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor={`${credential.provider}-key`}>{LABELS[credential.provider]} API key</Label>
            <Input
              id={`${credential.provider}-key`}
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-••••••••••••••••"
            />
          </div>
          <Button disabled={save.isPending || !apiKey.trim()} onClick={() => save.mutate()}>
            Save
          </Button>
          <Button variant="outline" onClick={() => setShowForm(false)}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  )
}
