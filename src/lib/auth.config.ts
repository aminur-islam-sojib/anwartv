import { NextAuthConfig } from "next-auth";

export const authConfig = {
  providers: [], // Keep empty, providers are injected in the main auth.ts file
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login", // Redirects unauthenticated requests cleanly
  },
} satisfies NextAuthConfig;
