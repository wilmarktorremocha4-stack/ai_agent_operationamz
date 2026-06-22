import { auth } from "@/app/(auth)/auth";
import { getSuggestionsByDocumentId } from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const documentId = searchParams.get("documentId");

  if (!documentId) {
    return new ChatbotError("bad_request:suggestions").toResponse();
  }

  const session = await auth();

  if (!session?.user) {
    return new ChatbotError("unauthorized:auth").toResponse();
  }

  const suggestions = await getSuggestionsByDocumentId({ documentId });

  const [suggestion] = suggestions;

  if (!suggestion) {
    return Response.json([]);
  }

  if (suggestion.userId !== session.user.id) {
    return new ChatbotError("forbidden:document").toResponse();
  }

  return Response.json(suggestions);
}
