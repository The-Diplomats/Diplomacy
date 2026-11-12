ALTER TABLE "games" ADD COLUMN "name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "created_by_user_id" uuid;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "max_ai_powers" integer DEFAULT 4 NOT NULL;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "started_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "finished_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;