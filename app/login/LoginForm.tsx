"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { credentialsLogin } from "../actions/credentialsLogin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoginForm as LoginFormType } from "@/types";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
type Schema = z.infer<typeof schema>;

export default function LoginForm() {
  const router = useRouter();
  const [isPending, start] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<Schema>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: Schema) =>
    start(async () => {
      try {
        await credentialsLogin(data as LoginFormType);
        router.replace("/dashboard");
      } catch (e: any) {
        setError("password", { message: e.message });
      }
    });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label>Email</Label>
        <Input {...register("email")} />
        {errors.email && (
          <p className="text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>
      <div>
        <Label>Password</Label>
        <Input type="password" {...register("password")} />
        {errors.password && (
          <p className="text-sm text-red-600">{errors.password.message}</p>
        )}
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Signing in…" : "Login"}
      </Button>
    </form>
  );
}
