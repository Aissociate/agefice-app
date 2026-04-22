import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; noteId: string }> }) {
  const { noteId } = await params;
  const { contenu } = await req.json();
  try {
    const note = await prisma.noteClient.update({ where: { id: noteId }, data: { contenu } });
    return NextResponse.json(note);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; noteId: string }> }) {
  const { noteId } = await params;
  try {
    await prisma.noteClient.delete({ where: { id: noteId } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
