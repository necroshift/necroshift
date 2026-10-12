CREATE TYPE "public"."issue_status" AS ENUM('open', 'resolved');--> statement-breakpoint
CREATE TABLE "issue" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"fingerprint" text NOT NULL,
	"title" text NOT NULL,
	"status" "issue_status" DEFAULT 'open' NOT NULL,
	"occurrence_count" integer DEFAULT 1 NOT NULL,
	"first_seen_at" timestamp DEFAULT now() NOT NULL,
	"last_seen_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "issue_project_id_fingerprint_unique" UNIQUE("project_id","fingerprint")
);
--> statement-breakpoint
ALTER TABLE "crash_report" ADD COLUMN "issue_id" text;--> statement-breakpoint
ALTER TABLE "issue" ADD CONSTRAINT "issue_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crash_report" ADD CONSTRAINT "crash_report_issue_id_issue_id_fk" FOREIGN KEY ("issue_id") REFERENCES "public"."issue"("id") ON DELETE set null ON UPDATE no action;