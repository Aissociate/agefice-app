import { NextRequest, NextResponse } from "next/server";
import { prisma as db } from "@/lib/db";
import { enrichirLead } from "@/lib/enrichissement";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const lead = await db.lead.findUnique({ where: { id } });
  if (!lead) {
    return NextResponse.json({ error: "Lead introuvable" }, { status: 404 });
  }

  // Lancer l'enrichissement en cascade
  const resultats = await enrichirLead({
    siren:           lead.siren,
    nomDirigeant:    lead.nomDirigeant,
    prenomDirigeant: lead.prenomDirigeant,
    telephone:       lead.telephone,
    siteWeb:         lead.siteWeb,
    nomEntreprise:   lead.nomEntreprise,
    ville:           lead.ville,
    codePostal:      lead.codePostal,
  });

  // Construire les champs à mettre à jour (uniquement les nouvelles données)
  const updates: Record<string, string | null> = {};
  if (resultats.nomDirigeant)    updates.nomDirigeant    = resultats.nomDirigeant;
  if (resultats.prenomDirigeant) updates.prenomDirigeant = resultats.prenomDirigeant;
  if (resultats.telephone)       updates.telephone       = resultats.telephone;
  if (resultats.siteWeb)         updates.siteWeb         = resultats.siteWeb;

  let leadMisAJour = lead;
  if (Object.keys(updates).length > 0) {
    leadMisAJour = await db.lead.update({ where: { id }, data: updates });
  }

  return NextResponse.json({
    trouve:   Object.keys(updates).length > 0,
    champs:   Object.keys(updates),
    sources:  resultats.sources,
    erreurs:  resultats.erreurs,
    lead:     leadMisAJour,
  });
}
