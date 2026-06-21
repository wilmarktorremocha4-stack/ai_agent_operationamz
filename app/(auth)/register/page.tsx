import Link from "next/link";
import { AuthForm } from "@/components/chat/auth-form";
import { register } from "../actions";

export default function RegisterPage() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-bold">Sign Up</h1>
        <p className="text-sm text-muted-foreground">
          Create your AMZ Navigator account
        </p>
      </div>
      <AuthForm action={register} buttonLabel="Sign Up" />
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="underline underline-offset-4 hover:text-foreground">
          Sign in
        </Link>
      </p>
    </div>
  );
}
