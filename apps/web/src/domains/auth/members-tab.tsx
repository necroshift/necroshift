"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Badge } from "@workspace/ui/components/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select"
import { DotsThreeVerticalIcon } from "@phosphor-icons/react/DotsThreeVertical"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@workspace/ui/components/dropdown-menu"
import { inviteMember, listMembers, removeMember, updateMemberRole } from "./members-actions"

export function MembersTab() {
  const queryClient = useQueryClient()
  const [showInvite, setShowInvite] = useState(false)
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<"admin" | "member">("member")

  const { data: members = [] } = useQuery({ queryKey: ["members"], queryFn: listMembers })

  const invite = useMutation({
    mutationFn: () => inviteMember({ email, role }),
    onSuccess: (result) => {
      if (!result.success) return toast.error(result.error)
      toast.success(`Invited ${email}.`)
      setEmail("")
      setShowInvite(false)
      queryClient.invalidateQueries({ queryKey: ["members"] })
    },
  })

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold">Members</h2>
          <p className="text-muted-foreground text-sm">Everyone sharing this deployment.</p>
        </div>
        <Button onClick={() => setShowInvite((v) => !v)}>Invite member</Button>
      </div>

      {showInvite && (
        <div className="bg-muted flex items-end gap-2.5 rounded-lg p-4">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="invite-email">Email</Label>
            <Input id="invite-email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="teammate@company.com" />
          </div>
          <div className="flex w-36 flex-col gap-1.5">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => v && setRole(v as "admin" | "member")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">member</SelectItem>
                <SelectItem value="admin">admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button disabled={invite.isPending || !email.trim()} onClick={() => invite.mutate()}>
            Send invite
          </Button>
          <Button variant="outline" onClick={() => setShowInvite(false)}>
            Cancel
          </Button>
        </div>
      )}

      <div className="divide-y rounded-lg border">
        {members.map((m) => (
          <MemberRow key={m.id} member={m} />
        ))}
      </div>
    </div>
  )
}

function MemberRow({ member }: { member: Awaited<ReturnType<typeof listMembers>>[number] }) {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["members"] })

  const setRole = useMutation({
    mutationFn: (role: "admin" | "member") => updateMemberRole({ memberId: member.id, role }),
    onSuccess: (result) => (result.success ? invalidate() : toast.error(result.error)),
  })
  const remove = useMutation({
    mutationFn: () => removeMember({ memberIdOrEmail: member.user.email }),
    onSuccess: (result) => (result.success ? invalidate() : toast.error(result.error)),
  })

  return (
    <div className="flex items-center gap-3.5 p-4">
      <div className="bg-muted flex size-7.5 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
        {member.user.name.slice(0, 2).toUpperCase()}
      </div>
      <div className="flex min-w-48 flex-col gap-0.5">
        <span className="text-sm font-medium">{member.user.name}</span>
        <span className="text-muted-foreground text-xs">{member.user.email}</span>
      </div>
      <Badge variant="secondary">{member.role}</Badge>
      <span className="text-muted-foreground flex-1 text-right text-xs">
        Joined {new Date(member.createdAt).toLocaleDateString()}
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Member actions"
          className="hover:bg-muted inline-flex size-8 items-center justify-center rounded-md"
        >
          <DotsThreeVerticalIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setRole.mutate(member.role === "admin" ? "member" : "admin")}>
            Make {member.role === "admin" ? "member" : "admin"}
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => remove.mutate()}>
            Remove
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
