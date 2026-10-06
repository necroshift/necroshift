import "server-only"
import { db } from "@workspace/db/client"
import { user } from "@workspace/db/schema"

export async function isFirstRun(): Promise<boolean> {
  const [existingUser] = await db.select({ id: user.id }).from(user).limit(1)
  return !existingUser
}
