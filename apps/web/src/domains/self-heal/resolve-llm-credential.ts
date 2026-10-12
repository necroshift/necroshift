import "server-only"
import { eq } from "drizzle-orm"
import { db } from "@workspace/db/client"
import { providerCredential } from "@workspace/db/schema"
import { decrypt } from "@/src/domains/api-keys/encryption"

export type LlmCredential = { provider: "anthropic" | "openai"; apiKey: string }

// Anthropic is preferred when both are configured — an arbitrary but
// documented v1 tie-break, not a statement about model quality.
export async function resolveLlmCredential(organizationId: string): Promise<LlmCredential | null> {
  const rows = await db
    .select()
    .from(providerCredential)
    .where(eq(providerCredential.organizationId, organizationId))
  const anthropic = rows.find((r) => r.provider === "anthropic")
  const openai = rows.find((r) => r.provider === "openai")
  const row = anthropic ?? openai
  if (!row) return null
  return { provider: row.provider, apiKey: decrypt(row.ciphertext, row.nonce) }
}
