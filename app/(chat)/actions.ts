"use server";

import { auth } from "@/app/(auth)/auth";
import {
  deleteMessagesByChatIdAfterTimestamp,
  getMessageById,
  updateChatVisiblityById,
} from "@/lib/db/queries";
import type { VisibilityType } from "@/components/chat/visibility-selector";

export async function saveChatModelAsCookie(model: string) {
  // handled client-side via cookie
}

export async function generateTitleFromUserMessage({
  message,
}: {
  message: string;
}) {
  const { generateText } = await import("ai");
  const { getTitleModel } = await import("@/lib/ai/providers");
  const { titleSystemPrompt } = await import("@/lib/ai/prompts");

  const { text: title } = await generateText({
    model: getTitleModel(),
    system: titleSystemPrompt,
    prompt: message,
  });

  return title;
}

export async function deleteTrailingMessages({ id }: { id: string }) {
  const session = await auth();
  if (!session?.user?.id) return;

  const [message] = await getMessageById({ id });
  if (message.role !== "user") return;

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
  const session = await auth();
  if (!session?.user?.id) return;
  await updateChatVisiblityById({ chatId, visibility });
}
