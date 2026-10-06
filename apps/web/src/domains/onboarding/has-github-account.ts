import "server-only"
import { and, eq } from "drizzle-orm"
import { db } from "@workspace/db/client"
import { account } from "@workspace/db/schema"

export async function hasGithubAccount(userId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: account.id })
    .from(account)
    .where(and(eq(account.userId, userId), eq(account.providerId, "github")))
    .limit(1)
  return Boolean(row)
}
