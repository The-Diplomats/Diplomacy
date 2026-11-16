ALTER TABLE "orders" ADD COLUMN "result" "order_result";--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;