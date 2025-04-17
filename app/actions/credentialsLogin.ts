// app/actions/credentialsLogin.ts
"use server";

import { signIn } from "next-auth/react";
import prisma from "@/app/utils/db";
import { verify as argonVerify, hash as argonHash } from "argon2";
import type { LoginForm } from "@/types";
import { cookies, headers } from "next/headers";

const MAX_FAILED = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 min

export async function credentialsLogin(form: LoginForm) {
  const { email, password } = form;
  // 1. Lookup user
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      password: true,
      emailVerified: true,
    },
  });
  const ip =
    (await headers()).get("x-forwarded-for")?.split(",")[0] ||
    (await headers()).get("x-real-ip") ||
    "unknown";

  // 2. Count recent failures (per user + per IP)
  const cutoff = new Date(Date.now() - WINDOW_MS);
  const recentFails = await prisma.loginAttempt.count({
    where: {
      AND: [
        { createdAt: { gte: cutoff } },
        { success: false },
        {
          OR: [
            { userId: user?.id },
            { ip },
          ],
        },
      ],
    },
  });
  if (recentFails >= MAX_FAILED) {
    throw new Error(
      "Too many failed attempts. Please try again in 15 minutes."
    );
  }

  // 3. Verify password
  if (!user?.password) {
    await prisma.loginAttempt.create({ data: { ip, success: false } });
    throw new Error("Invalid credentials");
  }

  const valid = await argonVerify(user.password, password);
  // 4. On‑the‑fly bcrypt→Argon2 upgrade
  if (valid && user.password.startsWith("$2")) {
    const newHash = await argonHash(password);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: newHash },
    });
  }

  // 5. Record attempt
  await prisma.loginAttempt.create({
    data: { userId: user.id, ip, success: valid },
  });

  if (!valid) {
    throw new Error("Invalid credentials");
  }

  // 6. Finally, call NextAuth’s signIn (redirect: false so we can handle errors)
  const res = await signIn("credentials", {
    email,
    password,
    redirect: false,
  });

  if (res?.error) {
    throw new Error(res.error);
  }
}
