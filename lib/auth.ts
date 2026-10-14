// lib/auth.ts
import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    // Password authentication only verifies existing accounts.
    CredentialsProvider({
      name: "Password",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "demo@example.com" },
        name:  { label: "Name",  type: "text",  placeholder: "Your name" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;
        const email = credentials.email.trim().toLowerCase();
        const password = credentials.password;
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
        if (password.length < 8 || password.length > 128) return null;
        if (email === "demo@example.com" && (process.env.NODE_ENV === "production" || process.env.ALLOW_DEMO_LOGIN !== "true")) return null;

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (!existingUser?.passwordHash || !existingUser.emailVerified || !(await bcrypt.compare(password, existingUser.passwordHash))) return null;
        return existingUser;
      },
    }),
    // Uncomment and add env vars to enable social login:
    // GithubProvider({
    //   clientId: process.env.GITHUB_ID!,
    //   clientSecret: process.env.GITHUB_SECRET!,
    // }),
    // GoogleProvider({
    //   clientId: process.env.GOOGLE_CLIENT_ID!,
    //   clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    // }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const account = await prisma.user.findUnique({
          where: { id: user.id },
          select: { sessionVersion: true },
        });
        if (!account) throw new Error("Unable to validate the user session.");
        token.id = user.id;
        token.sessionVersion = account.sessionVersion;
      } else if (typeof token.id === "string") {
        const account = await prisma.user.findUnique({
          where: { id: token.id },
          select: { sessionVersion: true },
        });
        if (!account) throw new Error("Session revoked.");

        if (typeof token.sessionVersion === "number") {
          if (token.sessionVersion !== account.sessionVersion) throw new Error("Session revoked.");
        } else if (token.sessionVersion !== undefined || account.sessionVersion !== 0) {
          throw new Error("Session revoked.");
        }
        token.sessionVersion = account.sessionVersion;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) (session.user as any).id = token.id as string;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
