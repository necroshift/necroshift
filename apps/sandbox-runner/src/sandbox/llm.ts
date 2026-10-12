import Anthropic from "@anthropic-ai/sdk"
import OpenAI from "openai"

export type FixDraft = { diff: string; summary: string }

export type DraftFixInput = {
  provider: "anthropic" | "openai"
  apiKey: string
  issueTitle: string
  latestOccurrence: unknown
  fileListing: string[]
  referencedFile: { path: string; content: string } | null
}

// v1 is a single-shot patch generation, not a multi-turn coding-agent loop
// (no tool use, no iterative repo exploration) — see the self-heal design
// spec's "out of scope" section. This is the one LLM call per run.
export async function draftFix(input: DraftFixInput): Promise<FixDraft> {
  const prompt = buildPrompt(input)
  const raw =
    input.provider === "anthropic" ? await callAnthropic(input.apiKey, prompt) : await callOpenAI(input.apiKey, prompt)
  return parseResponse(raw)
}

function buildPrompt(input: DraftFixInput): string {
  const occurrence = JSON.stringify(input.latestOccurrence, null, 2)
  const fileSection = input.referencedFile
    ? `Relevant file (${input.referencedFile.path}):\n\`\`\`\n${input.referencedFile.content}\n\`\`\``
    : `Repo file listing (first ${input.fileListing.length} files):\n${input.fileListing.join("\n")}`
  return [
    "You are Necroshift, an automated on-call engineer investigating a production issue.",
    `Title: ${input.issueTitle}`,
    `Latest occurrence (raw payload):\n${occurrence}`,
    fileSection,
    "Propose a minimal fix as a single unified diff (the output of `git diff`), applyable with `git apply`.",
    "Respond with exactly these two sections, in this order, and nothing else:",
    "SUMMARY: <one or two sentences on what's wrong and what you changed>",
    "DIFF:\n```diff\n<the unified diff>\n```",
  ].join("\n\n")
}

async function callAnthropic(apiKey: string, prompt: string): Promise<string> {
  const client = new Anthropic({ apiKey })
  const response = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5-5",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  })
  const block = response.content.find((b) => b.type === "text")
  return block && block.type === "text" ? block.text : ""
}

async function callOpenAI(apiKey: string, prompt: string): Promise<string> {
  const client = new OpenAI({ apiKey })
  const response = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-5",
    messages: [{ role: "user", content: prompt }],
  })
  return response.choices[0]?.message?.content ?? ""
}

export function parseResponse(raw: string): FixDraft {
  const summaryMatch = raw.match(/SUMMARY:\s*([\s\S]*?)(?:\n\s*DIFF:|$)/i)
  const diffMatch = raw.match(/```diff\n([\s\S]*?)```/i) ?? raw.match(/```\n([\s\S]*?)```/)
  const diff = diffMatch?.[1]?.trim() ?? ""
  if (!diff) throw new Error("Model did not return a usable diff.")
  return { diff, summary: summaryMatch?.[1]?.trim() ?? "No summary provided." }
}
