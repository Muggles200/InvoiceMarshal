import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface User {
    role?: string
    emailVerified?: Date | null
  }

  interface Session {
    user: {
      id: string
      role?: string
      emailVerified?: Date | null
    } & DefaultSession["user"]
  }
} 