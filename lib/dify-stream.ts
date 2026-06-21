/**
 * Transforms Dify's SSE stream into the AI SDK v6 UIMessageStream protocol.
 *
 * Dify sends:  event: message / data: {"answer":"chunk","conversation_id":"..."}
 * AI SDK v6 expects:  0:"chunk"\n   (type 0 = text delta)
 */

export type DifyStreamCallbacks = {
  onConversationId?: (id: string) => void;
  onMessageId?: (id: string) => void;
};

export function transformDifyStreamToAISDK(
  difyBody: ReadableStream<Uint8Array> | null,
  callbacks?: DifyStreamCallbacks
): ReadableStream<Uint8Array> {
  if (!difyBody) {
    return new ReadableStream({
      start(controller) {
        controller.close();
      },
    });
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let buffer = '';
  let conversationIdCaptured = false;
  let messageId = '';

  const messageId_ = `msg_${Math.random().toString(36).slice(2)}`;

  return new ReadableStream({
    start(controller) {
      controller.enqueue(
        encoder.encode(`f:{"messageId":"${messageId_}"}\n`)
      );
    },
    async pull(controller) {
      const reader = difyBody.getReader();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const raw = line.slice(6).trim();
              if (!raw || raw === '[DONE]') continue;

              try {
                const parsed = JSON.parse(raw) as {
                  event?: string;
                  answer?: string;
                  conversation_id?: string;
                  id?: string;
                };

                if (parsed.event === 'message' && parsed.answer) {
                  const escaped = JSON.stringify(parsed.answer);
                  controller.enqueue(encoder.encode(`0:${escaped}\n`));
                }

                if (
                  !conversationIdCaptured &&
                  parsed.conversation_id &&
                  (parsed.event === 'message' || parsed.event === 'message_end')
                ) {
                  conversationIdCaptured = true;
                  callbacks?.onConversationId?.(parsed.conversation_id);
                }

                if (parsed.event === 'message_end') {
                  if (parsed.id) {
                    messageId = parsed.id;
                    callbacks?.onMessageId?.(parsed.id);
                  }
                  controller.enqueue(
                    encoder.encode(
                      `e:{"finishReason":"stop","usage":{"promptTokens":0,"completionTokens":0}}\n`
                    )
                  );
                  controller.enqueue(
                    encoder.encode(
                      `d:{"finishReason":"stop","usage":{"promptTokens":0,"completionTokens":0}}\n`
                    )
                  );
                }

                if (parsed.event === 'error') {
                  controller.enqueue(
                    encoder.encode(
                      `3:"Dify error: ${parsed.answer ?? 'unknown'}"\n`
                    )
                  );
                }
              } catch {
                // Ignore malformed lines
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
        controller.close();
      }
    },
  });
}
