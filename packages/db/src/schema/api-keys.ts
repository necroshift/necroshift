import { pgEnum, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { organization } from "./auth"

export const llmProviderEnum = pgEnum("llm_provider", ["anthropic", "openai"])

export const providerCredential = pgTable(
  "provider_credential",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    provider: llmProviderEnum("provider").notNull(),
    ciphertext: text("ciphertext").notNull(),
    nonce: text("nonce").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [uniqueIndex("provider_credential_org_provider_uidx").on(table.organizationId, table.provider)],
)

export const providerCredentialRelations = relations(providerCredential, ({ one }) => ({
  organization: one(organization, {
    fields: [providerCredential.organizationId],
    references: [organization.id],
  }),
}))
