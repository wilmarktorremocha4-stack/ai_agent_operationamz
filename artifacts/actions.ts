"use server";

import { auth } from "@/app/(auth)/auth";
import { getSuggestionsByDocumentId } from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";

export async function getSuggestions({ documentId }: { documentId: string }) {
  const session = await auth();

  if (!session?.user) {
    throw new ChatbotError("unauthorized:auth");
  }

  const suggestions = await getSuggestionsByDocumentId({ documentId });
  return suggestions;
}
