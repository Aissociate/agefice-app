import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const actifParam = searchParams.get("actif");

    const where: any = {};
    if (actifParam === "true") where.actif = true;
    else if (actifParam === "false") where.actif = false;

    const formations = await prisma.formation.findMany({
      where,
      orderBy: { dateCreation: "desc" },
      include: {
        _count: { select: { dossiers: true } },
      },
    });

    return NextResponse.json(formations);
  } catch (error) {
    console.error("GET /api/formations error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
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
      certifiant,
      eligibleCPF,
      referenceRS,
      plafondAGEFICE,
      actif,
    } = body;

    if (!reference || !intitule || !programme || dureeHeures == null || tarifInterHT == null || tarifIntraHT == null) {
      return NextResponse.json(
        { error: "Champs obligatoires manquants: reference, intitule, programme, dureeHeures, tarifInterHT, tarifIntraHT" },
        { status: 400 }
      );
    }

    const formation = await prisma.formation.create({
      data: {
        reference,
        intitule,
        programme,
        objectifs,
        publicCible,
        prerequis,
        dureeHeures,
        tarifInterHT,
        tarifIntraHT,
        modalite: modalite ?? "presentiel",
        certifiant: certifiant ?? false,
        eligibleCPF: eligibleCPF ?? false,
        referenceRS,
        plafondAGEFICE,
        actif: actif ?? true,
      },
    });

    return NextResponse.json(formation, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/formations error:", error);
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Une formation avec cette référence existe déjà" }, { status: 409 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
