import type { selfHealRun, selfHealStep } from "@workspace/db/schema"

// file_ticket only gets a row for runs where a project is actually routed
// to a connected Jira/Linear target — ordering code below tolerates its
// absence, the stepper UI simply shows one fewer step for those runs.
export const STEP_NAMES = ["investigate", "clone", "develop", "test", "file_ticket", "open_pr"] as const
export type SelfHealStepName = (typeof STEP_NAMES)[number]

export type SelfHealRunRow = typeof selfHealRun.$inferSelect & {
  steps: (typeof selfHealStep.$inferSelect)[]
}
