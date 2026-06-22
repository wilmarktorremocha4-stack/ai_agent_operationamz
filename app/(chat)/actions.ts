"use server";

import { cookies } from "next/headers";
import { auth } from "@/app/(auth)/auth";
import {
  deleteMessagesByChatIdAfterTimestamp,
  getChatById,
  getMessageById,
  saveChat,
  updateChatTitleById,
  updateChatVisibilityById,
} from "@/lib/db/queries";
import type { VisibilityType } from "@/components/chat/visibility-selector";

export async function saveChatModelAsCookie(model: string) {
  const cookieStore = await cookies();
  cookieStore.set("chat-model", model);
}

export async function generateTitleFromUserMessage({
  message,
}: {
  message: string;
}) {
  // Import here to avoid circular dependency issues
  const { streamText } = await import("ai");
  const { getTitleModel } = await import("@/lib/ai/providers");
  const { titlePrompt } = await import("@/lib/ai/prompts");

  const { textStream } = streamText({
    model: getTitleModel(),
    system: titlePrompt,
    prompt: message,
  });

  let title = "";
  for await (const chunk of textStream) {
    title += chunk;
  }

  return title.trim() || "New Chat";
}

export async function deleteTrailingMessages({ id }: { id: string }) {
  const [message] = await getMessageById({ id });

  await deleteMessagesByChatIdAfterTimestamp({
    chatId: message.chatId,
    timestamp: message.createdAt,
  });
}

export async function updateChatVisibility({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: VisibilityType;
}) {
  await updateChatVisibilityById({ chatId, visibility });
}
