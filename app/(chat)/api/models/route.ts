import { getAllGatewayModels, getCapabilities, chatModels } from "@/lib/ai/models";

export async function GET() {
  try {
    const capabilities = await getCapabilities();
    const models = chatModels.map((m) => ({
      ...m,
      capabilities: capabilities[m.id] ?? { tools: false, vision: false, reasoning: false },
    }));
    return Response.json({ models });
  } catch {
    return Response.json({ models: chatModels });
  }
}
