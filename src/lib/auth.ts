import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

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
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db.user.findUnique({ where: { email: credentials.email } });
        if (!user || !user.passwordHash) return null;

        const ok = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!ok) return null;

        // Minimal session object; NextAuth will merge with adapter fields
        return { id: user.id, email: user.email, name: user.name, image: user.image || undefined };
      },
    }),
  ],
  session: { strategy: "database" }, // uses Prisma Session model
  pages: {
    signIn: "/signin",
  },
  callbacks: {
  async session({ session, user }) {
    if (session.user) {
      session.user.id = user.id;
    }
    return session;
  },
},

};
