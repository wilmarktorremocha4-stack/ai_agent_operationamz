-- AMZ Navigator: add Dify conversation tracking
ALTER TABLE "Chat" ADD COLUMN IF NOT EXISTS "difyConversationId" text;

CREATE TABLE IF NOT EXISTS "NavigatorConversation" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "difyConversationId" text UNIQUE,
  "difyUserId" text NOT NULL,
  "chatId" uuid REFERENCES "Chat"("id"),
  "title" text,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);
