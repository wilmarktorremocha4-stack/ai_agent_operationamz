/**
 * Dify API client helpers.
 * Handles calling Dify's chat-messages endpoint and parsing the SSE response.
 */

export type DifyChunk = {
  event: string;
  answer?: string;
  conversation_id?: string;
  id?: string;
  task_id?: string;
};

export async function* parseDifySSE(
  body: ReadableStream<Uint8Array> | null
): AsyncGenerator<DifyChunk> {
  if (!body) return;

  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.slice(6).trim();
        if (!raw || raw === '[DONE]') continue;
        try {
          const parsed = JSON.parse(raw) as DifyChunk;
          yield parsed;
        } catch {
          // skip malformed lines
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export async function callDifyChat({
  query,
  userId,
  conversationId,
}: {
  query: string;
  userId: string;
  conversationId?: string | null;
}): Promise<Response> {
  const baseUrl = process.env.DIFY_API_BASE_URL;
  const apiKey = process.env.DIFY_APP_API_KEY ?? process.env.NEXT_PUBLIC_APP_KEY;

  if (!baseUrl || !apiKey) {
    throw new Error('Dify is not configured. Set DIFY_API_BASE_URL and DIFY_APP_API_KEY.');
  }

  return fetch(`${baseUrl}/chat-messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: {},
      query,
      response_mode: 'streaming',
      conversation_id: conversationId ?? '',
      user: userId,
    }),
  });
}

export function isDifyConfigured(): boolean {
  return Boolean(
    process.env.DIFY_API_BASE_URL &&
    (process.env.DIFY_APP_API_KEY ?? process.env.NEXT_PUBLIC_APP_KEY)
  );
}
