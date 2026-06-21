import { auth } from "@/app/(auth)/auth";
import { getVotesByChatId, voteMessage } from "@/lib/db/queries";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get("chatId");

  if (!chatId) {
    return Response.json({ error: "Missing chatId" }, { status: 400 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const votes = await getVotesByChatId({ id: chatId });
  return Response.json(votes);
}

export async function PATCH(request: Request) {
  const { chatId, messageId, type } = await request.json();

  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  await voteMessage({ chatId, messageId, type });
  return Response.json({ success: true });
}
