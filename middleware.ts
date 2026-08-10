import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

const AUTH_ONLY_PATHS = ["/login", "/register", "/forgot-password", "/reset-password"];
const INFO_PATHS = [
  "/a-propos",
  "/confiance-securite",
  "/accessibilite",
  "/confidentialite",
  "/cookies",
];
const PUBLIC_PATHS = [...AUTH_ONLY_PATHS, ...INFO_PATHS];

export default auth((req) => {
  const isPublic = PUBLIC_PATHS.some((p) => req.nextUrl.pathname.startsWith(p));
  const isAuthOnly = AUTH_ONLY_PATHS.some((p) => req.nextUrl.pathname.startsWith(p));
  const isLoggedIn = !!req.auth;

  if (!isLoggedIn && !isPublic && req.nextUrl.pathname !== "/") {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoggedIn && isAuthOnly) {
    const dashboardUrl = new URL("/dashboard", req.nextUrl.origin);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
