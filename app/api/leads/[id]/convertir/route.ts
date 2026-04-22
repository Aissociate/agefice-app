import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) return NextResponse.json({ error: "Lead introuvable" }, { status: 404 });

  // Déjà converti → retourne le clientId existant
  if (lead.clientId) {
    return NextResponse.json({ clientId: lead.clientId, existant: true });
  }

  // Cherche un client existant par siret puis email
  let client = null;
  if (lead.siret) {
    client = await prisma.client.findUnique({ where: { siret: lead.siret } });
  }
  if (!client && lead.email) {
    client = await prisma.client.findFirst({ where: { email: lead.email } });
  }

  if (!client) {
    client = await prisma.client.create({
      data: {
        nom:              lead.nomDirigeant,
        prenom:           lead.prenomDirigeant || "—",
        statutJuridique:  "—",
        siret:            lead.siret    || null,
        codeApe:          lead.codeApe  || "—",
        email:            lead.email    || "—",
        telephone:        lead.telephone   || null,
        adresse:          lead.adresse     || null,
        codePostal:       lead.codePostal  || null,
        ville:            lead.ville       || null,
        nomCommercial:    lead.nomEntreprise,
        activitePrincipale: lead.secteurActivite || null,
      },
    });
  }

  await prisma.lead.update({
    where: { id },
    data: { clientId: client.id, statut: "qualifie" },
  });

  // Importe les notes Google Sheet dans la fiche client
  if (lead.feedbackHumain) {
    const existingNote = await prisma.noteClient.findFirst({
      where: { clientId: client.id, contenu: { startsWith: "[Google Sheet]" } },
    });
    if (existingNote) {
      await prisma.noteClient.update({
        where: { id: existingNote.id },
        data: { contenu: `[Google Sheet]\n${lead.feedbackHumain}` },
      });
    } else {
      await prisma.noteClient.create({
        data: { clientId: client.id, contenu: `[Google Sheet]\n${lead.feedbackHumain}` },
      });
    }
  }

  return NextResponse.json({ clientId: client.id, created: !lead.clientId });
}
