import { integer, jsonb, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { project } from "./project.ts"

export const payloadTypeEnum = pgEnum("payload_type", ["log", "crash"])
export const ingestionStatusEnum = pgEnum("ingestion_status", ["success", "error"])
export const ingestionErrorReasonEnum = pgEnum("ingestion_error_reason", [
  "invalid_key",
  "invalid_payload",
  "internal_error",
])

export const ingestionKey = pgTable("ingestion_key", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  projectId: text("project_id")
    .notNull()
    .references(() => project.id, { onDelete: "cascade" }),
  keyHash: text("key_hash").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const logEntry = pgTable("log_entry", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  projectId: text("project_id")
    .notNull()
    .references(() => project.id, { onDelete: "cascade" }),
  level: text("level"),
  message: text("message"),
  rawPayload: jsonb("raw_payload").notNull(),
  receivedAt: timestamp("received_at").defaultNow().notNull(),
})

export const crashReport = pgTable("crash_report", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  projectId: text("project_id")
    .notNull()
    .references(() => project.id, { onDelete: "cascade" }),
  message: text("message"),
  rawPayload: jsonb("raw_payload").notNull(),
  receivedAt: timestamp("received_at").defaultNow().notNull(),
})

export const ingestionEvent = pgTable("ingestion_event", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  projectId: text("project_id")
    .notNull()
    .references(() => project.id, { onDelete: "cascade" }),
  ingestionKeyId: text("ingestion_key_id").references(() => ingestionKey.id, {
    onDelete: "set null",
  }),
  payloadType: payloadTypeEnum("payload_type").notNull(),
  status: ingestionStatusEnum("status").notNull(),
  errorReason: ingestionErrorReasonEnum("error_reason"),
  httpStatus: integer("http_status").notNull(),
  receivedAt: timestamp("received_at").defaultNow().notNull(),
})

export const ingestionKeyRelations = relations(ingestionKey, ({ one, many }) => ({
  project: one(project, { fields: [ingestionKey.projectId], references: [project.id] }),
  events: many(ingestionEvent),
}))

export const logEntryRelations = relations(logEntry, ({ one }) => ({
  project: one(project, { fields: [logEntry.projectId], references: [project.id] }),
}))

export const crashReportRelations = relations(crashReport, ({ one }) => ({
  project: one(project, { fields: [crashReport.projectId], references: [project.id] }),
}))

export const ingestionEventRelations = relations(ingestionEvent, ({ one }) => ({
  project: one(project, { fields: [ingestionEvent.projectId], references: [project.id] }),
  ingestionKey: one(ingestionKey, {
    fields: [ingestionEvent.ingestionKeyId],
    references: [ingestionKey.id],
  }),
}))
