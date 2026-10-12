import { pgEnum, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { organization } from "./auth"
import { project } from "./project"

export const connectionProviderEnum = pgEnum("connection_provider", ["jira", "linear"])
export const connectionEventStatusEnum = pgEnum("connection_event_status", ["success", "error"])

// One connection per provider per deployment (CLAUDE.md's Integrations
// decision) — OAuth tokens, encrypted the same way provider_credential's
// pasted LLM keys are (packages/db's api-keys domain's AES-GCM scheme).
export const connection = pgTable(
  "connection",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    provider: connectionProviderEnum("provider").notNull(),
    accessTokenCiphertext: text("access_token_ciphertext").notNull(),
    accessTokenNonce: text("access_token_nonce").notNull(),
    refreshTokenCiphertext: text("refresh_token_ciphertext"),
    refreshTokenNonce: text("refresh_token_nonce"),
    expiresAt: timestamp("expires_at"),
    // Jira-only: the Atlassian cloud site this token is scoped to, resolved
    // once at connect time via the accessible-resources endpoint.
    cloudId: text("cloud_id"),
    siteUrl: text("site_url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [unique().on(table.organizationId, table.provider)],
)

// Independent of connection's lifecycle on purpose: disconnecting and
// reconnecting a provider shouldn't make a project re-pick its routing
// target (resolves INTEGRATIONS.md's "reconnect without losing config?").
export const projectRouting = pgTable(
  "project_routing",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    projectId: text("project_id")
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),
    provider: connectionProviderEnum("provider").notNull(),
    targetId: text("target_id").notNull(),
    targetName: text("target_name").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [unique().on(table.projectId, table.provider)],
)

// Mirrors ingestion_event's shape/purpose: every ticket-creation attempt
// recorded so a broken connection is diagnosable without server logs.
export const connectionEvent = pgTable("connection_event", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  provider: connectionProviderEnum("provider").notNull(),
  projectId: text("project_id").references(() => project.id, { onDelete: "set null" }),
  status: connectionEventStatusEnum("status").notNull(),
  errorReason: text("error_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const connectionRelations = relations(connection, ({ one }) => ({
  organization: one(organization, { fields: [connection.organizationId], references: [organization.id] }),
}))

export const projectRoutingRelations = relations(projectRouting, ({ one }) => ({
  project: one(project, { fields: [projectRouting.projectId], references: [project.id] }),
}))

export const connectionEventRelations = relations(connectionEvent, ({ one }) => ({
  organization: one(organization, { fields: [connectionEvent.organizationId], references: [organization.id] }),
  project: one(project, { fields: [connectionEvent.projectId], references: [project.id] }),
}))
