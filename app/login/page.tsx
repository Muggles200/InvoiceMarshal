// app/login/page.tsx
import getServerSession from "next-auth";
import { auth } from "../utils/auth";
import { redirect } from "next/navigation";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  const session = await auth();
  if (session) redirect("/dashboard");

  return (
    <div className="flex h-screen items-center justify-center">
      <LoginForm />
    </div>
  );
}
