import "server-only"

export type RoutingTarget = { id: string; name: string }

// v1 simplification: fetches the whole list once rather than a
// debounced search-as-you-type autocomplete (INTEGRATIONS.md's open
// question) — connected workspaces are expected to be small enough that
// a plain list is fine.
export async function listJiraProjects(accessToken: string, cloudId: string): Promise<RoutingTarget[]> {
  const response = await fetch(`https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/project/search`, {
    headers: { authorization: `Bearer ${accessToken}`, accept: "application/json" },
  })
  if (!response.ok) throw new Error(`Could not list Jira projects (${response.status})`)
  const data = (await response.json()) as { values: { id: string; key: string; name: string }[] }
  return data.values.map((p) => ({ id: p.key, name: `${p.name} (${p.key})` }))
}

export async function listLinearTeams(accessToken: string): Promise<RoutingTarget[]> {
  const response = await fetch("https://api.linear.app/graphql", {
    method: "POST",
    headers: { authorization: `Bearer ${accessToken}`, "content-type": "application/json" },
    body: JSON.stringify({ query: "{ teams { nodes { id name } } }" }),
  })
  if (!response.ok) throw new Error(`Could not list Linear teams (${response.status})`)
  const data = (await response.json()) as { data: { teams: { nodes: { id: string; name: string }[] } } }
  return data.data.teams.nodes.map((t) => ({ id: t.id, name: t.name }))
}
