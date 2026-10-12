import { integer, pgEnum, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { project } from "./project"

export const issueStatusEnum = pgEnum("issue_status", ["open", "resolved"])

// v1 scope: an issue groups crash_report rows only (not log_entry) by
// (project, fingerprint of message) — crashes are an unambiguous "something
// broke" signal; log-based grouping is a later iteration (see ISSUES.md).
export const issue = pgTable(
  "issue",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    projectId: text("project_id")
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),
    fingerprint: text("fingerprint").notNull(),
    title: text("title").notNull(),
    status: issueStatusEnum("status").notNull().default("open"),
    occurrenceCount: integer("occurrence_count").notNull().default(1),
    firstSeenAt: timestamp("first_seen_at").defaultNow().notNull(),
    lastSeenAt: timestamp("last_seen_at").defaultNow().notNull(),
  },
  (table) => [unique().on(table.projectId, table.fingerprint)],
)

export const issueRelations = relations(issue, ({ one }) => ({
  project: one(project, { fields: [issue.projectId], references: [project.id] }),
}))
