import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: landingId } = await params;
    const { nom, angle, palette, contenu } = await request.json();

    if (!nom || !contenu) {
      return NextResponse.json({ error: "nom et contenu sont requis" }, { status: 400 });
    }

    const variant = await prisma.landingVariant.create({
      data: {
        landingId,
        nom,
        angle: angle ?? "",
        palette: palette ?? "bleu",
        contenu: typeof contenu === "string" ? contenu : JSON.stringify(contenu),
      },
    });

    return NextResponse.json(variant, { status: 201 });
  } catch (error) {
    console.error("POST variants error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
