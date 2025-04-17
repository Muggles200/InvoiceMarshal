// app/signup/SignupForm.tsx
"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { createUserAction } from "../actions/createUser";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const schema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });
type FormData = z.infer<typeof schema>;

export default function SignupForm() {
  const router = useRouter();
  const [isPending, start] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = (data: FormData) =>
    start(async () => {
      try {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
          formData.append(key, value);
        });
        const res = await createUserAction(formData);
        if (res?.redirect) router.push(res.redirect);
      } catch (err: any) {
        setError("confirmPassword", { message: err.message });
      }
    });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label>Email</Label>
        <Input {...register("email")} />
        {errors.email && <p className="text-red-600">{errors.email.message}</p>}
      </div>
      <div>
        <Label>Password</Label>
        <Input type="password" {...register("password")} />
        {errors.password && <p className="text-red-600">{errors.password.message}</p>}
      </div>
      <div>
        <Label>Confirm Password</Label>
        <Input type="password" {...register("confirmPassword")} />
        {errors.confirmPassword && (
          <p className="text-red-600">{errors.confirmPassword.message}</p>
        )}
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Signing up…" : "Sign Up"}
      </Button>
    </form>
  );
}
