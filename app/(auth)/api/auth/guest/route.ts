import { redirect } from "next/navigation";
import { isDevelopmentEnvironment } from "@/lib/constants";
import { createGuestUser } from "@/lib/db/queries";
import { generateDummyPassword } from "@/lib/db/utils";
import { signIn } from "../../auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const redirectUrl = searchParams.get("redirectUrl") || "/";

  const email = `guest-${crypto.randomUUID()}@guest.local`;
  const password = generateDummyPassword();

  await createGuestUser({ email, password });

  await signIn("credentials", {
    email,
    password,
    redirect: false,
  });

  redirect(redirectUrl);
}
