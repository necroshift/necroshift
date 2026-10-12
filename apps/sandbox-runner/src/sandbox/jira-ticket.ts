// Jira Cloud's API v3 requires the description field in Atlassian
// Document Format, not plain text — this wraps a plain string in the
// minimal valid ADF shape for a single paragraph.
export function toAdf(text: string): unknown {
  return {
    type: "doc",
    version: 1,
    content: [{ type: "paragraph", content: [{ type: "text", text }] }],
  }
}

export async function createJiraTicket(input: {
  accessToken: string
  cloudId: string
  siteUrl: string
  projectKey: string
  summary: string
  description: string
}): Promise<{ url: string }> {
  const response = await fetch(`https://api.atlassian.com/ex/jira/${input.cloudId}/rest/api/3/issue`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${input.accessToken}`,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      fields: {
        project: { key: input.projectKey },
        summary: input.summary,
        issuetype: { name: "Task" },
        description: toAdf(input.description),
      },
    }),
  })
  if (!response.ok) throw new Error(`Jira ticket creation failed (${response.status}): ${await response.text()}`)
  const data = (await response.json()) as { key: string }
  return { url: `${input.siteUrl.replace(/\/$/, "")}/browse/${data.key}` }
}
