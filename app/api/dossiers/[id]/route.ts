import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  calculerDateLimiteDepot,
  calculerDateLimiteRemboursement,
} from "@/lib/utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const dossier = await prisma.dossier.findUnique({
      where: { id },
      include: {
        client: true,
        formation: true,
        pieces: true,
        documents: true,
        alertes: true,
      },
    });

    if (!dossier) {
      return NextResponse.json({ error: "Dossier non trouvé" }, { status: 404 });
    }

    return NextResponse.json(dossier);
  } catch (error) {
    console.error("GET /api/dossiers/[id] error:", error);
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
      dateDebut, dateFin, montantHT, tauxTVA, modalite, statut, notes,
      nomFormateur, nombreParticipants,
      lieuFormationAdresse, lieuFormationCodePostal, lieuFormationVille,
      dureePresIndividuelRealisee, dureePresCollectifRealisee,
      dureeDistSynchroneRealisee, dureeDistAsynchroneRealisee,
      dureePresIndividuel, dureePresCollectif, dureeDistSynchrone, dureeDistAsynchrone,
      modeReglement, dateReglement,
      modalitesDeroulement, modalitesEvaluation, typeCertification,
      typeAction, formationObligatoire, reconversion, formationEnEntreprise,
      // Financement
      typeFinancement, nomFinanceur, montantPriseEnCharge,
      // Remise
      remisePourcent, remiseMontant,
      // Sessions & Évaluation
      joursSession, evaluationNotes, notationGlobale,
    } = body;

    const existing = await prisma.dossier.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Dossier non trouvé" }, { status: 404 });
    }

    const updateData: any = {};

    if (dateDebut !== undefined) {
      const parsedDateDebut = new Date(dateDebut);
      updateData.dateDebut = parsedDateDebut;
      updateData.dateLimiteDepot = calculerDateLimiteDepot(parsedDateDebut);
    }
    if (dateFin !== undefined) {
      const parsedDateFin = new Date(dateFin);
      updateData.dateFin = parsedDateFin;
      updateData.dateLimiteRemboursement = calculerDateLimiteRemboursement(parsedDateFin);
    }

    if (montantHT !== undefined) updateData.montantHT = montantHT;
    if (tauxTVA !== undefined) updateData.tauxTVA = tauxTVA;
    if (modalite !== undefined) updateData.modalite = modalite;
    if (statut !== undefined) updateData.statut = statut;
    if (notes !== undefined) updateData.notes = notes;
    if (typeAction !== undefined) updateData.typeAction = typeAction;
    if (formationObligatoire !== undefined) updateData.formationObligatoire = formationObligatoire;
    if (reconversion !== undefined) updateData.reconversion = reconversion;
    if (formationEnEntreprise !== undefined) updateData.formationEnEntreprise = formationEnEntreprise;
    if (nomFormateur !== undefined) updateData.nomFormateur = nomFormateur || null;
    if (nombreParticipants !== undefined) updateData.nombreParticipants = Number(nombreParticipants);
    if (lieuFormationAdresse !== undefined) updateData.lieuFormationAdresse = lieuFormationAdresse || null;
    if (lieuFormationCodePostal !== undefined) updateData.lieuFormationCodePostal = lieuFormationCodePostal || null;
    if (lieuFormationVille !== undefined) updateData.lieuFormationVille = lieuFormationVille || null;
    if (dureePresIndividuel !== undefined) updateData.dureePresIndividuel = dureePresIndividuel != null ? Number(dureePresIndividuel) : null;
    if (dureePresCollectif !== undefined) updateData.dureePresCollectif = dureePresCollectif != null ? Number(dureePresCollectif) : null;
    if (dureeDistSynchrone !== undefined) updateData.dureeDistSynchrone = dureeDistSynchrone != null ? Number(dureeDistSynchrone) : null;
    if (dureeDistAsynchrone !== undefined) updateData.dureeDistAsynchrone = dureeDistAsynchrone != null ? Number(dureeDistAsynchrone) : null;
    if (dureePresIndividuelRealisee !== undefined) updateData.dureePresIndividuelRealisee = dureePresIndividuelRealisee != null ? Number(dureePresIndividuelRealisee) : null;
    if (dureePresCollectifRealisee !== undefined) updateData.dureePresCollectifRealisee = dureePresCollectifRealisee != null ? Number(dureePresCollectifRealisee) : null;
    if (dureeDistSynchroneRealisee !== undefined) updateData.dureeDistSynchroneRealisee = dureeDistSynchroneRealisee != null ? Number(dureeDistSynchroneRealisee) : null;
    if (dureeDistAsynchroneRealisee !== undefined) updateData.dureeDistAsynchroneRealisee = dureeDistAsynchroneRealisee != null ? Number(dureeDistAsynchroneRealisee) : null;
    if (modeReglement !== undefined) updateData.modeReglement = modeReglement || null;
    if (dateReglement !== undefined) updateData.dateReglement = dateReglement ? new Date(dateReglement) : null;
    if (modalitesDeroulement !== undefined) updateData.modalitesDeroulement = modalitesDeroulement || null;
    if (modalitesEvaluation !== undefined) updateData.modalitesEvaluation = modalitesEvaluation || null;
    if (typeCertification !== undefined) updateData.typeCertification = typeCertification || null;
    // Financement
    if (typeFinancement !== undefined) updateData.typeFinancement = typeFinancement || null;
    if (nomFinanceur !== undefined) updateData.nomFinanceur = nomFinanceur || null;
    if (montantPriseEnCharge !== undefined) updateData.montantPriseEnCharge = montantPriseEnCharge != null ? Number(montantPriseEnCharge) : null;
    // Remise
    if (remisePourcent !== undefined) {
      updateData.remisePourcent = remisePourcent != null && remisePourcent !== "" ? Number(remisePourcent) : null;
    }
    if (remiseMontant !== undefined) {
      updateData.remiseMontant = remiseMontant != null && remiseMontant !== "" ? Number(remiseMontant) : null;
    }
    if (joursSession !== undefined) updateData.joursSession = joursSession ? JSON.stringify(joursSession) : null;
    if (evaluationNotes !== undefined) updateData.evaluationNotes = evaluationNotes ? JSON.stringify(evaluationNotes) : null;
    if (notationGlobale !== undefined) updateData.notationGlobale = notationGlobale || null;

    if (montantHT !== undefined || tauxTVA !== undefined) {
      const finalMontantHT = montantHT ?? existing.montantHT;
      const finalTauxTVA = tauxTVA ?? existing.tauxTVA;
      updateData.montantTTC = finalMontantHT * (1 + finalTauxTVA / 100);
    }

    const dossier = await prisma.dossier.update({
      where: { id },
      data: updateData,
      include: {
        client: true,
        formation: true,
        pieces: true,
        documents: true,
        alertes: true,
      },
    });

    return NextResponse.json(dossier);
  } catch (error) {
    console.error("PUT /api/dossiers/[id] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await prisma.dossier.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Dossier non trouvé" }, { status: 404 });
    }

    await prisma.dossier.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/dossiers/[id] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
