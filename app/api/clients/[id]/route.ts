import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        dossiers: {
          include: { formation: true },
          orderBy: { dateCreation: "desc" },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Client non trouvé" }, { status: 404 });
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error("GET /api/clients/[id] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const existing = await prisma.client.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Client non trouvé" }, { status: 404 });
    }

    const client = await prisma.client.update({
      where: { id },
      data: {
        ...(civilite !== undefined && { civilite: civilite || null }),
        ...(nom !== undefined && { nom }),
        ...(prenom !== undefined && { prenom }),
        ...(nomNaissance !== undefined && { nomNaissance: nomNaissance || null }),
        ...(dateNaissance !== undefined && { dateNaissance: dateNaissance ? new Date(dateNaissance) : null }),
        ...(numeroSS !== undefined && { numeroSS: numeroSS || null }),
        ...(nomCommercial !== undefined && { nomCommercial: nomCommercial || null }),
        ...(activitePrincipale !== undefined && { activitePrincipale: activitePrincipale || null }),
        ...(statutJuridique !== undefined && { statutJuridique }),
        ...(siret !== undefined && { siret }),
        ...(codeApe !== undefined && { codeApe }),
        ...(niveauDiplome !== undefined && { niveauDiplome: niveauDiplome || null }),
        ...(ancienneteDirection !== undefined && { ancienneteDirection: ancienneteDirection || null }),
        ...(adresse !== undefined && { adresse: adresse || null }),
        ...(codePostal !== undefined && { codePostal: codePostal || null }),
        ...(ville !== undefined && { ville: ville || null }),
        ...(email !== undefined && { email }),
        ...(telephone !== undefined && { telephone: telephone || null }),
      },
    });

    return NextResponse.json(client);
  } catch (error: any) {
    console.error("PUT /api/clients/[id] error:", error);
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Un client avec ce SIRET existe déjà" }, { status: 409 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await prisma.client.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Client non trouvé" }, { status: 404 });
    }

    await prisma.client.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/clients/[id] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
