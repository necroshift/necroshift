import "server-only"
import { and, eq } from "drizzle-orm"
import { db } from "@workspace/db/client"
import { issue } from "@workspace/db/schema"
import { fingerprintCrash } from "./fingerprint"

// Called from the ingestion domain after a crash_report is persisted.
// A crash reopens a resolved issue — if it's still happening, it isn't
// actually resolved — and always bumps the occurrence count + last-seen time.
export async function upsertIssueForCrash(input: { projectId: string; message: string | null }): Promise<string> {
  const fingerprint = fingerprintCrash(input.message)
  const title = input.message?.trim() || "Unknown error"

  const [existing] = await db
    .select({ id: issue.id, occurrenceCount: issue.occurrenceCount })
    .from(issue)
    .where(and(eq(issue.projectId, input.projectId), eq(issue.fingerprint, fingerprint)))
    .limit(1)

  if (existing) {
    await db
      .update(issue)
      .set({ occurrenceCount: existing.occurrenceCount + 1, lastSeenAt: new Date(), status: "open" })
      .where(eq(issue.id, existing.id))
    return existing.id
  }

  const [created] = await db.insert(issue).values({ projectId: input.projectId, fingerprint, title }).returning()
  return created!.id
}
