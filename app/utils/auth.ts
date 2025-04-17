// auth.ts
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { z } from "zod";
import prisma from "@/app/utils/db";
import { hash as argonHash, verify as argonVerify } from "argon2";

// validate env once at startup
const env = z
  .object({
    AUTH_SECRET: z.string().min(1),
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
    GITHUB_CLIENT_ID: z.string().min(1),
    GITHUB_CLIENT_SECRET: z.string().min(1),
  })
  .parse(process.env);

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  secret: env.AUTH_SECRET,
  session: { strategy: "database", maxAge: 30 * 24 * 60 * 60 },
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }),
    GitHubProvider({
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds) {
        if (!creds?.email || !creds.password) {
          throw new Error("Missing email or password");
        }
        const user = await prisma.user.findUnique({
          where: { email: creds.email as string },
          select: {
            id: true,
            email: true,
            password: true,
            emailVerified: true,
            role: true,
          },
        });
        if (!user || !(await argonVerify(user.password as string, creds.password as string))) {
          throw new Error("Invalid credentials");
        }
        return {
          id: user.id,
          email: user.email,
          emailVerified: user.emailVerified,
          role: user.role,
        };
      },
    }),
  ],
  pages: { signIn: "/login", verifyRequest: "/verify-email" },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        // Type assertion for role
        session.user.role = (user as any).role;
        // Convert to Date type if needed
        session.user.emailVerified = user.emailVerified ? new Date(user.emailVerified) : null;
      }
      return session;
    },
    async signIn({ user, account }) {
      if (
        (account?.provider === "google" || account?.provider === "github") &&
        !(user as any).emailVerified
      ) {
        return false;
      }
      return true;
    },
  },
});
