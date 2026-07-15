import { NextAuthConfig } from "next-auth";
import type { Role } from "@/constant/roles";

type AuthUser = {
  id?: string;
  role?: Role;
};

export const authConfig = {
  providers: [], // Keep empty, providers are injected in the main auth.ts file
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const authUser = user as AuthUser;
        if (authUser.id) token.id = authUser.id;
        if (authUser.role) token.role = authUser.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const sessionUser = session.user as AuthUser;
        sessionUser.id = typeof token.id === "string" ? token.id : undefined;
        sessionUser.role =
          typeof token.role === "string" ? token.role : undefined;
      }
      return session;
    },
  },
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login", // Redirects unauthenticated requests cleanly
  },
} satisfies NextAuthConfig;
