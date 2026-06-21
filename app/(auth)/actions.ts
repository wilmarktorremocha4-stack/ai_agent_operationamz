"use server";

import { AuthError } from "next-auth";
import { z } from "zod";
import { createGuestUser, getUser } from "@/lib/db/queries";
import { signIn } from "./auth";
import { generateDummyPassword } from "@/lib/db/utils";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function login(formData: FormData) {
  const validatedFields = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return { error: "Invalid fields" };
  }

  try {
    await signIn("credentials", {
      email: validatedFields.data.email,
      password: validatedFields.data.password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid credentials" };
        default:
          return { error: "Something went wrong" };
      }
    }
    throw error;
  }
}

export async function register(formData: FormData) {
  const validatedFields = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return { error: "Invalid fields" };
  }

  const { email, password } = validatedFields.data;

  const existingUser = await getUser(email);
  if (existingUser.length > 0) {
    return { error: "Email already exists" };
  }

  try {
    await createGuestUser({ email, password });
    await signIn("credentials", { email, password, redirect: false });
  } catch (error) {
    return { error: "Failed to create account" };
  }
}
