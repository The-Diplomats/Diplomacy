CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"author" text,
	"msg_content" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
