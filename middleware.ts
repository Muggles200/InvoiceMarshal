// middleware.ts
import { auth } from "@/app/utils/auth";       // <-- root‑level auth.ts
import { NextResponse, NextRequest } from "next/server";

export const runtime = "nodejs";

export default auth(async (req: NextRequest) => {
  const session = await auth();
  const url = req.nextUrl.clone();

  // example: block unverified
  if (session?.user && !session.user.emailVerified) {
    url.pathname = "/verify-email";
    return NextResponse.redirect(url);
  }

  // example: role gate
  if (url.pathname.startsWith("/admin") && session?.user?.role !== "ADMIN") {
    url.pathname = "/unauthorized";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding/:path*", "/admin/:path*"],
};
