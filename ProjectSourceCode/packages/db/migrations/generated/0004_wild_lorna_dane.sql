CREATE TYPE "public"."power" AS ENUM('austria', 'england', 'france', 'germany', 'italy', 'russia', 'turkey');--> statement-breakpoint
ALTER TABLE "players" DROP CONSTRAINT "players_user_id_unique";--> statement-breakpoint
ALTER TABLE "players" DROP CONSTRAINT "players_username_unique";--> statement-breakpoint
ALTER TABLE "players" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "game_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "power" "power";--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "is_ai" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "joined_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "players_game_user_idx" ON "players" USING btree ("game_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "players_game_power_idx" ON "players" USING btree ("game_id","power");--> statement-breakpoint
ALTER TABLE "players" DROP COLUMN "username";--> statement-breakpoint
ALTER TABLE "players" DROP COLUMN "created_at";