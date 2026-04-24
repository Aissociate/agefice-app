import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const page = await prisma.landingPage.findUnique({
      where: { id },
      include: { variants: { orderBy: { dateCreation: "asc" } } },
    });
    if (!page) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
    return NextResponse.json(page);
  } catch (error) {
    console.error("GET /api/landing-pages/[id] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await request.json();
    const page = await prisma.landingPage.update({ where: { id }, data });
    return NextResponse.json(page);
  } catch (error) {
    console.error("PUT /api/landing-pages/[id] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.landingPage.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/landing-pages/[id] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
