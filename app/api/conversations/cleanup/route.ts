import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function POST() {
  try {
    let deletedDuplicates = 0;
    let deletedWrongRecipient = 0;

    // ── 1. Doublons ──────────────────────────────────────────────────────────
    // Pour chaque conversation, on cherche les messages entrants ayant le même
    // expéditeur et une date d'arrivée à moins de 60 secondes d'un autre.
    const conversations = await prisma.conversationEmail.findMany({
      select: { id: true },
    });

    for (const conv of conversations) {
      const msgs = await prisma.messageEmail.findMany({
        where: { conversationId: conv.id, direction: "entrant" },
        orderBy: { createdAt: "asc" },
        select: { id: true, expediteur: true, createdAt: true },
      });

      const toDelete = new Set<string>();
      for (let i = 0; i < msgs.length; i++) {
        if (toDelete.has(msgs[i].id)) continue;
        for (let j = i + 1; j < msgs.length; j++) {
          if (toDelete.has(msgs[j].id)) continue;
          const sameFrom = msgs[i].expediteur === msgs[j].expediteur;
          const diff = Math.abs(
            new Date(msgs[i].createdAt).getTime() - new Date(msgs[j].createdAt).getTime()
          );
          if (sameFrom && diff < 60_000) {
            toDelete.add(msgs[j].id); // garde le premier (i), supprime le suivant (j)
          }
        }
      }

      if (toDelete.size > 0) {
        await prisma.messageEmail.deleteMany({ where: { id: { in: [...toDelete] } } });
        deletedDuplicates += toDelete.size;
      }
    }

    // ── 2. Mauvais destinataire ───────────────────────────────────────────────
    // Pour chaque message entrant, vérifie que l'expéditeur correspond à l'email
    // du client associé à la conversation. Si non, supprime.
    const incoming = await prisma.messageEmail.findMany({
      where: { direction: "entrant" },
      select: {
        id: true,
        expediteur: true,
        conversation: {
          select: {
            client: { select: { email: true } },
          },
        },
      },
    });

    const wrongIds: string[] = [];
    for (const msg of incoming) {
      const clientEmail = msg.conversation?.client?.email;
      if (!clientEmail) continue;
      // L'expéditeur doit contenir l'email du client (gère "Prénom NOM <email@...>")
      if (!msg.expediteur.toLowerCase().includes(clientEmail.toLowerCase())) {
        wrongIds.push(msg.id);
      }
    }

    if (wrongIds.length > 0) {
      await prisma.messageEmail.deleteMany({ where: { id: { in: wrongIds } } });
      deletedWrongRecipient = wrongIds.length;
    }

    return NextResponse.json({
      deletedDuplicates,
      deletedWrongRecipient,
      total: deletedDuplicates + deletedWrongRecipient,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
