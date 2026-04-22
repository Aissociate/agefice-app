import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const year  = parseInt(searchParams.get("year")  ?? String(new Date().getFullYear()));
  const month = parseInt(searchParams.get("month") ?? String(new Date().getMonth() + 1));

  const from = new Date(year, month - 1, 1);
  const to   = new Date(year, month, 1);

  const sessions = await prisma.sessionFormation.findMany({
    where: { dateDebut: { gte: from, lt: to } },
    include: {
      lead: { select: { id: true, nomEntreprise: true, nomDirigeant: true, prenomDirigeant: true } },
    },
    orderBy: { dateDebut: "asc" },
  });

  return NextResponse.json(sessions);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const session = await prisma.sessionFormation.create({
    data: {
      leadId:   body.leadId,
      titre:    body.titre,
      dateDebut: new Date(body.dateDebut),
      dateFin:   new Date(body.dateFin),
      lieu:     body.lieu   || null,
      notes:    body.notes  || null,
      statut:   body.statut ?? "planifie",
    },
    include: {
      lead: { select: { id: true, nomEntreprise: true, nomDirigeant: true, prenomDirigeant: true } },
    },
  });
  return NextResponse.json(session);
}
