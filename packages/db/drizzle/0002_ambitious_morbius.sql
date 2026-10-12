CREATE TYPE "public"."self_heal_run_status" AS ENUM('pending', 'investigating', 'cloning', 'developing', 'testing', 'opening_pr', 'done', 'failed');--> statement-breakpoint
CREATE TYPE "public"."self_heal_step_name" AS ENUM('investigate', 'clone', 'develop', 'test', 'open_pr');--> statement-breakpoint
CREATE TYPE "public"."self_heal_step_status" AS ENUM('pending', 'active', 'done', 'failed');--> statement-breakpoint
CREATE TABLE "self_heal_run" (
	"id" text PRIMARY KEY NOT NULL,
	"issue_id" text NOT NULL,
	"status" "self_heal_run_status" DEFAULT 'pending' NOT NULL,
	"summary" text,
	"pr_url" text,
	"error_message" text,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"finished_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "self_heal_step" (
	"id" text PRIMARY KEY NOT NULL,
	"run_id" text NOT NULL,
	"name" "self_heal_step_name" NOT NULL,
	"status" "self_heal_step_status" DEFAULT 'pending' NOT NULL,
	"detail" text,
	"started_at" timestamp,
	"finished_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "repo_url" text;--> statement-breakpoint
ALTER TABLE "self_heal_run" ADD CONSTRAINT "self_heal_run_issue_id_issue_id_fk" FOREIGN KEY ("issue_id") REFERENCES "public"."issue"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "self_heal_step" ADD CONSTRAINT "self_heal_step_run_id_self_heal_run_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."self_heal_run"("id") ON DELETE cascade ON UPDATE no action;