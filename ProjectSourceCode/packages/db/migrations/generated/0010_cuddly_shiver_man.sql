CREATE TYPE "public"."order_result" AS ENUM('pending', 'success', 'bounced', 'cut', 'dislodged', 'disbanded');--> statement-breakpoint
CREATE TYPE "public"."verification_purpose" AS ENUM('email_verify', 'password_reset');--> statement-breakpoint
ALTER TYPE "public"."order_action" ADD VALUE 'retreat';--> statement-breakpoint
ALTER TYPE "public"."order_action" ADD VALUE 'build';--> statement-breakpoint
ALTER TYPE "public"."order_action" ADD VALUE 'disband';--> statement-breakpoint
ALTER TYPE "public"."order_action" ADD VALUE 'waive';--> statement-breakpoint
ALTER TABLE "messages" DROP CONSTRAINT "messages_from_player_id_players_id_fk";
--> statement-breakpoint
ALTER TABLE "messages" DROP CONSTRAINT "messages_to_player_id_players_id_fk";
--> statement-breakpoint
DROP INDEX "phases_game_id_idx";--> statement-breakpoint
ALTER TABLE "verification_tokens" ALTER COLUMN "purpose" SET DATA TYPE "public"."verification_purpose" USING "purpose"::"public"."verification_purpose";--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "is_private" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "invite_code" text;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "winner_power" "power";--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_from_player_game_fk" FOREIGN KEY ("from_player_id","game_id") REFERENCES "public"."players"("id","game_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_to_player_game_fk" FOREIGN KEY ("to_player_id","game_id") REFERENCES "public"."players"("id","game_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "games_invite_code_idx" ON "games" USING btree ("invite_code");--> statement-breakpoint
CREATE UNIQUE INDEX "phases_game_open_idx" ON "phases" USING btree ("game_id") WHERE "phases"."resolved_at" IS NULL;--> statement-breakpoint
CREATE INDEX "phases_game_created_at_idx" ON "phases" USING btree ("game_id","created_at");--> statement-breakpoint
ALTER TABLE "draw_votes" DROP COLUMN "voted_for_draw";--> statement-breakpoint
ALTER TABLE "draw_votes" DROP COLUMN "updated_at";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "result";--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_winner_only_when_finished_check" CHECK ("games"."winner_power" IS NULL OR "games"."status" = 'finished');--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_no_self_dm_check" CHECK ("messages"."from_player_id" <> "messages"."to_player_id");--> statement-breakpoint
ALTER TABLE "phase_readiness" ADD CONSTRAINT "phase_readiness_skip_grace_requires_ready_check" CHECK (NOT "phase_readiness"."skip_grace_vote" OR "phase_readiness"."is_ready");--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_ai_has_no_user_check" CHECK ("players"."is_ai" = ("players"."user_id" IS NULL));