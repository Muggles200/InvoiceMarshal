"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import { credentialsLogin } from "../actions/credentialsLogin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoginForm as LoginFormType } from "@/types";
import { RainbowButton } from "@/components/ui/rainbow-button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { AlertCircle, AtSign, Github, KeyRound, Loader2 } from "lucide-react";
import Link from "next/link";
import { signIn as nextAuthSignIn } from "next-auth/react";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
type Schema = z.infer<typeof schema>;

export default function LoginForm() {
  const router = useRouter();
  const [isPending, start] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
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
        setServerError(null);
        // First, validate credentials with our server action
        await credentialsLogin(data as LoginFormType);
        
        // If credentialsLogin succeeds, then perform the actual sign in with NextAuth client-side
        const result = await nextAuthSignIn("credentials", {
          email: data.email,
          password: data.password,
          redirect: false,
        });

        if (result?.error) {
          setServerError(result.error);
        } else {
          router.replace("/dashboard");
          router.refresh();
        }
      } catch (e: any) {
        const errorMessage = e.message || "An error occurred during login";
        setError("password", { message: errorMessage });
      }
    });

  const handleGoogleSignIn = () => {
    nextAuthSignIn("google", { callbackUrl: "/dashboard" });
  };

  const handleGithubSignIn = () => {
    nextAuthSignIn("github", { callbackUrl: "/dashboard" });
  };

  return (
    <Card className="border-none shadow-lg">
      <CardContent className="pt-6">
        {serverError && (
          <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
              <p className="text-sm text-red-600">{serverError}</p>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label className="font-medium text-sm">Email</Label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <AtSign className="h-4 w-4" />
              </div>
              <Input 
                {...register("email")} 
                className="pl-10 h-11 rounded-xl" 
                placeholder="name@example.com"
              />
            </div>
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label className="font-medium text-sm">Password</Label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <KeyRound className="h-4 w-4" />
              </div>
              <Input 
                type="password" 
                {...register("password")} 
                className="pl-10 h-11 rounded-xl" 
                placeholder="********"
              />
            </div>
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>
          
          <div className="pt-3">
            <RainbowButton 
              type="submit" 
              disabled={isPending} 
              className="w-full h-11 rounded-xl"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> 
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </RainbowButton>
          </div>
        </form>

        <div className="relative mt-6 mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-card text-muted-foreground">Or continue with</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Button 
            variant="outline" 
            className="h-11 rounded-xl" 
            onClick={handleGoogleSignIn}
          >
            <svg xmlns="http://www.w3.org/2000/svg" height="24" width="24" viewBox="0 0 24 24" className="h-5 w-5 mr-2">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google
          </Button>
          <Button 
            variant="outline" 
            className="h-11 rounded-xl" 
            onClick={handleGithubSignIn}
          >
            <Github className="h-5 w-5 mr-2" />
            GitHub
          </Button>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center border-t pt-6">
        <p className="text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-blue-500 hover:text-blue-600 transition-colors">
            Create one
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
