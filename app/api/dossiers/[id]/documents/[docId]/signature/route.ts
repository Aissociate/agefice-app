import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const { id, docId } = await params;
    const body = await request.json() as {
      type: "eleve" | "of";
      image: string;
      timestamp: string;
      userAgent: string;
    };

    const doc = await prisma.document.findFirst({
      where: { id: docId, dossierId: id },
    });

    if (!doc) {
      return NextResponse.json({ error: "Document non trouvé" }, { status: 404 });
    }

    const payload = JSON.stringify({
      image: body.image,
      timestamp: body.timestamp,
      userAgent: body.userAgent,
      ip: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "unknown",
    });

    const update =
      body.type === "eleve"
        ? { signatureEleve: payload }
        : { signatureOF: payload };

    const bothSigned =
      body.type === "eleve"
        ? !!doc.signatureOF
        : !!doc.signatureEleve;

    const updated = await prisma.document.update({
      where: { id: docId },
      data: { ...update, ...(bothSigned ? { signe: true } : {}) },
    });

    return NextResponse.json({ ok: true, signe: updated.signe });
  } catch (error) {
    console.error("POST /signature error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
