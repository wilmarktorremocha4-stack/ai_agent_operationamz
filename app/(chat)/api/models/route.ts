import { chatModels } from "@/lib/ai/models";

export async function GET() {
  return Response.json({ models: chatModels });
}
