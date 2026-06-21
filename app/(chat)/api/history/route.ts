import { auth } from "@/app/(auth)/auth";
import {
  getChatsByUserId,
  deleteChatsByUserId,
} from "@/lib/db/queries";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit") ?? 10);
  const startingAfter = searchParams.get("starting_after") ?? undefined;
  const endingBefore = searchParams.get("ending_before") ?? undefined;

  const chats = await getChatsByUserId({
    id: session.user.id,
    limit,
    startingAfter,
    endingBefore,
  });

  return Response.json(chats);
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  await deleteChatsByUserId({ id: session.user.id });

  return Response.json({ success: true });
}
