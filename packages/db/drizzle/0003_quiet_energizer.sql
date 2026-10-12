CREATE TYPE "public"."connection_event_status" AS ENUM('success', 'error');--> statement-breakpoint
CREATE TYPE "public"."connection_provider" AS ENUM('jira', 'linear');--> statement-breakpoint
ALTER TYPE "public"."self_heal_step_name" ADD VALUE 'file_ticket' BEFORE 'open_pr';--> statement-breakpoint
CREATE TABLE "connection" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"provider" "connection_provider" NOT NULL,
	"access_token_ciphertext" text NOT NULL,
	"access_token_nonce" text NOT NULL,
	"refresh_token_ciphertext" text,
	"refresh_token_nonce" text,
	"expires_at" timestamp,
	"cloud_id" text,
	"site_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "connection_organization_id_provider_unique" UNIQUE("organization_id","provider")
);
--> statement-breakpoint
CREATE TABLE "connection_event" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"provider" "connection_provider" NOT NULL,
	"project_id" text,
	"status" "connection_event_status" NOT NULL,
	"error_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_routing" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"provider" "connection_provider" NOT NULL,
	"target_id" text NOT NULL,
	"target_name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "project_routing_project_id_provider_unique" UNIQUE("project_id","provider")
);
--> statement-breakpoint
ALTER TABLE "connection" ADD CONSTRAINT "connection_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connection_event" ADD CONSTRAINT "connection_event_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connection_event" ADD CONSTRAINT "connection_event_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_routing" ADD CONSTRAINT "project_routing_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;