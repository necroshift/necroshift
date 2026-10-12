import { pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { organization } from "./auth"

export const project = pgTable("project", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  // The repo self-heal clones to investigate/fix this project's issues.
  // Nullable: a project can exist (and ingest) before self-heal is set up.
  repoUrl: text("repo_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const projectRelations = relations(project, ({ one }) => ({
  organization: one(organization, {
    fields: [project.organizationId],
    references: [organization.id],
  }),
}))
