"use server";

import { AuthError } from "next-auth";
import { signIn } from "./auth";
import { createUser, getUser } from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";

export async function login(
  _: unknown,
  formData: FormData
): Promise<{ status: string }> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });

    return { status: "success" };
  } catch (error) {
    if (error instanceof AuthError) {
      return { status: "failed" };
    }
    throw error;
  }
}

export async function register(
  _: unknown,
  formData: FormData
): Promise<{ status: string }> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  try {
    const existingUsers = await getUser(email);

    if (existingUsers.length > 0) {
      return { status: "user_exists" };
    }

    await createUser(email, password);
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    return { status: "success" };
  } catch (error) {
    if (error instanceof ChatbotError) {
      return { status: "failed" };
    }
    throw error;
  }
}
