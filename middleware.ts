import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";

const PUBLIC_PATHS = ["/login", "/api/auth", "/signer"];

function validToken(token: string): boolean {
  const secret = process.env.AUTH_SECRET ?? "changeme";
  const [value, sig] = token.split(".");
  if (!value || !sig) return false;
  const expected = createHmac("sha256", secret).update(value).digest("hex");
  return sig === expected;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Laisser passer les routes publiques
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = request.cookies.get("auth_token")?.value;
  if (token && validToken(token)) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("from", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
