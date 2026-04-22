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

// DELETE — supprimer un message
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; convId: string; msgId: string }> }
) {
  const { msgId } = await params;
  try {
    await prisma.messageEmail.delete({ where: { id: msgId } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// PATCH — renvoyer un message non envoyé
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; convId: string; msgId: string }> }
) {
  const { msgId } = await params;
  try {
    const msg = await prisma.messageEmail.findUnique({ where: { id: msgId }, include: { attachments: true } });
    if (!msg) return NextResponse.json({ error: "Message introuvable" }, { status: 404 });
    if (msg.direction !== "sortant") return NextResponse.json({ error: "Non applicable" }, { status: 400 });

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

    const mailAttachments = (msg.attachments ?? []).map((a) => ({
      filename: a.nom,
      path: path.join(process.cwd(), "public", a.chemin),
      contentType: a.type,
    }));

    await transporter.sendMail({
      from: `"${cfg.orgNom}" <${cfg.from}>`,
      to: msg.destinataire,
      subject: msg.sujet || "Message",
      html: msg.contenu,
      attachments: mailAttachments,
    });

    const updated = await prisma.messageEmail.update({
      where: { id: msgId },
      data: { envoye: true, dateEnvoi: new Date(), brouillon: false },
    });

    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
