import { NextRequest, NextResponse } from "next/server";
import { generateLandingPage } from "@/lib/generateLandingPage";

export async function POST(request: NextRequest) {
  try {
    const { sujet, publicCible, offre, template, angle, palette } = await request.json();

    if (!sujet || !template) {
      return NextResponse.json({ error: "sujet et template sont requis" }, { status: 400 });
    }

    const contenu = await generateLandingPage({
      sujet,
      publicCible: publicCible ?? "chefs d'entreprise",
      offre: offre ?? sujet,
      template,
      angle: angle ?? "focus sur les bénéfices concrets",
      palette: palette ?? "bleu",
    });

    return NextResponse.json(contenu);
  } catch (error) {
    console.error("POST /api/landing-pages/generer error:", error);
    return NextResponse.json({ error: "Erreur lors de la génération" }, { status: 500 });
  }
}
