import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "../auth";
import { AuthForm } from "@/components/chat/auth-form";
import { login } from "../actions";

export const metadata: Metadata = {
  title: "Sign In",
};

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-xl font-bold">Sign In to AMZ Navigator</h1>
        <p className="text-center text-sm text-muted-foreground">
          Welcome back! Sign in to continue.
        </p>
      </div>
      <AuthForm action={login} defaultEmail="">
        <button
          type="submit"
          className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80"
        >
          Sign In
        </button>
      </AuthForm>
      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
