import { signIn } from "@/app/(auth)/auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawRedirect = searchParams.get("redirectUrl") || "/";
  const redirectUrl = rawRedirect.startsWith("/") ? rawRedirect : "/";

  return signIn("guest", { redirect: true, redirectTo: redirectUrl });
}
