// app/actions/createUser.ts
"use server";

import { z } from "zod";
import { argon2id, hash as argonHash } from "argon2";
import { randomUUID } from "crypto";
import prisma from "@/app/utils/db";
import { headers } from "next/headers";
import { sendVerificationEmail } from "@/app/utils/email";

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  confirmPassword: z.string().min(8),
});

const MAX_FAILED = 5;
const WINDOW_MS = 60 * 60 * 1000; // 1h

export async function createUserAction(formData: FormData) {
  const result = signupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!result.success) {
    throw new Error("Invalid input data");
  }
  const { email, password, confirmPassword } = result.data;
  if (password !== confirmPassword) {
    throw new Error("Passwords do not match");
  }

  const ip =
    (await headers()).get("x-forwarded-for")?.split(",")[0] ||
    (await headers()).get("x-real-ip") ||
    "unknown";

  // 1) Count recent failed signups for this email or IP
  const cutoff = new Date(Date.now() - WINDOW_MS);
  const recentFails = await prisma.signupAttempt.count({
    where: {
      AND: [
        { createdAt: { gte: cutoff } },
        { success: false },
        {
          OR: [{ email }, { ip }],
        },
      ],
    },
  });
  if (recentFails >= MAX_FAILED) {
    throw new Error("Too many attempts, please wait before trying again.");
  }

  // 2) Does user already exist?
  if (await prisma.user.findUnique({ where: { email } })) {
    await prisma.signupAttempt.create({ data: { email, ip, success: false } });
    throw new Error("Email already registered");
  }

  // 3) Hash password
  const hashed = await argonHash(password, {
    type: argon2id,
    memoryCost: 2 ** 16,
    timeCost: 3,
    parallelism: 1,
  });

  // 4) Create user + verification token
  const user = await prisma.user.create({
    data: { email, password: hashed },
  });
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
  await prisma.emailVerificationToken.create({
    data: { token, userId: user.id, expiresAt },
  });

  // 5) Send verification email
  await sendVerificationEmail({
    to: email,
    token,
  });

  // 6) Log success
  await prisma.signupAttempt.create({ data: { email, ip, success: true } });

  // 7) Redirect to "check your inbox" page
  return { redirect: "/verify-request" };
}
