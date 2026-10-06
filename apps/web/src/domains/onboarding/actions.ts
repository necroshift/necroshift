"use server"

import { headers } from "next/headers"
import { auth } from "@workspace/auth"
import { ok, fail, type ActionResult } from "@/src/lib/action-result"
import { slugify } from "@/src/domains/projects/slugify"
import { needsOnboarding } from "./needs-onboarding"

export async function completeOrgSetup(input: { name: string }): Promise<ActionResult<null>> {
  const name = input.name.trim()
  if (!name) return fail("Organization name is required.")

  // Idempotent: a visitor re-submitting step 2 (double-click, revisiting
  // /onboarding after finishing) must not create a second organization —
  // Necroshift is one deployment per organization.
  if (!(await needsOnboarding())) return ok(null)

  try {
    await auth.api.createOrganization({
      body: { name, slug: slugify(name) },
      headers: await headers(),
    })
    return ok(null)
  } catch {
    return fail("Could not create that organization.")
  }
}
