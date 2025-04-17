// app/login/page.tsx
import getServerSession from "next-auth";
import { auth } from "../utils/auth";
import { redirect } from "next/navigation";
import LoginForm from "./LoginForm";
import Image from "next/image";
import Logo from "@/public/logo.png";
import Link from "next/link";

export default async function LoginPage() {
  const session = await auth();
  if (session) redirect("/dashboard");

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center">
      <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:6rem_4rem]">
        <div className="absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(circle_500px_at_50%_200px,#C9EBFF,transparent)]"></div>
      </div>
      <div className="w-full max-w-md mx-auto px-4">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-8">
            <Image src={Logo} alt="Logo" className="size-10" />
            <h3 className="text-3xl font-semibold">
              Invoice<span className="text-blue-500">Marshal</span>
            </h3>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
          <p className="mt-2 text-muted-foreground">Sign in to your account</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
