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

    let toEmail: string;
    let toName: string;

    if (role === "eleve") {
      if (!client.email) {
        return NextResponse.json({ error: "Le client n'a pas d'email renseigné" }, { status: 400 });
      }
      toEmail = client.email;
      toName = `${client.prenom} ${client.nom}`;
      await sendSignatureEmail({
        to: toEmail,
        toName,
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
      toEmail = ofEmail;
      toName = orgNomParam?.valeur ?? "Formateur";
      await sendSignatureEmail({
        to: toEmail,
        toName,
        role: "of",
        docLabel,
        dossierNumero: doc.dossier.numero,
        formation: formation.intitule,
        signingUrl,
        pdfBuffer,
        pdfFilename,
      });
    }

    // Log the sent email in a dedicated administrative conversation for the client
    const smtpParams = await prisma.parametre.findMany({ where: { cle: { in: ["smtp_from", "smtp_user", "org_nom"] } } });
    const getP = (k: string) => smtpParams.find((p) => p.cle === k)?.valeur ?? "";
    const fromEmail = getP("smtp_from") || getP("smtp_user") || "noreply@agefice.fr";
    const orgNomForLog = getP("org_nom") || "AIssociate";
    const convSubject = `[Dossier ${doc.dossier.numero}] Correspondance administrative`;

    const existingConv = await prisma.conversationEmail.findFirst({
      where: { clientId: client.id, sujet: convSubject },
    });

    const convId = existingConv?.id ?? (await prisma.conversationEmail.create({
      data: { clientId: client.id, sujet: convSubject },
    })).id;

    await prisma.messageEmail.create({
      data: {
        conversationId: convId,
        direction: "sortant",
        expediteur: `"${orgNomForLog}" <${fromEmail}>`,
        destinataire: toEmail,
        sujet: `Signature requise — ${docLabel} — Dossier ${doc.dossier.numero}`,
        contenu: `Demande de signature envoyée à ${toName} pour le document : ${docLabel}. Lien de signature : ${signingUrl}`,
        envoye: true,
        dateEnvoi: new Date(),
        lu: true,
      },
    });

    await prisma.conversationEmail.update({
      where: { id: convId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("POST /email error:", error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
