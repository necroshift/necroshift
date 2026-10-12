import type { selfHealRun, selfHealStep } from "@workspace/db/schema"

export const STEP_NAMES = ["investigate", "clone", "develop", "test", "open_pr"] as const
export type SelfHealStepName = (typeof STEP_NAMES)[number]

export type SelfHealRunRow = typeof selfHealRun.$inferSelect & {
  steps: (typeof selfHealStep.$inferSelect)[]
}
