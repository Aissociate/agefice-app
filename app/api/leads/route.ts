import { NextRequest, NextResponse } from "next/server";
import { prisma as db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const statut = searchParams.get("statut");
  const secteur = searchParams.get("secteur");
  const score = searchParams.get("score");
  const q = searchParams.get("q");

  const where: Record<string, unknown> = {};
  if (statut) where.statut = statut;
  if (secteur) where.secteurActivite = { contains: secteur };
  if (score) where.scoreLead = parseInt(score);
  if (q) {
    where.OR = [
      { nomEntreprise: { contains: q } },
      { nomDirigeant: { contains: q } },
      { prenomDirigeant: { contains: q } },
      { email: { contains: q } },
    ];
  }

  const leads = await db.lead.findMany({
    where,
    orderBy: { dateDecouverte: "desc" },
  });

  return NextResponse.json(leads);
}

export async function DELETE(req: NextRequest) {
  const body = await req.json();
  const ids: string[] = body.ids || [];
  if (!ids.length) return NextResponse.json({ error: "Aucun id fourni" }, { status: 400 });

  const { count } = await db.lead.deleteMany({ where: { id: { in: ids } } });
  return NextResponse.json({ supprimés: count });
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const lead = await db.lead.create({
    data: {
      nomEntreprise: body.nomEntreprise,
      siret: body.siret || null,
      siren: body.siren || null,
      codeApe: body.codeApe || null,
      secteurActivite: body.secteurActivite || null,
      chiffreAffaires: body.chiffreAffaires
        ? parseFloat(body.chiffreAffaires)
        : null,
      effectif: body.effectif ? parseInt(body.effectif) : null,
      adresse: body.adresse || null,
      codePostal: body.codePostal || null,
      ville: body.ville || null,
      nomDirigeant: body.nomDirigeant,
      prenomDirigeant: body.prenomDirigeant || null,
      telephone: body.telephone || null,
      email: body.email || null,
      descriptionEnjeux: body.descriptionEnjeux || null,
      messagePrepare: body.messagePrepare || null,
      statut: body.statut || "nouveau",
      sourceDonnee: body.sourceDonnee || "manuel",
    },
  });

  return NextResponse.json(lead, { status: 201 });
}
