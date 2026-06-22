import { auth } from "@/app/(auth)/auth";
import { getChatById, getMessagesByChatId } from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";
import { convertToUIMessages } from "@/lib/utils";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get("chatId");

  if (!chatId) {
    return new ChatbotError("bad_request:api").toResponse();
  }

  const session = await auth();

  const chat = await getChatById({ id: chatId });

  if (!chat) {
    return Response.json({ messages: [], visibility: "private", isReadonly: false });
  }

  if (chat.visibility === "private") {
    if (!session?.user) {
      return new ChatbotError("unauthorized:chat").toResponse();
    }
    if (chat.userId !== session.user.id) {
      return new ChatbotError("forbidden:chat").toResponse();
    }
  }

  const messages = await getMessagesByChatId({ id: chatId });
  const isReadonly = chat.userId !== session?.user?.id;

  return Response.json({
    messages: convertToUIMessages(messages),
    visibility: chat.visibility,
    isReadonly,
  });
}
