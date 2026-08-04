import type { NextAuthConfig } from "next-auth";

// Edge-safe config (no Prisma/bcrypt) — shared by the full auth.ts (Node runtime)
// and by middleware.ts, which runs on the Edge runtime and only needs to read the JWT.
export const authConfig = {
  pages: { signIn: "/" },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
