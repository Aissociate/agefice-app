import { NextRequest, NextResponse } from "next/server";
import { generateBlogPost } from "@/lib/generateBlogPost";

export async function POST(request: NextRequest) {
  try {
    const { sujet, ton = "professionnel", longueur = "moyen", publicCible = "chefs d'entreprise" } =
      await request.json();

    if (!sujet) {
      return NextResponse.json({ error: "Le sujet est obligatoire" }, { status: 400 });
    }

    const post = await generateBlogPost({ sujet, ton, longueur, publicCible });
    return NextResponse.json(post);
  } catch (error) {
    console.error("POST /api/contenu/generer error:", error);
    return NextResponse.json({ error: "Erreur lors de la génération" }, { status: 500 });
  }
}
