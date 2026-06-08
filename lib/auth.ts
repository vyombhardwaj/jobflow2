// lib/auth.ts
import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET ?? "dev-nextauth-secret-change-me",
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    // Credentials for demo/dev (email only, no password)
    CredentialsProvider({
      name: "Demo Login",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "demo@example.com" },
        name:  { label: "Name",  type: "text",  placeholder: "Your name" },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        const user = await prisma.user.upsert({
          where:  { email: credentials.email },
          update: {},
          create: { email: credentials.email, name: credentials.name ?? "Student" },
        });
        return user;
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
      if (user) token.id = user.id;
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
