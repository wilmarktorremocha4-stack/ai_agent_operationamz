import { geolocation, ipAddress } from "@vercel/functions";
import type { UIMessageStreamWriter } from "ai";
import {
  appendResponseMessages,
  createUIMessageStream,
  smoothStream,
  streamText,
} from "ai";
import { auth } from "@/app/(auth)/auth";
import { entitlementsByUserType } from "@/lib/ai/entitlements";
import { chatModels, allowedModelIds } from "@/lib/ai/models";
import { systemPrompt } from "@/lib/ai/prompts";
import { getLanguageModel } from "@/lib/ai/providers";
import { createDocument } from "@/lib/ai/tools/create-document";
import { editDocument } from "@/lib/ai/tools/edit-document";
import { getWeather } from "@/lib/ai/tools/get-weather";
import { requestSuggestions } from "@/lib/ai/tools/request-suggestions";
import { updateDocument } from "@/lib/ai/tools/update-document";
import {
  createStreamId,
  deleteChatById,
  getChatById,
  getDifyConversationIdByChatId,
  getMessageCountByUserId,
  saveChat,
  saveMessages,
  updateChatDifyConversationId,
} from "@/lib/db/queries";
import { isDifyConfigured, callDifyChat } from "@/lib/dify-client";
import { getOrCreateDifyUserId } from "@/lib/dify-identity";
import { transformDifyStreamToAISDK } from "@/lib/dify-stream";
import { ChatbotError } from "@/lib/errors";
import { checkIpRateLimit } from "@/lib/ratelimit";
import type { ChatMessage } from "@/lib/types";
import { generateUUID, getTextFromMessage } from "@/lib/utils";
import { generateTitleFromUserMessage, postRequestBodySchema } from "./schema";
import { ResumableStreamContext } from "resumable-stream";
import { after } from "next/server";

export const maxDuration = 60;

let globalStreamContext: ResumableStreamContext | null = null;

function getStreamContext() {
  if (!globalStreamContext) {
    try {
      globalStreamContext = new ResumableStreamContext({
        waitUntil: after,
      });
    } catch {
      // resumable streams not available in this environment
    }
  }
  return globalStreamContext;
}

export async function POST(request: Request) {
  let requestBody: unknown;
  try {
    requestBody = await request.json();
  } catch {
    return new ChatbotError("bad_request:api").toResponse();
  }

  const parseResult = postRequestBodySchema.safeParse(requestBody);
  if (!parseResult.success) {
    return new ChatbotError("bad_request:api").toResponse();
  }

  const body = parseResult.data;
  const { id, selectedChatModel, selectedVisibilityType } = body;

  // Get last user message from either message or messages array
  const userMessage = body.message ??
    body.messages?.findLast((m: any) => m.role === "user");

  if (!userMessage) {
    return new ChatbotError("bad_request:api").toResponse();
  }

  const session = await auth();
  if (!session?.user) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }

  const userType = session.user.type;
  const { maxMessagesPerHour } = entitlementsByUserType[userType];

  const ip = ipAddress(request);
  await checkIpRateLimit(ip);

  const messageCount = await getMessageCountByUserId({
    id: session.user.id,
    differenceInHours: 1,
  });

  if (messageCount >= maxMessagesPerHour) {
    return new ChatbotError("rate_limit:chat").toResponse();
  }

  // Validate model
  if (!allowedModelIds.has(selectedChatModel)) {
    return new ChatbotError("bad_request:api").toResponse();
  }

  // Save or verify chat
  const chat = await getChatById({ id });
  if (!chat) {
    const title = await generateTitleFromUserMessage({
      message: getTextFromMessage(userMessage),
    });
    await saveChat({
      id,
      userId: session.user.id,
      title,
      visibility: selectedVisibilityType,
    });
  } else if (chat.userId !== session.user.id) {
    return new ChatbotError("forbidden:chat").toResponse();
  }

  // Save user message
  await saveMessages({
    messages: [{
      id: userMessage.id ?? generateUUID(),
      chatId: id,
      role: "user",
      parts: userMessage.parts,
      attachments: (userMessage as any).attachments ?? [],
      createdAt: new Date(),
    }],
  });

  // ── Dify path ────────────────────────────────────────────────────────────────
  if (isDifyConfigured()) {
    const difyUserId = await getOrCreateDifyUserId();
    const conversationId = await getDifyConversationIdByChatId(id);
    const query = getTextFromMessage(userMessage);

    const difyResponse = await callDifyChat({ query, userId: difyUserId, conversationId });

    if (!difyResponse.ok) {
      return new ChatbotError("bad_request:chat").toResponse();
    }

    const stream = transformDifyStreamToAISDK(difyResponse.body, {
      onConversationId: (convId) => {
        updateChatDifyConversationId({ chatId: id, difyConversationId: convId }).catch(() => {});
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Vercel-AI-Data-Stream": "v1",
      },
    });
  }

  // ── AI SDK path ──────────────────────────────────────────────────────────────
  const geo = geolocation(request);
  const model = chatModels.find((m) => m.id === selectedChatModel);

  const streamId = generateUUID();
  await createStreamId({ streamId, chatId: id });

  const stream = createUIMessageStream({
    execute: async (writer: UIMessageStreamWriter<ChatMessage>) => {
      const result = streamText({
        model: getLanguageModel(selectedChatModel),
        system: systemPrompt({
          requestHints: {
            latitude: geo.latitude,
            longitude: geo.longitude,
            city: geo.city,
            country: geo.country,
          },
          supportsTools: true,
        }),
        messages: body.messages ?? [userMessage],
        maxSteps: 5,
        experimental_transform: smoothStream({ chunking: "word" }),
        experimental_generateMessageId: generateUUID,
        tools: {
          getWeather,
          createDocument: createDocument({ session, dataStream: writer, modelId: selectedChatModel }),
          editDocument: editDocument({ session, dataStream: writer }),
          updateDocument: updateDocument({ session, dataStream: writer, modelId: selectedChatModel }),
          requestSuggestions: requestSuggestions({ session, dataStream: writer, modelId: selectedChatModel }),
        },
        onFinish: async ({ response }) => {
          try {
            const assistantMessages = appendResponseMessages({
              messages: [userMessage] as any[],
              responseMessages: response.messages,
            });

            await saveMessages({
              messages: assistantMessages
                .filter((m) => m.role === "assistant")
                .map((m) => ({
                  id: m.id ?? generateUUID(),
                  chatId: id,
                  role: "assistant",
                  parts: (m as any).parts ?? [],
                  attachments: [],
                  createdAt: new Date(),
                })),
            });
          } catch (error) {
            console.error("Failed to save assistant messages:", error);
          }
        },
      });

      result.consumeStream();

      writer.merge(
        result.toUIMessageStream({
          sendReasoning: true,
        })
      );
    },
    generateId: generateUUID,
    onError: (error) => {
      console.error("Stream error:", error);
      return error instanceof Error ? error.message : "Unknown error";
    },
  });

  const streamContext = getStreamContext();

  if (streamContext) {
    return new Response(
      await streamContext.resumableStream(streamId, () => stream),
      {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "X-Vercel-AI-Data-Stream": "v1",
        },
      }
    );
  }

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Vercel-AI-Data-Stream": "v1",
    },
  });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new ChatbotError("bad_request:api").toResponse();
  }

  const session = await auth();

  if (!session?.user) {
    return new ChatbotError("unauthorized:auth").toResponse();
  }

  try {
    const chat = await getChatById({ id });

    if (!chat) {
      return new ChatbotError("not_found:chat").toResponse();
    }

    if (chat.userId !== session.user.id) {
      return new ChatbotError("forbidden:chat").toResponse();
    }

    await deleteChatById({ id });
    return Response.json({ success: true });
  } catch (_error) {
    return new ChatbotError("bad_request:api").toResponse();
  }
}
