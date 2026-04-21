import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const clients = await prisma.client.findMany({
      orderBy: { dateCreation: "desc" },
      include: {
        _count: { select: { dossiers: true } },
      },
    });
    return NextResponse.json(clients);
  } catch (error) {
    console.error("GET /api/clients error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      civilite,
      nom,
      prenom,
      nomNaissance,
      dateNaissance,
      numeroSS,
      nomCommercial,
      activitePrincipale,
      statutJuridique,
      siret,
      codeApe,
      niveauDiplome,
      ancienneteDirection,
      adresse,
      codePostal,
      ville,
      email,
      telephone,
    } = body;

    if (!nom || !prenom || !statutJuridique || !siret || !codeApe || !email) {
      return NextResponse.json(
        { error: "Champs obligatoires manquants: nom, prenom, statutJuridique, siret, codeApe, email" },
        { status: 400 }
      );
    }

    const client = await prisma.client.create({
      data: {
        civilite: civilite || null,
        nom,
        prenom,
        nomNaissance: nomNaissance || null,
        dateNaissance: dateNaissance ? new Date(dateNaissance) : null,
        numeroSS: numeroSS || null,
        nomCommercial: nomCommercial || null,
        activitePrincipale: activitePrincipale || null,
        statutJuridique,
        siret,
        codeApe,
        niveauDiplome: niveauDiplome || null,
        ancienneteDirection: ancienneteDirection || null,
        adresse: adresse || null,
        codePostal: codePostal || null,
        ville: ville || null,
        email,
        telephone: telephone || null,
      },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/clients error:", error);
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Un client avec ce SIRET existe déjà" }, { status: 409 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
