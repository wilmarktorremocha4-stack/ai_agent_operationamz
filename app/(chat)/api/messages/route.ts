import { auth } from "@/app/(auth)/auth";
import { getChatById, getMessagesByChatId } from "@/lib/db/queries";
import { convertToUIMessages } from "@/lib/utils";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get("chatId");

  if (!chatId) {
    return Response.json({ error: "Missing chatId" }, { status: 400 });
  }

  const session = await auth();

  const chat = await getChatById({ id: chatId });
  if (!chat) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const isOwner = session?.user?.id === chat.userId;
  const isPublic = chat.visibility === "public";

  if (!isOwner && !isPublic) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const messages = await getMessagesByChatId({ id: chatId });

  return Response.json({
    messages: convertToUIMessages(messages),
    visibility: chat.visibility,
    isReadonly: !isOwner,
  });
}
