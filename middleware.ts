import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith("/api/");

  // Preflight CORS pour toutes les routes API
  if (isApi && request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders(),
    });
  }

  const response = NextResponse.next();

  // Injecte CORS sur toutes les réponses API
  if (isApi) {
    const headers = corsHeaders();
    Object.entries(headers).forEach(([k, v]) => response.headers.set(k, v));
  }

  return response;
}

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
