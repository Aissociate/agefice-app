import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendSignatureEmail } from "@/lib/mailer";
import { htmlToPdf } from "@/lib/htmlToPdf";
import { TYPES_DOCUMENTS } from "@/lib/utils";
import { randomBytes } from "crypto";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const { id, docId } = await params;
    const { role } = await request.json() as { role: "eleve" | "of" };

    const doc = await prisma.document.findFirst({
      where: { id: docId, dossierId: id },
      include: {
        dossier: { include: { client: true, formation: true } },
      },
    });

    if (!doc) {
      return NextResponse.json({ error: "Document non trouvé" }, { status: 404 });
    }

    // Generate tokens if not yet created
    const tokenEleve = doc.tokenEleve ?? randomBytes(24).toString("hex");
    const tokenOF = doc.tokenOF ?? randomBytes(24).toString("hex");
    if (!doc.tokenEleve || !doc.tokenOF) {
      await prisma.document.update({
        where: { id: docId },
        data: { tokenEleve, tokenOF },
      });
    }

    const token = role === "eleve" ? tokenEleve : tokenOF;
    const origin = request.headers.get("origin") ?? request.headers.get("referer")?.replace(/\/$/, "") ?? "";
    const signingUrl = `${origin}/signer/${token}`;

    const { client, formation } = doc.dossier;
    const docLabel = TYPES_DOCUMENTS[doc.type as keyof typeof TYPES_DOCUMENTS] ?? doc.type;
    const pdfFilename = `${doc.dossier.numero}-${doc.type}.pdf`;

    // Générer le PDF si le contenu HTML est disponible
    let pdfBuffer: Buffer | undefined;
    if (doc.contenu) {
      pdfBuffer = await htmlToPdf(doc.contenu);
    }

    if (role === "eleve") {
      if (!client.email) {
        return NextResponse.json({ error: "Le client n'a pas d'email renseigné" }, { status: 400 });
      }
      await sendSignatureEmail({
        to: client.email,
        toName: `${client.prenom} ${client.nom}`,
        role: "eleve",
        docLabel,
        dossierNumero: doc.dossier.numero,
        formation: formation.intitule,
        signingUrl,
        pdfBuffer,
        pdfFilename,
      });
    } else {
      const orgEmailParam = await prisma.parametre.findUnique({ where: { cle: "org_email" } });
      const ofEmail = orgEmailParam?.valeur;
      if (!ofEmail) {
        return NextResponse.json({ error: "Email de l'OF non configuré dans les paramètres" }, { status: 400 });
      }
      const orgNomParam = await prisma.parametre.findUnique({ where: { cle: "org_nom" } });
      await sendSignatureEmail({
        to: ofEmail,
        toName: orgNomParam?.valeur ?? "Formateur",
        role: "of",
        docLabel,
        dossierNumero: doc.dossier.numero,
        formation: formation.intitule,
        signingUrl,
        pdfBuffer,
        pdfFilename,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("POST /email error:", error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
