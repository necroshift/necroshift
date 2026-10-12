import { pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { issue } from "./issues"

export const selfHealRunStatusEnum = pgEnum("self_heal_run_status", [
  "pending",
  "investigating",
  "cloning",
  "developing",
  "testing",
  "opening_pr",
  "done",
  "failed",
])

export const selfHealStepNameEnum = pgEnum("self_heal_step_name", [
  "investigate",
  "clone",
  "develop",
  "test",
  "file_ticket",
  "open_pr",
])

export const selfHealStepStatusEnum = pgEnum("self_heal_step_status", ["pending", "active", "done", "failed"])

export const selfHealRun = pgTable("self_heal_run", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  issueId: text("issue_id")
    .notNull()
    .references(() => issue.id, { onDelete: "cascade" }),
  status: selfHealRunStatusEnum("status").notNull().default("pending"),
  summary: text("summary"),
  prUrl: text("pr_url"),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  finishedAt: timestamp("finished_at"),
})

export const selfHealStep = pgTable("self_heal_step", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  runId: text("run_id")
    .notNull()
    .references(() => selfHealRun.id, { onDelete: "cascade" }),
  name: selfHealStepNameEnum("name").notNull(),
  status: selfHealStepStatusEnum("status").notNull().default("pending"),
  detail: text("detail"),
  startedAt: timestamp("started_at"),
  finishedAt: timestamp("finished_at"),
})

export const selfHealRunRelations = relations(selfHealRun, ({ one, many }) => ({
  issue: one(issue, { fields: [selfHealRun.issueId], references: [issue.id] }),
  steps: many(selfHealStep),
}))

export const selfHealStepRelations = relations(selfHealStep, ({ one }) => ({
  run: one(selfHealRun, { fields: [selfHealStep.runId], references: [selfHealRun.id] }),
}))
