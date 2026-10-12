import "server-only"
import { and, eq } from "drizzle-orm"
import { db } from "@workspace/db/client"
import { connection } from "@workspace/db/schema"
import { encrypt, decrypt } from "@/src/domains/api-keys/encryption"
import { getShellContext } from "@/src/domains/shell/get-shell-context"

export type Provider = "jira" | "linear"

// Called from the OAuth callback route — a plain server-side function this
// domain owns, not a client-bindable "use server" action.
export async function saveConnection(input: {
  provider: Provider
  accessToken: string
  refreshToken: string | null
  expiresInSeconds: number
  cloudId?: string
  siteUrl?: string
}): Promise<void> {
  const context = await getShellContext()
  if (!context) throw new Error("No organization configured yet.")

  const access = encrypt(input.accessToken)
  const refresh = input.refreshToken ? encrypt(input.refreshToken) : null
  const expiresAt = new Date(Date.now() + input.expiresInSeconds * 1000)
  const values = {
    organizationId: context.organization.id,
    provider: input.provider,
    accessTokenCiphertext: access.ciphertext,
    accessTokenNonce: access.nonce,
    refreshTokenCiphertext: refresh?.ciphertext,
    refreshTokenNonce: refresh?.nonce,
    expiresAt,
    cloudId: input.cloudId,
    siteUrl: input.siteUrl,
  }

  await db
    .insert(connection)
    .values(values)
    .onConflictDoUpdate({
      target: [connection.organizationId, connection.provider],
      set: { ...values, updatedAt: new Date() },
    })
}

export type DecryptedConnection = { accessToken: string; cloudId: string | null; siteUrl: string | null }

export async function getDecryptedConnection(organizationId: string, provider: Provider): Promise<DecryptedConnection | null> {
  const [row] = await db
    .select()
    .from(connection)
    .where(and(eq(connection.organizationId, organizationId), eq(connection.provider, provider)))
    .limit(1)
  if (!row) return null
  return {
    accessToken: decrypt(row.accessTokenCiphertext, row.accessTokenNonce),
    cloudId: row.cloudId,
    siteUrl: row.siteUrl,
  }
}
