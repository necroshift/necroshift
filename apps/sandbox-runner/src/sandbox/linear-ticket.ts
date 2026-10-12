export async function createLinearTicket(input: {
  accessToken: string
  teamId: string
  title: string
  description: string
}): Promise<{ url: string }> {
  const response = await fetch("https://api.linear.app/graphql", {
    method: "POST",
    headers: { authorization: `Bearer ${input.accessToken}`, "content-type": "application/json" },
    body: JSON.stringify({
      query:
        "mutation($input: IssueCreateInput!) { issueCreate(input: $input) { success issue { url } } }",
      variables: { input: { teamId: input.teamId, title: input.title, description: input.description } },
    }),
  })
  if (!response.ok) throw new Error(`Linear ticket creation failed (${response.status}): ${await response.text()}`)
  const data = (await response.json()) as {
    data?: { issueCreate: { success: boolean; issue: { url: string } } }
    errors?: { message: string }[]
  }
  if (data.errors?.length) throw new Error(`Linear ticket creation failed: ${data.errors[0]!.message}`)
  if (!data.data?.issueCreate.success) throw new Error("Linear ticket creation failed: issueCreate returned success=false")
  return { url: data.data.issueCreate.issue.url }
}
