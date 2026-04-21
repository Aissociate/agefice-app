import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const now = new Date();
    const in15Days = new Date(now);
    in15Days.setDate(in15Days.getDate() + 15);

    // Total dossiers
    const totalDossiers = await prisma.dossier.count();

    // Dossiers grouped by statut
    const dossiersByStatutRaw = await prisma.dossier.groupBy({
      by: ["statut"],
      _count: { statut: true },
    });

    const dossiersByStatut = dossiersByStatutRaw.reduce<Record<string, number>>(
      (acc, row) => {
        acc[row.statut] = row._count.statut;
        return acc;
      },
      {}
    );

    // Urgent dossiers: dateLimiteDepot or dateLimiteRemboursement within 15 days
    // and statut is not terminal (rembourse / refuse)
    const dossierUrgents = await prisma.dossier.findMany({
      where: {
        statut: { notIn: ["rembourse", "refuse"] },
        OR: [
          { dateLimiteDepot: { gte: now, lte: in15Days } },
          { dateLimiteRemboursement: { gte: now, lte: in15Days } },
        ],
      },
      include: { client: true, formation: true },
      orderBy: { dateLimiteDepot: "asc" },
    });

    // Chiffre d'affaires: sum of montantTTC for dossiers in terminal positive statut
    const caResult = await prisma.dossier.aggregate({
      where: { statut: "rembourse" },
      _sum: { montantTTC: true },
    });

    const chiffreAffaires = caResult._sum.montantTTC ?? 0;

    // Recent dossiers: last 5 created
    const recentDossiers = await prisma.dossier.findMany({
      take: 5,
      orderBy: { dateCreation: "desc" },
      include: { client: true, formation: true },
    });

    return NextResponse.json({
      totalDossiers,
      dossiersByStatut,
      dossierUrgents,
      chiffreAffaires,
      recentDossiers,
    });
  } catch (error) {
    console.error("GET /api/dashboard error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
