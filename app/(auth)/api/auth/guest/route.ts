import { redirect } from "next/navigation";
import { signIn } from "@/app/(auth)/auth";
import { createGuestUser } from "@/lib/db/queries";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const redirectUrl = searchParams.get("redirectUrl") || "/";

  const [guestUser] = await createGuestUser();

  await signIn("credentials", {
    email: guestUser.email,
    password: guestUser.email,
    redirect: false,
  });

  redirect(redirectUrl);
}
