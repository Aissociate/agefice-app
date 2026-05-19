/**
 * Stub WebContainer-compatible.
 *
 * Le module original utilise nodemailer (SMTP via TCP brut), incompatible avec
 * Bolt.new / WebContainer. L'envoi d'email est désactivé — déployer sur un
 * environnement Node complet pour réactiver, ou brancher un service HTTP
 * (Resend, Postmark, SendGrid…) côté API.
 */
export async function sendSignatureEmail(_params: {
  to: string;
  toName: string;
  role: "eleve" | "of";
  docLabel: string;
  dossierNumero: string;
  formation: string;
  signingUrl: string;
  pdfBuffer?: Buffer;
  pdfFilename?: string;
}): Promise<void> {
  throw new Error(
    "Envoi email désactivé sur Bolt.new (SMTP/nodemailer non supporté en WebContainer). " +
      "Brancher un service HTTP (Resend, Postmark…) ou déployer hors WebContainer."
  );
}
