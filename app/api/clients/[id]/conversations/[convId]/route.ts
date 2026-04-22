import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; convId: string }> }) {
  const { convId } = await params;
  const body = await req.json();
  try {
    const conv = await prisma.conversationEmail.update({
      where: { id: convId },
      data: { statut: body.statut },
    });
    return NextResponse.json(conv);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; convId: string }> }) {
  const { convId } = await params;
  try {
    await prisma.conversationEmail.delete({ where: { id: convId } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
