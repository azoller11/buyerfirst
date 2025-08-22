import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { generateUniqueUsername } from "@/lib/username";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    CredentialsProvider({
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(c) {
        if (!c?.email || !c?.password) return null;
        const email = c.email.toLowerCase().trim();
        const user = await db.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;

        const ok = await bcrypt.compare(c.password, user.passwordHash);
        if (!ok) return null;

        // Return minimal user — NextAuth will stick it in the JWT
        return { id: user.id, email: user.email, name: user.name ?? undefined, image: user.image ?? undefined };
      },
    }),
  ],

  // 👇 Use JWT sessions (no DB Session row needed)
  session: { strategy: "jwt" },

  pages: { signIn: "/signin" },

  callbacks: {
    // Put id/username into the JWT at login, and persist on subsequent calls
    async jwt({ token, user }) {
      if (user) {
        // first time (sign-in)
        // Use NextAuth's default User type or your Prisma User type
        token.id = (user as { id: string }).id;
        const u = await db.user.findUnique({ where: { id: (user as { id: string }).id }, select: { username: true } });
        token.username = u?.username ?? null;
      } else if (token?.id) {
        // subsequent requests: ensure username stays up to date
        const u = await db.user.findUnique({ where: { id: String(token.id) }, select: { username: true } });
        token.username = u?.username ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // @ts-expect-error augmented in next-auth.d.ts
        session.user.id = token.id as string;
        // @ts-expect-error augmented
        session.user.username = (token as { username?: string | null }).username ?? null;
      }
      return session;
    },
  },

  events: {
    async createUser({ user }) {
      if (!user.username) {
        const username = await generateUniqueUsername(user.name, user.email);
        await db.user.update({ where: { id: user.id }, data: { username } });
      }
    },
  },
};
