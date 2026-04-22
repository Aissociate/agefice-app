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

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const conversations = await prisma.conversationEmail.findMany({
      where: { clientId: id },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        _count: { select: { messages: { where: { lu: false, direction: "entrant" } } } },
      },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json(conversations);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { sujet, contenu, destinataire, expediteur, brouillon, envoyer, attachments } = body;
  // attachments: [{ url, nom, type, taille }]

  if (!sujet || !contenu || !destinataire || !expediteur) {
    return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
  }

  let envoye = false;
  let dateEnvoi: Date | undefined;

  if (envoyer && !brouillon) {
    const cfg = await getSmtpConfig();
    if (!cfg.host || !cfg.user || !cfg.pass) {
      return NextResponse.json({ error: "Configuration SMTP incomplète — vérifiez les Paramètres > Email SMTP" }, { status: 400 });
    }
    try {
      const transporter = nodemailer.createTransport({
        host: cfg.host,
        port: cfg.port,
        secure: cfg.port === 465,
        auth: { user: cfg.user, pass: cfg.pass },
        tls: { rejectUnauthorized: false },
      });
      const mailAttachments = (attachments ?? []).map((a: { url: string; nom: string; type: string }) => ({
        filename: a.nom,
        path: path.join(process.cwd(), "public", a.url),
        contentType: a.type,
      }));
      await transporter.sendMail({
        from: `"${cfg.orgNom}" <${cfg.from}>`,
        to: destinataire,
        subject: sujet,
        html: contenu,
        attachments: mailAttachments,
      });
      envoye = true;
      dateEnvoi = new Date();
    } catch (e) {
      return NextResponse.json({ error: `Erreur SMTP : ${String(e)}` }, { status: 500 });
    }
  }

  try {
    const conv = await prisma.conversationEmail.create({
      data: {
        clientId: id,
        sujet,
        messages: {
          create: {
            direction: "sortant",
            expediteur,
            destinataire,
            sujet,
            contenu,
            brouillon: brouillon ?? false,
            envoye,
            dateEnvoi,
            lu: true,
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
        },
      },
      include: { messages: true },
    });
    return NextResponse.json(conv, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
