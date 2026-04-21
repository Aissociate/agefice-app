import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { TRANSITIONS_STATUT, StatutDossier } from "@/lib/utils";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { statut } = body;

    if (!statut) {
      return NextResponse.json({ error: "Le champ 'statut' est obligatoire" }, { status: 400 });
    }

    const dossier = await prisma.dossier.findUnique({ where: { id } });
    if (!dossier) {
      return NextResponse.json({ error: "Dossier non trouvé" }, { status: 404 });
    }

    const currentStatut = dossier.statut as StatutDossier;
    const newStatut = statut as StatutDossier;

    const allowedTransitions = TRANSITIONS_STATUT[currentStatut];
    if (!allowedTransitions) {
      return NextResponse.json(
        { error: `Statut actuel invalide: ${currentStatut}` },
        { status: 400 }
      );
    }

    if (!allowedTransitions.includes(newStatut)) {
      return NextResponse.json(
        {
          error: `Transition invalide: "${currentStatut}" -> "${newStatut}". Transitions autorisées: ${allowedTransitions.join(", ") || "aucune"}`,
        },
        { status: 422 }
      );
    }

    const updated = await prisma.dossier.update({
      where: { id },
      data: { statut: newStatut },
      include: {
        client: true,
        formation: true,
        pieces: true,
        documents: true,
        alertes: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("POST /api/dossiers/[id]/statut error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
