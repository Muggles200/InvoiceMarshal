// app/signup/page.tsx
import { auth } from "../utils/auth";
import { redirect } from "next/navigation";
import SignupForm from "./SignupForm";

export default async function SignUpPage() {
  const session = await auth();
  if (session) redirect("/dashboard");

  return (
    <div className="flex h-screen items-center justify-center px-4">
      <div className="max-w-sm w-full">
        <h1 className="text-2xl mb-4">Create your account</h1>
        <SignupForm />
      </div>
    </div>
  );
}
