import Link from "next/link";
import { AuthForm } from "@/components/chat/auth-form";
import { login } from "../actions";

export default function LoginPage() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-bold">Sign In</h1>
        <p className="text-sm text-muted-foreground">
          Enter your credentials to access AMZ Navigator
        </p>
      </div>
      <AuthForm action={login} buttonLabel="Sign In" />
      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="underline underline-offset-4 hover:text-foreground">
          Sign up
        </Link>
      </p>
    </div>
  );
}
