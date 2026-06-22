import { getCapabilities, chatModels } from "@/lib/ai/models";

export async function GET() {
  const headers = {
    "Cache-Control": "public, max-age=86400, s-maxage=86400",
  };

  try {
    const capabilities = await getCapabilities();
    const models = chatModels.map((m) => ({
      ...m,
      capabilities: capabilities[m.id] ?? { tools: false, vision: false, reasoning: false },
    }));
    return Response.json({ models, capabilities }, { headers });
  } catch {
    return Response.json({ models: chatModels, capabilities: {} }, { headers });
  }
}
