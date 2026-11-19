ALTER TABLE "orders" ALTER COLUMN "action" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."order_action";--> statement-breakpoint
CREATE TYPE "public"."order_action" AS ENUM('hold', 'move', 'support', 'convoy', 'retreat', 'build', 'disband');--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "action" SET DATA TYPE "public"."order_action" USING "action"::"public"."order_action";--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "result" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."order_result";--> statement-breakpoint
CREATE TYPE "public"."order_result" AS ENUM('success', 'bounced', 'cut', 'void', 'disbanded');--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "result" SET DATA TYPE "public"."order_result" USING "result"::"public"."order_result";--> statement-breakpoint
ALTER TABLE "phases" DROP COLUMN "turn";