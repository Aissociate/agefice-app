import { NextRequest, NextResponse } from "next/server";
import { prisma as db } from "@/lib/db";
import { genererMessageProspection, genererDescriptionEnjeux } from "@/lib/leads";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const lead = await db.lead.findUnique({ where: { id } });
  if (!lead) return NextResponse.json({ error: "Lead introuvable" }, { status: 404 });

  // Génère la description si absente
  let descriptionEnjeux = lead.descriptionEnjeux;
  if (!descriptionEnjeux) {
    descriptionEnjeux = await genererDescriptionEnjeux(
      lead.nomEntreprise,
      lead.secteurActivite || "PME",
      lead.codeApe,
      lead.effectif,
      lead.chiffreAffaires
    );
  }

  const message = await genererMessageProspection({
    prenomDirigeant: lead.prenomDirigeant,
    nomDirigeant: lead.nomDirigeant,
    nomEntreprise: lead.nomEntreprise,
    secteurActivite: lead.secteurActivite,
    descriptionEnjeux,
    effectif: lead.effectif,
    chiffreAffaires: lead.chiffreAffaires,
  });

  const updated = await db.lead.update({
    where: { id },
    data: { messagePrepare: message, descriptionEnjeux },
  });

  return NextResponse.json({ message, lead: updated });
}
