"use server"

import { revalidatePath } from "next/cache"
import { and, eq } from "drizzle-orm"
import { db } from "@workspace/db/client"
import { providerCredential } from "@workspace/db/schema"
import { ok, fail, type ActionResult } from "@/src/lib/action-result"
import { getShellContext } from "@/src/domains/shell/get-shell-context"
import { requireSession } from "@/src/domains/auth/require-session"
import { decrypt, encrypt, maskSecret } from "./encryption"

export type Provider = "anthropic" | "openai"

export type ProviderCredentialSummary = {
  provider: Provider
  connected: boolean
  masked: string | null
  updatedAt: Date | null
}

export async function listProviderCredentials(): Promise<ProviderCredentialSummary[]> {
  await requireSession()
  const context = await getShellContext()
  if (!context) return emptySummaries()

  const rows = await db
    .select()
    .from(providerCredential)
    .where(eq(providerCredential.organizationId, context.organization.id))
  return summarize(rows)
}

function emptySummaries(): ProviderCredentialSummary[] {
  return (["anthropic", "openai"] as const).map((provider) => ({
    provider,
    connected: false,
    masked: null,
    updatedAt: null,
  }))
}

function summarize(rows: (typeof providerCredential.$inferSelect)[]): ProviderCredentialSummary[] {
  return (["anthropic", "openai"] as const).map((provider) => {
    const row = rows.find((r) => r.provider === provider)
    if (!row) return { provider, connected: false, masked: null, updatedAt: null }
    return { provider, connected: true, masked: maskSecret(decrypt(row.ciphertext, row.nonce)), updatedAt: row.updatedAt }
  })
}

export async function setProviderCredential(input: { provider: Provider; apiKey: string }): Promise<ActionResult<null>> {
  await requireSession()
  const apiKey = input.apiKey.trim()
  if (!apiKey) return fail("API key is required.")

  const context = await getShellContext()
  if (!context) return fail("No organization configured yet.")

  const { ciphertext, nonce } = encrypt(apiKey)
  await db
    .insert(providerCredential)
    .values({ organizationId: context.organization.id, provider: input.provider, ciphertext, nonce })
    .onConflictDoUpdate({
      target: [providerCredential.organizationId, providerCredential.provider],
      set: { ciphertext, nonce, updatedAt: new Date() },
    })
  revalidatePath("/settings/api-keys")
  return ok(null)
}

export async function removeProviderCredential(provider: Provider): Promise<ActionResult<null>> {
  await requireSession()
  const context = await getShellContext()
  if (!context) return fail("No organization configured yet.")

  await db
    .delete(providerCredential)
    .where(and(eq(providerCredential.organizationId, context.organization.id), eq(providerCredential.provider, provider)))
  revalidatePath("/settings/api-keys")
  return ok(null)
}
