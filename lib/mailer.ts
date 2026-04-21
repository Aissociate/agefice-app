import nodemailer from "nodemailer";
import { prisma } from "@/lib/db";

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

export async function sendSignatureEmail({
  to,
  toName,
  role,
  docLabel,
  dossierNumero,
  formation,
  signingUrl,
  pdfBuffer,
  pdfFilename,
}: {
  to: string;
  toName: string;
  role: "eleve" | "of";
  docLabel: string;
  dossierNumero: string;
  formation: string;
  signingUrl: string;
  pdfBuffer?: Buffer;
  pdfFilename?: string;
}) {
  const cfg = await getSmtpConfig();

  if (!cfg.host || !cfg.user || !cfg.pass) {
    throw new Error("Configuration SMTP incomplète — vérifiez les Paramètres");
  }

  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.port === 465,
    auth: { user: cfg.user, pass: cfg.pass },
    tls: { rejectUnauthorized: false },
  });

  const roleLabel = role === "eleve" ? "stagiaire" : "organisme de formation";
  const subject = `Signature requise — ${docLabel} · Dossier ${dossierNumero}`;

  const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:system-ui,-apple-system,sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);">
    <!-- Header -->
    <div style="background:#1F4E79;padding:28px 32px;">
      <p style="margin:0;color:#93c5fd;font-size:12px;letter-spacing:.08em;text-transform:uppercase;">Signature électronique</p>
      <h1 style="margin:6px 0 0;color:#fff;font-size:20px;font-weight:700;">${docLabel}</h1>
    </div>
    <!-- Body -->
    <div style="padding:32px;">
      <p style="margin:0 0 16px;color:#374151;font-size:15px;">Bonjour <strong>${toName}</strong>,</p>
      <p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.6;">
        Votre signature est requise en tant que <strong>${roleLabel}</strong> pour le document suivant :
      </p>
      <!-- Info card -->
      <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:10px;padding:16px 20px;margin-bottom:28px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="color:#9ca3af;font-size:12px;padding:4px 0;width:40%;">Dossier</td><td style="color:#111827;font-size:13px;font-weight:600;">${dossierNumero}</td></tr>
          <tr><td style="color:#9ca3af;font-size:12px;padding:4px 0;">Formation</td><td style="color:#111827;font-size:13px;">${formation}</td></tr>
        </table>
      </div>
      <!-- CTA -->
      <div style="text-align:center;margin-bottom:28px;">
        <a href="${signingUrl}" style="display:inline-block;background:#4f46e5;color:#fff;font-size:15px;font-weight:600;padding:14px 32px;border-radius:10px;text-decoration:none;">
          ✍️ Signer le document
        </a>
      </div>
      <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;line-height:1.6;">
        Ce lien est personnel et à usage unique.<br>
        Il enregistre votre empreinte digitale ainsi que l'horodatage.
      </p>
    </div>
    <!-- Footer -->
    <div style="background:#f1f5f9;padding:16px 32px;border-top:1px solid #e5e7eb;">
      <p style="margin:0;color:#9ca3af;font-size:11px;text-align:center;">${cfg.orgNom} · Gestion des formations AGEFICE</p>
    </div>
  </div>
</body>
</html>`;

  await transporter.sendMail({
    from: `"${cfg.orgNom}" <${cfg.from}>`,
    to: `"${toName}" <${to}>`,
    subject,
    html,
    ...(pdfBuffer ? {
      attachments: [{
        filename: pdfFilename ?? "document.pdf",
        content: pdfBuffer,
        contentType: "application/pdf",
      }],
    } : {}),
  });
}
