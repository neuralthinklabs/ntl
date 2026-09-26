CREATE TYPE "public"."portfolio_status" AS ENUM('Active', 'In Progress', 'Planned', 'Completed');--> statement-breakpoint
CREATE TYPE "public"."portfolio_type" AS ENUM('Product', 'Service', 'Venture', 'System', 'Publication');--> statement-breakpoint
CREATE TABLE "auth_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identifier" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portfolio_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" "portfolio_type" NOT NULL,
	"status" "portfolio_status" DEFAULT 'Planned' NOT NULL,
	"description" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "stories" ADD COLUMN "category" text;--> statement-breakpoint
CREATE INDEX "auth_attempts_identifier_created_at_idx" ON "auth_attempts" USING btree ("identifier","created_at");