import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";

export interface ImapConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  tls: boolean;
}

export async function getImapConfig(): Promise<ImapConfig | null> {
  const keys = ["imap_host", "imap_port", "smtp_user", "smtp_pass"];
  const params = await prisma.parametre.findMany({ where: { cle: { in: keys } } });
  const get = (k: string) => params.find((p) => p.cle === k)?.valeur ?? "";

  const host = get("imap_host");
  const user = get("smtp_user");
  const pass = get("smtp_pass");
  if (!host || !user || !pass) return null;

  const port = parseInt(get("imap_port") || "993");
  return { host, port, user, pass, tls: port === 993 };
}

/** Normalise un sujet pour le matching : retire Re:/Fwd: et espaces */
function normalizeSubject(s: string): string {
  return s.replace(/^(re|fwd?)\s*:\s*/gi, "").trim().toLowerCase();
}

export interface FetchedAttachment {
  nom: string;
  type: string;
  taille: number;
  chemin: string; // chemin absolu sur disque
  url: string;    // URL publique
}

export interface FetchedMessage {
  uid: number;
  from: string;
  subject: string;
  text: string;
  date: Date;
  inReplyTo?: string;
  references?: string[];
  attachments: FetchedAttachment[];
}

/**
 * Se connecte à l'inbox IMAP, récupère les emails reçus depuis `since`,
 * parse les pièces jointes, et les retourne pour traitement.
 */
export async function fetchInboxReplies(cfg: ImapConfig, since: Date): Promise<FetchedMessage[]> {
  const client = new ImapFlow({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.tls,
    auth: { user: cfg.user, pass: cfg.pass },
    logger: false,
    tls: { rejectUnauthorized: false },
  });

  const results: FetchedMessage[] = [];
  const uploadDir = path.join(process.cwd(), "public", "uploads", "emails");
  await mkdir(uploadDir, { recursive: true });

  await client.connect();
  try {
    const lock = await client.getMailboxLock("INBOX");
    try {
      const messages = client.fetch({ since }, { envelope: true, source: true });

      for await (const msg of messages) {
        const env = msg.envelope;
        if (!env || !msg.source) continue;

        const parsed = await simpleParser(msg.source);

        const from = env.from?.[0]?.address ?? "";
        const subject = env.subject || "";
        const date = env.date ?? new Date();
        const inReplyTo = typeof env.inReplyTo === "string" ? env.inReplyTo : undefined;
        const references = (env as Record<string, unknown>).references
          ? String((env as Record<string, unknown>).references).split(/\s+/)
          : undefined;

        // Extraire le texte
        const rawText = typeof parsed.text === "string" ? parsed.text : "";
        const rawHtml = typeof parsed.html === "string" ? parsed.html : "";
        let text = rawText || rawHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

        // Sauvegarder les pièces jointes
        const attachments: FetchedAttachment[] = [];
        for (const att of parsed.attachments ?? []) {
          if (!att.content || att.content.length === 0) continue;
          const ext = path.extname(att.filename ?? "").toLowerCase() || ".bin";
          const safeFilename = `${randomUUID()}${ext}`;
          const filePath = path.join(uploadDir, safeFilename);
          await writeFile(filePath, att.content);
          attachments.push({
            nom: att.filename ?? safeFilename,
            type: att.contentType ?? "application/octet-stream",
            taille: att.size ?? att.content.length,
            chemin: filePath,
            url: `/uploads/emails/${safeFilename}`,
          });
        }

        results.push({ uid: msg.uid, from, subject, text, date, inReplyTo, references, attachments });
      }
    } finally {
      lock.release();
    }
  } finally {
    await client.logout();
  }

  return results;
}

/**
 * Pour chaque message fetché, tente de le rattacher à une conversation ouverte
 * du client. Filtre d'abord par email expéditeur (clientEmail) pour éviter
 * qu'un mail d'un autre client ne soit importé dans la mauvaise conversation.
 * Retourne le nombre de nouveaux messages importés.
 */
export async function importRepliesToConversations(
  clientId: string,
  messages: FetchedMessage[],
  clientEmail?: string | null
): Promise<number> {
  if (messages.length === 0) return 0;

  // Filtre par adresse email de l'expéditeur si disponible
  const relevant = clientEmail
    ? messages.filter((m) => m.from.toLowerCase().includes(clientEmail.toLowerCase()))
    : messages;

  if (relevant.length === 0) return 0;

  const conversations = await prisma.conversationEmail.findMany({
    where: { clientId, statut: "ouvert" },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  let imported = 0;

  for (const msg of relevant) {
    const normalizedIncoming = normalizeSubject(msg.subject);

    const matched = conversations.find(
      (conv) => normalizeSubject(conv.sujet) === normalizedIncoming
    );
    if (!matched) continue;

    // Dédup fiable : même expéditeur + même sujet dans cette conversation = déjà importé
    // (la comparaison par date était fausse pour les messages sans dateEnvoi)
    const already = matched.messages.some(
      (m) =>
        m.direction === "entrant" &&
        m.expediteur === msg.from &&
        normalizeSubject(m.sujet ?? "") === normalizeSubject(msg.subject)
    );
    if (already) continue;

    const contenu = msg.text
      .split("\n")
      .map((l) => `<p>${l.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`)
      .join("")
      .replace(/<p><\/p>/g, "");

    const created = await prisma.messageEmail.create({
      data: {
        conversationId: matched.id,
        direction: "entrant",
        expediteur: msg.from,
        destinataire:
          matched.messages.find((m) => m.direction === "sortant")?.expediteur ?? "",
        sujet: msg.subject,
        contenu: contenu || `<p>${msg.text}</p>`,
        dateEnvoi: msg.date,
        lu: false,
        envoye: false,
      },
    });

    // Sauvegarder les pièces jointes en base
    if (msg.attachments.length > 0) {
      await prisma.attachmentEmail.createMany({
        data: msg.attachments.map((a) => ({
          messageId: created.id,
          nom: a.nom,
          type: a.type,
          taille: a.taille,
          chemin: a.url,
        })),
      });
    }

    await prisma.conversationEmail.update({
      where: { id: matched.id },
      data: { updatedAt: new Date() },
    });

    imported++;
  }

  return imported;
}
