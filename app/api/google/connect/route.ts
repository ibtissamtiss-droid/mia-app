import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getGoogleAuthUrl } from "@/lib/google/client";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.redirect(new URL("/login", req.url));

  const state = crypto.randomUUID();
  const redirectUri = new URL("/api/google/callback", req.url).toString();
  const authUrl = getGoogleAuthUrl(redirectUri, state);

  const response = NextResponse.redirect(authUrl);
  response.cookies.set("google_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return response;
}
