CREATE TYPE "public"."order_action" AS ENUM('hold', 'move', 'support', 'convoy');--> statement-breakpoint
CREATE TYPE "public"."phase_type" AS ENUM('movement', 'retreat', 'build');--> statement-breakpoint
CREATE TABLE "ai_memory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_id" uuid NOT NULL,
	"power" "power" NOT NULL,
	"memory" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "draw_votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_id" uuid NOT NULL,
	"player_id" uuid NOT NULL,
	"voted_for_draw" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_id" uuid NOT NULL,
	"phase_id" uuid NOT NULL,
	"player_id" uuid NOT NULL,
	"unit" text NOT NULL,
	"action" "order_action" NOT NULL,
	"order_data" jsonb NOT NULL,
	"result" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "phase_readiness" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_id" uuid NOT NULL,
	"phase_id" uuid NOT NULL,
	"player_id" uuid NOT NULL,
	"is_ready" boolean DEFAULT false NOT NULL,
	"skip_grace_vote" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "phases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_id" uuid NOT NULL,
	"phase_type" "phase_type" NOT NULL,
	"turn" integer NOT NULL,
	"board_state" jsonb NOT NULL,
	"deadline_at" timestamp with time zone NOT NULL,
	"scheduler_gen" integer DEFAULT 0 NOT NULL,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "afk_counter" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "locked" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_memory" ADD CONSTRAINT "ai_memory_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "draw_votes" ADD CONSTRAINT "draw_votes_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phase_readiness" ADD CONSTRAINT "phase_readiness_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phases" ADD CONSTRAINT "phases_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ai_memory_game_power_idx" ON "ai_memory" USING btree ("game_id","power");--> statement-breakpoint
CREATE UNIQUE INDEX "draw_votes_game_player_idx" ON "draw_votes" USING btree ("game_id","player_id");--> statement-breakpoint
CREATE INDEX "draw_votes_player_idx" ON "draw_votes" USING btree ("player_id");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_phase_unit_idx" ON "orders" USING btree ("phase_id","unit");--> statement-breakpoint
CREATE INDEX "orders_phase_player_idx" ON "orders" USING btree ("phase_id","player_id");--> statement-breakpoint
CREATE UNIQUE INDEX "phase_readiness_phase_player_idx" ON "phase_readiness" USING btree ("phase_id","player_id");--> statement-breakpoint
CREATE INDEX "phase_readiness_player_idx" ON "phase_readiness" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "phases_game_id_idx" ON "phases" USING btree ("game_id");--> statement-breakpoint
CREATE INDEX "phases_deadline_at_idx" ON "phases" USING btree ("deadline_at");--> statement-breakpoint
CREATE UNIQUE INDEX "phases_id_game_idx" ON "phases" USING btree ("id","game_id");--> statement-breakpoint
CREATE UNIQUE INDEX "players_id_game_idx" ON "players" USING btree ("id","game_id");