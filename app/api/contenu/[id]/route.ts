import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const post = await prisma.postBlog.findUnique({ where: { id } });
    if (!post) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
    return NextResponse.json(post);
  } catch (error) {
    console.error("GET /api/contenu/[id] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await request.json();

    const post = await prisma.postBlog.update({
      where: { id },
      data: {
        ...data,
        sections: data.sections ? JSON.stringify(data.sections) : undefined,
        motsCles: data.motsCles ? JSON.stringify(data.motsCles) : undefined,
        hashtags: data.hashtags ? JSON.stringify(data.hashtags) : undefined,
      },
    });

    return NextResponse.json(post);
  } catch (error) {
    console.error("PUT /api/contenu/[id] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.postBlog.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/contenu/[id] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
