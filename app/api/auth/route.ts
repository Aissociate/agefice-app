import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";

export async function POST(request: NextRequest) {
  const { password } = await request.json() as { password: string };

  const expected = process.env.APP_PASSWORD ?? "admin";
  if (password !== expected) {
    return NextResponse.json({ error: "Mot de passe incorrect" }, { status: 401 });
  }

  const secret = process.env.AUTH_SECRET ?? "changeme";
  const value = Date.now().toString();
  const sig = createHmac("sha256", secret).update(value).digest("hex");
  const token = `${value}.${sig}`;

  const from = request.nextUrl.searchParams.get("from") ?? "/dashboard";
  const res = NextResponse.json({ ok: true, redirect: from });
  res.cookies.set("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 jours
    path: "/",
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete("auth_token");
  return res;
}
