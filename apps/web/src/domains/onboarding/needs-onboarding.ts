import "server-only"
import { db } from "@workspace/db/client"
import { organization } from "@workspace/db/schema"

// Deliberately keyed on "does an organization exist" rather than "does a
// user exist": the owner account is created in step 1, the organization in
// step 2, so a visitor who closes the tab in between still has unfinished
// onboarding — checking only for a user would wrongly lock them out of
// /onboarding (and leave every other page blank, since nothing works
// without an organization).
export async function needsOnboarding(): Promise<boolean> {
  const [org] = await db.select({ id: organization.id }).from(organization).limit(1)
  return !org
}
