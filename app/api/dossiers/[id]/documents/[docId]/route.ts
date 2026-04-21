import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
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

    if (!doc.contenu) {
      return NextResponse.json({ error: "Contenu non disponible — régénérez le document" }, { status: 404 });
    }

    // Retourner le HTML directement avec les bons headers
    return new NextResponse(doc.contenu, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="${doc.nomFichier ?? "document.html"}"`,
      },
    });
  } catch (error) {
    console.error("GET /api/dossiers/[id]/documents/[docId] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
