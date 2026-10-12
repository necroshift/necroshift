import "server-only"
import { eq, and } from "drizzle-orm"
import { symmetricDecrypt } from "better-auth/crypto"
import { db } from "@workspace/db/client"
import { account } from "@workspace/db/schema"

// Necroshift reuses the GitHub token obtained at login/connect (`repo`
// scope), rather than a separately pasted PAT. better-auth stores it
// encrypted (`encryptOAuthTokens: true`); `symmetricDecrypt` is the same
// public function better-auth uses internally to read it back — not a
// reimplementation of its encryption scheme.
export async function getGithubAccessToken(userId: string): Promise<string | null> {
  const [row] = await db
    .select({ accessToken: account.accessToken })
    .from(account)
    .where(and(eq(account.userId, userId), eq(account.providerId, "github")))
    .limit(1)
  if (!row?.accessToken) return null

  const secret = process.env.BETTER_AUTH_SECRET
  if (!secret) throw new Error("Missing required env var: BETTER_AUTH_SECRET")
  if (!looksEncrypted(row.accessToken)) return row.accessToken
  return symmetricDecrypt({ key: secret, data: row.accessToken })
}

function looksEncrypted(token: string): boolean {
  return token.startsWith("$ba$") || (token.length % 2 === 0 && /^[0-9a-f]+$/i.test(token))
}
