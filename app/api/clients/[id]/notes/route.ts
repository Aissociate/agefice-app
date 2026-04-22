import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const notes = await prisma.noteClient.findMany({
      where: { clientId: id },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json(notes);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { contenu } = await req.json();
  if (!contenu?.trim()) return NextResponse.json({ error: "Contenu requis" }, { status: 400 });
  try {
    const note = await prisma.noteClient.create({ data: { clientId: id, contenu } });
    return NextResponse.json(note, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
