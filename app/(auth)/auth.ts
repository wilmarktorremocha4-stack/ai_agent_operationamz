import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compareSync } from "bcrypt-ts";
import { authConfig } from "./auth.config";
import { getUser } from "@/lib/db/queries";
import { DUMMY_PASSWORD, guestRegex } from "@/lib/constants";

export type UserType = "guest" | "regular";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      type: UserType;
    } & DefaultSession["user"];
  }
}

export const {
  handlers,
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {},
      async authorize({ email, password }: any) {
        const users = await getUser(email as string);

        if (users.length === 0) {
          await compareSync(password as string, DUMMY_PASSWORD);
          return null;
        }

        const [user] = users;
        const passwordsMatch = compareSync(password as string, user.password as string);

        if (!passwordsMatch) return null;

        return {
          id: user.id,
          email: user.email,
          type: guestRegex.test(user.email) ? "guest" : "regular",
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.type = (user as any).type;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.type = token.type as UserType;
      }
      return session;
    },
  },
});
