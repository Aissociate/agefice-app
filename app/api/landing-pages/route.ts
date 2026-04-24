import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const pages = await prisma.landingPage.findMany({
      orderBy: { dateCreation: "desc" },
      include: { variants: { select: { id: true, nom: true, actif: true, vues: true, conversions: true } } },
    });
    return NextResponse.json(pages);
  } catch (error) {
    console.error("GET /api/landing-pages error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { nom, sujet, publicCible, offre, template } = await request.json();
    if (!nom || !sujet || !template) {
      return NextResponse.json({ error: "nom, sujet et template sont requis" }, { status: 400 });
    }
    const page = await prisma.landingPage.create({
      data: { nom, sujet, publicCible, offre, template },
    });
    return NextResponse.json(page, { status: 201 });
  } catch (error) {
    console.error("POST /api/landing-pages error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
