import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  calculerDateLimiteDepot,
  calculerDateLimiteRemboursement,
  generateNumero,
} from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const statut = searchParams.get("statut");
    const clientId = searchParams.get("clientId");

    const where: any = {};
    if (statut) where.statut = statut;
    if (clientId) where.clientId = clientId;

    const dossiers = await prisma.dossier.findMany({
      where,
      orderBy: { dateCreation: "desc" },
      include: {
        client: true,
        formation: true,
        pieces: true,
        documents: true,
        alertes: true,
      },
    });

    return NextResponse.json(dossiers);
  } catch (error) {
    console.error("GET /api/dossiers error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      clientId,
      formationId,
      dateDebut,
      dateFin,
      montantHT,
      tauxTVA,
      modalite,
      typeAction,
      formationObligatoire,
      reconversion,
      formationEnEntreprise,
      nomFormateur,
      nombreParticipants,
      lieuFormationAdresse,
      lieuFormationCodePostal,
      lieuFormationVille,
      dureePresIndividuel,
      dureePresCollectif,
      dureeDistSynchrone,
      dureeDistAsynchrone,
      modalitesDeroulement,
      modalitesEvaluation,
      typeCertification,
      notes,
      typeFinancement, nomFinanceur, montantPriseEnCharge, remisePourcent, remiseMontant,
      joursSession, evaluationNotes, notationGlobale,
    } = body;

    if (!clientId || !formationId || !dateDebut || !dateFin || montantHT == null || !modalite) {
      return NextResponse.json(
        { error: "Champs obligatoires manquants: clientId, formationId, dateDebut, dateFin, montantHT, modalite" },
        { status: 400 }
      );
    }

    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) {
      return NextResponse.json({ error: "Client non trouvé" }, { status: 404 });
    }

    const formation = await prisma.formation.findUnique({ where: { id: formationId } });
    if (!formation) {
      return NextResponse.json({ error: "Formation non trouvée" }, { status: 404 });
    }

    const parsedDateDebut = new Date(dateDebut);
    const parsedDateFin = new Date(dateFin);
    const tva = tauxTVA ?? 0;
    const montantTTC = montantHT * (1 + tva / 100);
    const dateLimiteDepot = calculerDateLimiteDepot(parsedDateDebut);
    const dateLimiteRemboursement = calculerDateLimiteRemboursement(parsedDateFin);
    const numero = generateNumero();

    const dossier = await prisma.dossier.create({
      data: {
        numero,
        clientId,
        formationId,
        dateDebut: parsedDateDebut,
        dateFin: parsedDateFin,
        montantHT,
        tauxTVA: tva,
        montantTTC,
        modalite,
        typeAction: typeAction || "formation",
        formationObligatoire: formationObligatoire ?? false,
        reconversion: reconversion ?? false,
        formationEnEntreprise: formationEnEntreprise ?? false,
        nomFormateur: nomFormateur || null,
        nombreParticipants: nombreParticipants ?? 1,
        lieuFormationAdresse: lieuFormationAdresse || null,
        lieuFormationCodePostal: lieuFormationCodePostal || null,
        lieuFormationVille: lieuFormationVille || null,
        dureePresIndividuel: dureePresIndividuel != null ? Number(dureePresIndividuel) : null,
        dureePresCollectif: dureePresCollectif != null ? Number(dureePresCollectif) : null,
        dureeDistSynchrone: dureeDistSynchrone != null ? Number(dureeDistSynchrone) : null,
        dureeDistAsynchrone: dureeDistAsynchrone != null ? Number(dureeDistAsynchrone) : null,
        modalitesDeroulement: modalitesDeroulement || null,
        modalitesEvaluation: modalitesEvaluation || null,
        typeCertification: typeCertification || null,
        typeFinancement: typeFinancement || null,
        nomFinanceur: nomFinanceur || null,
        montantPriseEnCharge: montantPriseEnCharge != null ? Number(montantPriseEnCharge) : null,
        remisePourcent: remisePourcent != null && remisePourcent !== "" ? Number(remisePourcent) : null,
        remiseMontant: remiseMontant != null && remiseMontant !== "" ? Number(remiseMontant) : null,
        joursSession: joursSession ? JSON.stringify(joursSession) : null,
        evaluationNotes: evaluationNotes ? JSON.stringify(evaluationNotes) : null,
        notationGlobale: notationGlobale || null,
        statut: "en_preparation",
        dateLimiteDepot,
        dateLimiteRemboursement,
        notes,
        pieces: {
          create: [
            { typePiece: "identite", statut: "manquante" },
            { typePiece: "attestation_cfp", statut: "manquante" },
            { typePiece: "kbis_sirene", statut: "manquante" },
          ],
        },
      },
      include: {
        client: true,
        formation: true,
        pieces: true,
        documents: true,
        alertes: true,
      },
    });

    return NextResponse.json(dossier, { status: 201 });
  } catch (error) {
    console.error("POST /api/dossiers error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
