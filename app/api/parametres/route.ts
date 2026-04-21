import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const parametres = await prisma.parametre.findMany({
      orderBy: [{ categorie: "asc" }, { cle: "asc" }],
    });

    // Return as {cle: valeur} object
    const result = parametres.reduce<Record<string, string>>((acc, param) => {
      acc[param.cle] = param.valeur;
      return acc;
    }, {});

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/parametres error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { params } = body as { params: { cle: string; valeur: string }[] };

    if (!params || !Array.isArray(params)) {
      return NextResponse.json(
        { error: "Le champ 'params' doit être un tableau d'objets {cle, valeur}" },
        { status: 400 }
      );
    }

    // Upsert each param
    const upsertOps = params.map((p) =>
      prisma.parametre.upsert({
        where: { cle: p.cle },
        update: { valeur: p.valeur },
        create: { cle: p.cle, valeur: p.valeur },
      })
    );

    await prisma.$transaction(upsertOps);

    // Return updated state as {cle: valeur}
    const allParams = await prisma.parametre.findMany({
      orderBy: [{ categorie: "asc" }, { cle: "asc" }],
    });

    const result = allParams.reduce<Record<string, string>>((acc, param) => {
      acc[param.cle] = param.valeur;
      return acc;
    }, {});

    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/parametres error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
