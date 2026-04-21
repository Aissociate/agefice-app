import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { unlink } from "fs/promises";
import path from "path";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ pieceId: string }> }
) {
  try {
    const { pieceId } = await params;
    const body = await request.json();
    const { statut, commentaire } = body;

    const piece = await prisma.pieceClient.findUnique({ where: { id: pieceId } });
    if (!piece) {
      return NextResponse.json({ error: "Pièce non trouvée" }, { status: 404 });
    }

    const updated = await prisma.pieceClient.update({
      where: { id: pieceId },
      data: {
        ...(statut !== undefined && { statut }),
        ...(commentaire !== undefined && { commentaire }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/pieces/[pieceId] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ pieceId: string }> }
) {
  try {
    const { pieceId } = await params;

    const piece = await prisma.pieceClient.findUnique({ where: { id: pieceId } });
    if (!piece) {
      return NextResponse.json({ error: "Pièce non trouvée" }, { status: 404 });
    }

    // Delete file from disk if exists
    if (piece.url) {
      try {
        const filePath = path.join(process.cwd(), "public", piece.url);
        await unlink(filePath);
      } catch {
        // File may not exist on disk, continue
      }
    }

    await prisma.pieceClient.update({
      where: { id: pieceId },
      data: { url: null, statut: "manquante", dateDepot: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/pieces/[pieceId] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
