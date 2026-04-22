import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getImapConfig, fetchInboxReplies, importRepliesToConversations } from "@/lib/imap";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const cfg = await getImapConfig();
  if (!cfg) {
    return NextResponse.json(
      { error: "Configuration IMAP incomplète — renseignez le serveur et le port IMAP dans Paramètres > Email SMTP" },
      { status: 400 }
    );
  }

  try {
    const client = await prisma.client.findUnique({ where: { id }, select: { email: true } });

    // Chercher les réponses des 30 derniers jours
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const messages = await fetchInboxReplies(cfg, since);
    const imported = await importRepliesToConversations(id, messages, client?.email);

    return NextResponse.json({ imported, total: messages.length });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
