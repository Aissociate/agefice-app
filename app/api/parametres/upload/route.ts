import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const ALLOWED_DOCS = ["qualiopi", "kbis", "catalogue"] as const;
type DocType = (typeof ALLOWED_DOCS)[number];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const docType = formData.get("docType") as string | null;

    if (!file || !docType) {
      return NextResponse.json({ error: "Fichier et type requis" }, { status: 400 });
    }

    if (!ALLOWED_DOCS.includes(docType as DocType)) {
      return NextResponse.json({ error: "Type de document invalide" }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Fichier trop volumineux (max 10 Mo)" }, { status: 400 });
    }

    const ext = path.extname(file.name).toLowerCase();
    const allowed = [".pdf", ".jpg", ".jpeg", ".png"];
    if (!allowed.includes(ext)) {
      return NextResponse.json(
        { error: "Format non autorisé — PDF, JPG ou PNG uniquement" },
        { status: 400 }
      );
    }

    // Save with predictable name (overwrite on re-upload)
    const safeFilename = `org_${docType}${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "organisme");
    await mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, safeFilename);

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    const url = `/uploads/organisme/${safeFilename}`;
    const cle = `org_doc_${docType}_url`;

    await prisma.parametre.upsert({
      where: { cle },
      update: { valeur: url },
      create: { cle, valeur: url, categorie: "organisme" },
    });

    return NextResponse.json({ url });
  } catch (error) {
    console.error("POST /api/parametres/upload error:", error);
    return NextResponse.json({ error: "Erreur lors de l'upload" }, { status: 500 });
  }
}
