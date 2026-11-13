// src/lib/auth.config.ts
// Auth config yang AMAN untuk Edge Runtime (middleware)
// TIDAK boleh import Node.js-specific modules seperti bcryptjs atau Prisma

import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  basePath: "/api/auth",
  useSecureCookies: process.env.NODE_ENV === "production",
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  trustHost: true,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isLoginPage = nextUrl.pathname === "/login";
      const isApiAuth = nextUrl.pathname.startsWith("/api/auth");

      if (isApiAuth) return true;
      if (isLoginPage) return true;
      return isLoggedIn;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.kategoriId = (user as any).kategoriId || null;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role as string;
        (session.user as any).kategoriId = token.kategoriId || null;
      }
      return session;
    },
  },
  providers: [], // Providers ditambahkan di auth.ts (bukan edge)
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },
};
