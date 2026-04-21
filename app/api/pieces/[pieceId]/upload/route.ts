import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ pieceId: string }> }
) {
  try {
    const { pieceId } = await params;

    const piece = await prisma.pieceClient.findUnique({ where: { id: pieceId } });
    if (!piece) {
      return NextResponse.json({ error: "Pièce non trouvée" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
    }

    // Limit to 10 MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Fichier trop volumineux (max 10 Mo)" }, { status: 400 });
    }

    // Sanitize filename
    const ext = path.extname(file.name).toLowerCase();
    const allowed = [".pdf", ".jpg", ".jpeg", ".png", ".webp"];
    if (!allowed.includes(ext)) {
      return NextResponse.json(
        { error: "Format non autorisé. Formats acceptés : PDF, JPG, PNG" },
        { status: 400 }
      );
    }

    const safeFilename = `${pieceId}${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "pieces");
    await mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, safeFilename);

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    const url = `/uploads/pieces/${safeFilename}`;

    const updated = await prisma.pieceClient.update({
      where: { id: pieceId },
      data: {
        url,
        statut: "recue",
        dateDepot: new Date(),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("POST /api/pieces/[pieceId]/upload error:", error);
    return NextResponse.json({ error: "Erreur lors de l'upload" }, { status: 500 });
  }
}
