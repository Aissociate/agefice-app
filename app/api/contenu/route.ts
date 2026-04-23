import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const posts = await prisma.postBlog.findMany({
      orderBy: { dateCreation: "desc" },
    });
    return NextResponse.json(posts);
  } catch (error) {
    console.error("GET /api/contenu error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      titre, accroche, introduction, sections, conclusion,
      motsCles, hashtags, photoUrl, photoCaption, sujet, ton, publicCible,
    } = await request.json();

    if (!titre) {
      return NextResponse.json({ error: "Le titre est obligatoire" }, { status: 400 });
    }

    const post = await prisma.postBlog.create({
      data: {
        titre,
        accroche,
        introduction,
        sections: sections ? JSON.stringify(sections) : null,
        conclusion,
        motsCles: motsCles ? JSON.stringify(motsCles) : null,
        hashtags: hashtags ? JSON.stringify(hashtags) : null,
        photoUrl,
        photoCaption,
        sujet,
        ton,
        publicCible,
      },
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error("POST /api/contenu error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
