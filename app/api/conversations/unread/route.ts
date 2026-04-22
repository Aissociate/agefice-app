import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const messages = await prisma.messageEmail.findMany({
      where: {
        direction: "entrant",
        lu: false,
      },
      select: {
        conversation: {
          select: {
            clientId: true,
            client: { select: { prenom: true, nom: true } },
          },
        },
      },
    });

    const byClient = new Map<string, { id: string; nom: string; prenom: string; count: number }>();
    for (const msg of messages) {
      const { clientId, client } = msg.conversation;
      const existing = byClient.get(clientId);
      if (existing) {
        existing.count++;
      } else {
        byClient.set(clientId, { id: clientId, nom: client.nom, prenom: client.prenom, count: 1 });
      }
    }

    const clients = Array.from(byClient.values());
    return NextResponse.json({ total: messages.length, clients });
  } catch {
    return NextResponse.json({ total: 0, clients: [] });
  }
}
