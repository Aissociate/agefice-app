import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getImapConfig, fetchInboxReplies, importRepliesToConversations } from "@/lib/imap";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST() {
  const cfg = await getImapConfig();
  if (!cfg) {
    return NextResponse.json(
      { error: "Configuration IMAP incomplète — renseignez le serveur IMAP dans Paramètres > Email SMTP" },
      { status: 400 }
    );
  }

  try {
    // Récupérer tous les clients ayant des conversations ouvertes
    const clients = await prisma.client.findMany({
      where: {
        conversations: {
          some: { statut: "ouvert" },
        },
      },
      select: { id: true, prenom: true, nom: true, email: true },
    });

    if (clients.length === 0) {
      return NextResponse.json({ imported: 0, clients: 0, message: "Aucune conversation ouverte" });
    }

    // Fetch IMAP une seule fois (tous les mails des 30 derniers jours)
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const messages = await fetchInboxReplies(cfg, since);

    // Importer pour chaque client
    let totalImported = 0;
    for (const client of clients) {
      const imported = await importRepliesToConversations(client.id, messages, client.email);
      totalImported += imported;
    }

    // Mettre à jour l'horodatage de la dernière synchro
    await prisma.parametre.upsert({
      where: { cle: "imap_last_sync" },
      update: { valeur: new Date().toISOString() },
      create: { cle: "imap_last_sync", valeur: new Date().toISOString(), categorie: "email" },
    });

    return NextResponse.json({
      imported: totalImported,
      clients: clients.length,
      messages: messages.length,
      syncedAt: new Date().toISOString(),
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function GET() {
  try {
    const p = await prisma.parametre.findFirst({ where: { cle: "imap_last_sync" } });
    return NextResponse.json({ lastSync: p?.valeur ?? null });
  } catch {
    return NextResponse.json({ lastSync: null });
  }
}
