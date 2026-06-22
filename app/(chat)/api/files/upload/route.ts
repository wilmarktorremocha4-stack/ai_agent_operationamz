import { put } from "@vercel/blob";
import { auth } from "@/app/(auth)/auth";
import { ChatbotError } from "@/lib/errors";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return new ChatbotError("unauthorized:auth").toResponse();
  }

  const { searchParams } = new URL(request.url);
  const filename = searchParams.get("filename");

  if (!filename) {
    return new ChatbotError("bad_request:api").toResponse();
  }

  const blob = await put(filename, request.body as ReadableStream, {
    access: "public",
  });

  return Response.json(blob);
}
