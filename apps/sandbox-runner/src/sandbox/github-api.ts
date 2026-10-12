export async function openPullRequest(input: {
  repoUrl: string
  githubToken: string
  branchName: string
  title: string
  body: string
}): Promise<string> {
  const { owner, repo } = parseRepoUrl(input.repoUrl)
  const base = await getDefaultBranch(owner, repo, input.githubToken)
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls`, {
    method: "POST",
    headers: githubHeaders(input.githubToken),
    body: JSON.stringify({ title: input.title, head: input.branchName, base, body: input.body }),
  })
  if (!response.ok) throw new Error(`GitHub PR creation failed (${response.status}): ${await response.text()}`)
  const data = (await response.json()) as { html_url: string }
  return data.html_url
}

export function parseRepoUrl(repoUrl: string): { owner: string; repo: string } {
  const match = /github\.com\/([^/]+)\/([^/]+?)(?:\.git)?\/?$/.exec(repoUrl)
  if (!match) throw new Error(`Could not parse a GitHub owner/repo from ${repoUrl}`)
  return { owner: match[1]!, repo: match[2]! }
}

async function getDefaultBranch(owner: string, repo: string, token: string): Promise<string> {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers: githubHeaders(token) })
  if (!response.ok) throw new Error(`Could not read repo info for ${owner}/${repo} (${response.status})`)
  const data = (await response.json()) as { default_branch?: string }
  return data.default_branch ?? "main"
}

function githubHeaders(token: string): Record<string, string> {
  return {
    authorization: `Bearer ${token}`,
    accept: "application/vnd.github+json",
    "content-type": "application/json",
    "user-agent": "necroshift-self-heal",
  }
}
