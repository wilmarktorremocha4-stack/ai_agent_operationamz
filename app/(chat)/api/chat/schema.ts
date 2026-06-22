import { z } from "zod";

export const postRequestBodySchema = z.object({
  id: z.string(),
  message: z
    .object({
      id: z.string(),
      role: z.enum(["user"]),
      parts: z.array(z.any()),
      metadata: z.any().optional(),
    })
    .optional(),
  messages: z.array(z.any()).optional(),
  selectedChatModel: z.string(),
  selectedVisibilityType: z.enum(["public", "private"]),
});

export type PostRequestBody = z.infer<typeof postRequestBodySchema>;

export async function generateTitleFromUserMessage({
  message,
}: {
  message: string;
}) {
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
