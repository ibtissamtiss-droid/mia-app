import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { exchangeCodeForTokens, getGoogleUserEmail } from "@/lib/google/client";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.redirect(new URL("/login", req.url));

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const cookieState = req.headers
    .get("cookie")
    ?.split("; ")
    .find((c) => c.startsWith("google_oauth_state="))
    ?.split("=")[1];

  if (!code || !state || state !== cookieState) {
    return NextResponse.redirect(new URL("/settings?google_error=1", req.url));
  }

  const redirectUri = new URL("/api/google/callback", req.url).toString();

  try {
    const tokens = await exchangeCodeForTokens(code, redirectUri);
    const email = await getGoogleUserEmail(tokens.access_token);

    await prisma.googleAccount.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        email,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? "",
        expiryDate: new Date(Date.now() + tokens.expires_in * 1000),
      },
      update: {
        email,
        accessToken: tokens.access_token,
        ...(tokens.refresh_token ? { refreshToken: tokens.refresh_token } : {}),
        expiryDate: new Date(Date.now() + tokens.expires_in * 1000),
      },
    });

    const response = NextResponse.redirect(new URL("/settings?google_connected=1", req.url));
    response.cookies.delete("google_oauth_state");
    return response;
  } catch {
    return NextResponse.redirect(new URL("/settings?google_error=1", req.url));
  }
}
