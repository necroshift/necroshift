"use server"

import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { auth } from "@workspace/auth"
import { ok, fail, type ActionResult } from "@/src/lib/action-result"
import { getShellContext } from "@/src/domains/shell/get-shell-context"

export type MemberSummary = {
  id: string
  role: string
  createdAt: Date
  user: { name: string; email: string }
}

export async function listMembers(): Promise<MemberSummary[]> {
  const context = await getShellContext()
  if (!context) return []
  const result = await auth.api.listMembers({
    query: { organizationId: context.organization.id },
    headers: await headers(),
  })
  return result.members
}

export async function inviteMember(input: { email: string; role: "admin" | "member" }): Promise<ActionResult<null>> {
  const context = await getShellContext()
  if (!context) return fail("No organization configured yet.")

  try {
    await auth.api.createInvitation({
      body: { email: input.email, role: input.role, organizationId: context.organization.id },
      headers: await headers(),
    })
    revalidatePath("/settings/projects")
    return ok(null)
  } catch {
    return fail("Could not send that invitation.")
  }
}

export async function updateMemberRole(input: { memberId: string; role: "admin" | "member" }): Promise<ActionResult<null>> {
  try {
    await auth.api.updateMemberRole({
      body: { memberId: input.memberId, role: input.role },
      headers: await headers(),
    })
    revalidatePath("/settings/projects")
    return ok(null)
  } catch {
    return fail("Could not update that member's role.")
  }
}

export async function removeMember(input: { memberIdOrEmail: string }): Promise<ActionResult<null>> {
  try {
    await auth.api.removeMember({
      body: { memberIdOrEmail: input.memberIdOrEmail },
      headers: await headers(),
    })
    revalidatePath("/settings/projects")
    return ok(null)
  } catch {
    return fail("Could not remove that member.")
  }
}
