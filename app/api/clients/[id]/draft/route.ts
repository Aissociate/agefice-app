import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const ACTIONS: Record<string, string> = {
  accueil: "Premier contact / accueil du client",
  relance_depot: "Relance pour dépôt du dossier AGEFICE",
  relance_pieces: "Relance pour pièces manquantes",
  confirmation_accord: "Confirmation d'accord de financement",
  convocation: "Convocation à la formation",
  remboursement: "Suivi remboursement AGEFICE",
  relance_signature: "Relance pour signature d'un document",
  reponse_libre: "Réponse libre à un mail entrant",
  autre: "Autre",
};

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { action, convId, instruction } = body;

  try {
    // Récupérer client + notes + dossiers actifs
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        notes: { orderBy: { updatedAt: "desc" } },
        dossiers: {
          where: { statut: { not: "refuse" } },
          include: { formation: { select: { intitule: true } } },
          orderBy: { dateCreation: "desc" },
          take: 3,
        },
      },
    });

    if (!client) return NextResponse.json({ error: "Client introuvable" }, { status: 404 });

    // Récupérer l'historique de la conversation si fourni
    let historiqueConv = "";
    if (convId) {
      const msgs = await prisma.messageEmail.findMany({
        where: { conversationId: convId },
        orderBy: { createdAt: "asc" },
        take: 10,
      });
      if (msgs.length > 0) {
        historiqueConv = msgs
          .map((m) => `[${m.direction === "entrant" ? "CLIENT" : "NOUS"}] ${m.contenu.replace(/<[^>]+>/g, " ").trim()}`)
          .join("\n\n");
      }
    }

    // Récupérer les paramètres IA
    const iaKeys = ["ia_modele", "ia_prompt_systeme", "ia_temperature", "org_nom", "org_email"];
    const iaParams = await prisma.parametre.findMany({ where: { cle: { in: iaKeys } } });
    const get = (k: string) => iaParams.find((p) => p.cle === k)?.valeur ?? "";

    const modele = get("ia_modele") || "claude-haiku-4-5-20251001";
    const temperature = parseFloat(get("ia_temperature") || "0.7");
    const orgNom = get("org_nom") || "AIssociate";
    const orgEmail = get("org_email") || "";
    const promptSysteme =
      get("ia_prompt_systeme") ||
      `Tu es un assistant administratif expert en gestion de formations professionnelles pour l'AGEFICE. Tu rédiges des emails professionnels, clairs et bienveillants au nom de l'organisme de formation "${orgNom}". Tes emails sont concis, en français, avec une formule de politesse adaptée. Tu n'inventes pas d'informations.`;

    // Construire le prompt utilisateur
    const notesTexte = client.notes.length > 0
      ? client.notes.map((n) => `- ${n.contenu}`).join("\n")
      : "Aucune note";

    const dossiersTexte = client.dossiers.length > 0
      ? client.dossiers
          .map((d) => `• ${d.numero} — ${d.formation?.intitule ?? "?"} — statut: ${d.statut}`)
          .join("\n")
      : "Aucun dossier actif";

    const actionLabel = ACTIONS[action] || action || "Autre";

    const userPrompt = `
## Contexte client
- Nom : ${client.prenom} ${client.nom}
- Entreprise : ${client.nomCommercial || client.statutJuridique}
- SIRET : ${client.siret}
- Email : ${client.email}

## Notes internes sur ce client
${notesTexte}

## Dossiers récents
${dossiersTexte}

## Action à effectuer
${actionLabel}
${instruction ? `\nInstruction complémentaire : ${instruction}` : ""}

${historiqueConv ? `## Historique de la conversation\n${historiqueConv}\n` : ""}

## Tâche
Rédige un email professionnel en HTML simple (balises <p>, <strong>, <br> uniquement) pour cette action.
L'email doit :
- Commencer par "Bonjour ${client.prenom},"
- Être signé avec le nom de l'organisme "${orgNom}"${orgEmail ? ` et l'email ${orgEmail}` : ""}
- Ne contenir aucune information inventée non fournie dans le contexte

Réponds UNIQUEMENT avec le corps HTML de l'email, sans explication ni balises <html>/<body>.
`.trim();

    const response = await anthropic.messages.create({
      model: modele,
      max_tokens: 1024,
      temperature,
      system: promptSysteme,
      messages: [{ role: "user", content: userPrompt }],
    });

    const draft = (response.content[0] as { type: string; text: string }).text;
    return NextResponse.json({ draft, action, modele });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
