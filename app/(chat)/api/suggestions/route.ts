import { auth } from "@/app/(auth)/auth";
import { getSuggestionsByDocumentId } from "@/lib/db/queries";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const documentId = searchParams.get("documentId");

  if (!documentId) {
    return Response.json({ error: "Missing documentId" }, { status: 400 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const suggestions = await getSuggestionsByDocumentId({ documentId });

  return Response.json(suggestions);
}
