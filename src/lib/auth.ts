import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const authConfig = {
  adapter: DrizzleAdapter(db),
  // JWT strategy is required by the Credentials provider — the Drizzle
  // adapter has no `createSession` for credentials-based logins. Google
  // OAuth still uses the adapter for account linking; only sessions
  // themselves are stored in the signed JWT.
  session: { strategy: "jwt" },
  // No `pages` override: middleware builds locale-prefixed redirects
  // and Auth.js falls back to its built-in pages for error states,
  // which we don't surface anyway since both login + signup are custom.
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(rawCredentials) {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const row = await db.query.users.findFirst({
          where: eq(users.email, email),
        });

        if (!row?.hashedPassword) return null;
        const ok = await bcrypt.compare(password, row.hashedPassword);
        if (!ok) return null;

        return {
          id: row.id,
          email: row.email,
          name: row.name,
          image: row.image,
        };
      },
    }),
  ],
  callbacks: {
    // JWT runs on every request; session() runs after JWT and shapes the
    // public session shape. We stash the user id on the token at sign-in
    // and forward it to session.user.id for the rest of the app.
    async jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
