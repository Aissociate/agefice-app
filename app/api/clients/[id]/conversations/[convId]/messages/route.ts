import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import nodemailer from "nodemailer";
import path from "path";

async function getSmtpConfig() {
  const keys = ["smtp_host", "smtp_port", "smtp_user", "smtp_pass", "smtp_from", "org_nom"];
  const params = await prisma.parametre.findMany({ where: { cle: { in: keys } } });
  const get = (k: string) => params.find((p) => p.cle === k)?.valeur ?? "";
  return {
    host: get("smtp_host"),
    port: parseInt(get("smtp_port") || "587"),
    user: get("smtp_user"),
    pass: get("smtp_pass"),
    from: get("smtp_from") || get("smtp_user"),
    orgNom: get("org_nom") || "AIssociate",
  };
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string; convId: string }> }) {
  const { convId } = await params;
  try {
    let messages;
    try {
      messages = await prisma.messageEmail.findMany({
        where: { conversationId: convId },
        orderBy: { createdAt: "asc" },
        include: { attachments: true },
      });
    } catch {
      // Fallback si le client Prisma n'a pas encore chargé le nouveau modèle
      messages = await prisma.messageEmail.findMany({
        where: { conversationId: convId },
        orderBy: { createdAt: "asc" },
      });
    }
    await prisma.messageEmail.updateMany({
      where: { conversationId: convId, direction: "entrant", lu: false },
      data: { lu: true },
    });
    return NextResponse.json(messages);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; convId: string }> }) {
  const { convId } = await params;
  const body = await req.json();
  const { direction, expediteur, destinataire, contenu, sujet, brouillon, envoyer, attachments } = body;
  // attachments: [{ url, nom, type, taille }]

  if (!direction || !expediteur || !destinataire || !contenu) {
    return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
  }

  try {
    const conv = await prisma.conversationEmail.findUnique({ where: { id: convId } });
    if (!conv) return NextResponse.json({ error: "Conversation introuvable" }, { status: 404 });

    let dateEnvoi: Date | undefined;
    let envoye = false;

    if (envoyer && direction === "sortant") {
      const cfg = await getSmtpConfig();
      if (!cfg.host || !cfg.user || !cfg.pass) {
        return NextResponse.json({ error: "Configuration SMTP incomplète" }, { status: 400 });
      }
      const transporter = nodemailer.createTransport({
        host: cfg.host,
        port: cfg.port,
        secure: cfg.port === 465,
        auth: { user: cfg.user, pass: cfg.pass },
        tls: { rejectUnauthorized: false },
      });

      // Préparer les pièces jointes Nodemailer
      const mailAttachments = (attachments ?? []).map((a: { url: string; nom: string; type: string }) => ({
        filename: a.nom,
        path: path.join(process.cwd(), "public", a.url),
        contentType: a.type,
      }));

      await transporter.sendMail({
        from: `"${cfg.orgNom}" <${cfg.from}>`,
        to: destinataire,
        subject: sujet || conv.sujet,
        html: contenu,
        attachments: mailAttachments,
      });
      envoye = true;
      dateEnvoi = new Date();
    }

    const msg = await prisma.messageEmail.create({
      data: {
        conversationId: convId,
        direction,
        expediteur,
        destinataire,
        sujet: sujet || conv.sujet,
        contenu,
        brouillon: brouillon ?? false,
        envoye,
        dateEnvoi,
        lu: direction === "sortant",
        attachments: (attachments && attachments.length > 0)
          ? {
              create: attachments.map((a: { url: string; nom: string; type: string; taille: number }) => ({
                nom: a.nom,
                type: a.type,
                taille: a.taille,
                chemin: a.url,
              })),
            }
          : undefined,
      },
      include: { attachments: true },
    });

    await prisma.conversationEmail.update({
      where: { id: convId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json(msg, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
