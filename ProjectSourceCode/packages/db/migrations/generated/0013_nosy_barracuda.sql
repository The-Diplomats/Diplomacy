CREATE TYPE "public"."season" AS ENUM('spring', 'fall');--> statement-breakpoint
ALTER TABLE "phases" ADD COLUMN "year" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "phases" ADD COLUMN "season" "season" NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "phases_game_clock_idx" ON "phases" USING btree ("game_id","year","season","phase_type");