import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const MAX_SIZE = 25 * 1024 * 1024; // 25 Mo

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "Fichier requis" }, { status: 400 });
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Fichier trop volumineux (max 25 Mo)" }, { status: 400 });
    }

    const ext = path.extname(file.name).toLowerCase();
    const safeFilename = `${randomUUID()}${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "emails");
    await mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, safeFilename);

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    const url = `/uploads/emails/${safeFilename}`;
    return NextResponse.json({
      url,
      nom: file.name,
      type: file.type || "application/octet-stream",
      taille: file.size,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
