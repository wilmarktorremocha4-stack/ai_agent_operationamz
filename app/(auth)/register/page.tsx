import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "../auth";
import { AuthForm } from "@/components/chat/auth-form";
import { register } from "../actions";

export const metadata: Metadata = {
  title: "Sign Up",
};

export default async function RegisterPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-xl font-bold">Create an Account</h1>
        <p className="text-center text-sm text-muted-foreground">
          Sign up to start using AMZ Navigator.
        </p>
      </div>
      <AuthForm action={register} defaultEmail="">
        <button
          type="submit"
          className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80"
        >
          Sign Up
        </button>
      </AuthForm>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
