import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const now = new Date();
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  const [
    leads,
    dossiersByStatut,
    dossiersParMois,
    leadsParMois,
  ] = await Promise.all([
    // Tous les leads avec dates
    prisma.lead.findMany({
      select: {
        statut: true,
        dateDecouverte: true,
        dateContact: true,
        dateQualification: true,
        dateInscription: true,
        dateMAJ: true,
      },
    }),
    // Dossiers par statut
    prisma.dossier.groupBy({ by: ["statut"], _count: true }),
    // Dossiers créés par mois (12 derniers mois)
    prisma.dossier.findMany({
      where: { dateCreation: { gte: twelveMonthsAgo } },
      select: { dateCreation: true, statut: true, montantTTC: true },
    }),
    // Leads créés par mois
    prisma.lead.findMany({
      where: { dateDecouverte: { gte: twelveMonthsAgo } },
      select: { dateDecouverte: true, statut: true },
    }),
  ]);

  // ── Répartition leads par statut (camembert) ─────────────────────────────
  const leadsParStatut: Record<string, number> = {};
  for (const l of leads) {
    leadsParStatut[l.statut] = (leadsParStatut[l.statut] ?? 0) + 1;
  }

  // ── Activité mensuelle (12 mois) ─────────────────────────────────────────
  const mois: Record<string, { label: string; dossiers: number; leads: number; montant: number }> = {};
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    mois[key] = {
      label: d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" }),
      dossiers: 0,
      leads: 0,
      montant: 0,
    };
  }
  for (const d of dossiersParMois) {
    const key = `${d.dateCreation.getFullYear()}-${String(d.dateCreation.getMonth() + 1).padStart(2, "0")}`;
    if (mois[key]) {
      mois[key].dossiers++;
      mois[key].montant += d.montantTTC ?? 0;
    }
  }
  for (const l of leadsParMois) {
    const key = `${l.dateDecouverte.getFullYear()}-${String(l.dateDecouverte.getMonth() + 1).padStart(2, "0")}`;
    if (mois[key]) mois[key].leads++;
  }
  const activiteMensuelle = Object.values(mois);

  // ── Durée moyenne par étape de pipeline ──────────────────────────────────
  // Prospect → Contacté : dateContact - dateDecouverte
  const durProspectContact: number[] = [];
  // Contacté → Qualifié : dateQualification - dateContact
  const durContactQualif: number[] = [];
  // Qualifié → Inscrit : dateInscription - dateQualification
  const durQualifInscrit: number[] = [];

  for (const l of leads) {
    if (l.dateContact && l.dateDecouverte) {
      const j = (l.dateContact.getTime() - l.dateDecouverte.getTime()) / 86400000;
      if (j >= 0 && j < 365) durProspectContact.push(j);
    }
    if (l.dateQualification && l.dateContact) {
      const j = (l.dateQualification.getTime() - l.dateContact.getTime()) / 86400000;
      if (j >= 0 && j < 365) durContactQualif.push(j);
    }
    if (l.dateInscription && l.dateQualification) {
      const j = (l.dateInscription.getTime() - l.dateQualification.getTime()) / 86400000;
      if (j >= 0 && j < 365) durQualifInscrit.push(j);
    }
  }

  const avg = (arr: number[]) =>
    arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null;

  const dureesPipeline = [
    { etape: "Prospect → Contacté",         jours: avg(durProspectContact), n: durProspectContact.length },
    { etape: "Contacté → Dossier AGEFICE",  jours: avg(durContactQualif),   n: durContactQualif.length  },
    { etape: "Dossier → Inscrit formation", jours: avg(durQualifInscrit),   n: durQualifInscrit.length  },
  ];

  // ── Répartition dossiers par statut ──────────────────────────────────────
  const dossiersStatut = dossiersByStatut.map((d) => ({
    statut: d.statut,
    count: d._count,
  }));

  return NextResponse.json({
    leadsParStatut,
    activiteMensuelle,
    dureesPipeline,
    dossiersStatut,
  });
}
