import { NextRequest, NextResponse } from "next/server";
import { sendSignatureEmail } from "@/lib/mailer";
import { prisma } from "@/lib/db";

export async function POST(_request: NextRequest) {
  try {
    const emailParam = await prisma.parametre.findUnique({ where: { cle: "smtp_user" } });
    const to = emailParam?.valeur;
    if (!to) {
      return NextResponse.json({ error: "Aucun email configuré dans les paramètres SMTP" }, { status: 400 });
    }

    await sendSignatureEmail({
      to,
      toName: "Administrateur",
      role: "eleve",
      docLabel: "Document de test",
      dossierNumero: "TEST-001",
      formation: "Test de configuration SMTP",
      signingUrl: "https://exemple.com/signer/test",
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
