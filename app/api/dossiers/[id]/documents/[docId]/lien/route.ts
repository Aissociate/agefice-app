import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { randomBytes } from "crypto";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const { id, docId } = await params;

    const doc = await prisma.document.findFirst({
      where: { id: docId, dossierId: id },
    });

    if (!doc) {
      return NextResponse.json({ error: "Document non trouvé" }, { status: 404 });
    }

    const tokenEleve = doc.tokenEleve ?? randomBytes(24).toString("hex");
    const tokenOF = doc.tokenOF ?? randomBytes(24).toString("hex");

    await prisma.document.update({
      where: { id: docId },
      data: { tokenEleve, tokenOF },
    });

    return NextResponse.json({ tokenEleve, tokenOF });
  } catch (error) {
    console.error("POST /lien error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
