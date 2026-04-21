import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const formation = await prisma.formation.findUnique({
      where: { id },
      include: {
        dossiers: {
          include: { client: true },
          orderBy: { dateCreation: "desc" },
        },
      },
    });

    if (!formation) {
      return NextResponse.json({ error: "Formation non trouvée" }, { status: 404 });
    }

    return NextResponse.json(formation);
  } catch (error) {
    console.error("GET /api/formations/[id] error:", error);
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
      reference,
      intitule,
      programme,
      objectifs,
      publicCible,
      prerequis,
      dureeHeures,
      tarifInterHT,
      tarifIntraHT,
      modalite,
      formationEnEntreprise,
      certifiant,
      eligibleCPF,
      referenceRS,
      plafondAGEFICE,
      actif,
    } = body;

    const existing = await prisma.formation.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Formation non trouvée" }, { status: 404 });
    }

    const formation = await prisma.formation.update({
      where: { id },
      data: {
        ...(reference !== undefined && { reference }),
        ...(intitule !== undefined && { intitule }),
        ...(programme !== undefined && { programme }),
        ...(objectifs !== undefined && { objectifs }),
        ...(publicCible !== undefined && { publicCible }),
        ...(prerequis !== undefined && { prerequis }),
        ...(dureeHeures !== undefined && { dureeHeures }),
        ...(tarifInterHT !== undefined && { tarifInterHT }),
        ...(tarifIntraHT !== undefined && { tarifIntraHT }),
        ...(modalite !== undefined && { modalite }),
        ...(formationEnEntreprise !== undefined && { formationEnEntreprise }),
        ...(certifiant !== undefined && { certifiant }),
        ...(eligibleCPF !== undefined && { eligibleCPF }),
        ...(referenceRS !== undefined && { referenceRS }),
        ...(plafondAGEFICE !== undefined && { plafondAGEFICE }),
        ...(actif !== undefined && { actif }),
      },
    });

    return NextResponse.json(formation);
  } catch (error: any) {
    console.error("PUT /api/formations/[id] error:", error);
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "Une formation avec cette référence existe déjà" },
        { status: 409 }
      );
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
    const existing = await prisma.formation.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Formation non trouvée" }, { status: 404 });
    }

    await prisma.formation.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/formations/[id] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
