import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const BASE_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"];

function getAllowedOrigins(): string[] {
  const extra = process.env.CORS_ORIGIN ?? "";
  return [
    ...BASE_ORIGINS,
    ...extra.split(",").map((o) => o.trim()).filter(Boolean),
  ];
}

export function middleware(request: NextRequest) {
  const origin = request.headers.get("origin") ?? "";
  const allowed = getAllowedOrigins();
  const isAllowed = !origin || allowed.includes(origin);

  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": isAllowed ? origin : "",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  const response = NextResponse.next();

  if (isAllowed && origin) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set("Vary", "Origin");
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
