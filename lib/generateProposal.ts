// ─────────────────────────────────────────────────────────────────────────────
// Générateur asynchrone de Proposition Commerciale
// Utilise Claude pour personnaliser le contenu selon le client et la formation
// ─────────────────────────────────────────────────────────────────────────────

import Anthropic from "@anthropic-ai/sdk";
import type { DossierData, OrganismeData } from "@/lib/documents";

export interface ProposalContent {
  memo:           string;   // paragraphe de couverture (contexte client)
  problematique:  string;   // enjeux identifiés chez le client
  approche:       string;   // pourquoi cette formation est la bonne réponse
  phases: {
    titre:        string;
    description:  string;
    livrables:    string[];
  }[];
  benefices:      string[]; // bénéfices concrets attendus (5-7 bullets)
  accroche_fin:   string;   // phrase de clôture percutante
}

// ─── Prompt ──────────────────────────────────────────────────────────────────
function buildPrompt(dossier: DossierData, organisme: OrganismeData): string {
  const f = dossier.client;
  const form = dossier.formation;
  const nomClient = f.nomCommercial || `${f.prenom} ${f.nom}`.trim();
  const modaliteLabel: Record<string, string> = {
    presentiel: "présentiel",
    distanciel_synchrone: "distanciel synchrone (classe virtuelle)",
    distanciel_asynchrone: "distanciel asynchrone (e-learning)",
    hybride: "hybride (présentiel + distanciel)",
    presentiel_distanciel: "présentiel / distanciel",
  };

  return `Tu es un expert en développement commercial et ingénierie pédagogique.
Rédige le contenu personnalisé d'une proposition commerciale de formation professionnelle.

ORGANISME DE FORMATION
- Nom : ${organisme.nom}
- Certifié Qualiopi n° ${organisme.qualiopi || "en cours"}
- Responsable : ${organisme.responsableCivilite} ${organisme.responsablePrenom} ${organisme.responsableNom}, ${organisme.responsableQualite}

CLIENT / ENTREPRISE
- Nom commercial : ${nomClient}
- Dirigeant : ${f.civilite || ""} ${f.prenom} ${f.nom}
- Statut juridique : ${f.statutJuridique}
- SIRET : ${f.siret}
- Activité principale : ${f.activitePrincipale || "non précisée"}
- Niveau de diplôme : ${f.niveauDiplome || "non précisé"}

FORMATION PROPOSÉE
- Intitulé : ${form.intitule}
- Durée : ${form.dureeHeures} heures
- Modalité : ${modaliteLabel[dossier.modalite] || dossier.modalite}
- Objectifs : ${form.objectifs || "non précisés"}
- Programme : ${form.programme || "non précisé"}
- Public cible : ${form.publicCible || "Dirigeants de TPE/PME"}
- Prérequis : ${form.prerequis || "aucun"}
- Certifiant : ${form.certifiant ? "Oui" : "Non"}

CONSIGNES DE RÉDACTION
- Ton commercial, percutant, orienté résultats et ROI
- Langage professionnel mais accessible, sans jargon excessif
- Adapte le contenu au secteur d'activité du client : ${f.activitePrincipale || "activité"}
- Sois concret : parle de gains de temps, d'efficacité, de chiffre d'affaires
- Maximum 3 phases cohérentes avec le programme de formation
- Chaque livrable doit être un résultat tangible et vérifiable

Réponds UNIQUEMENT avec ce JSON (sans markdown, sans explication) :
{
  "memo": "2-3 phrases percutantes présentant le contexte spécifique du client et pourquoi cette formation est une opportunité stratégique pour son activité",
  "problematique": "2-3 phrases décrivant les enjeux/défis concrets auxquels fait face ce type d'entreprise dans son secteur, qui justifient cette formation",
  "approche": "2-3 phrases expliquant comment ${organisme.nom} répond à ces enjeux avec cette formation spécifique, en valorisant la certification Qualiopi et l'approche pédagogique",
  "phases": [
    {
      "titre": "Titre court de la phase (ex: Fondamentaux & Prise en main)",
      "description": "1-2 phrases décrivant ce que le participant maîtrisera à l'issue de cette phase",
      "livrables": ["Livrable concret 1", "Livrable concret 2", "Livrable concret 3"]
    }
  ],
  "benefices": [
    "Bénéfice concret 1 lié au métier du client",
    "Bénéfice concret 2",
    "Bénéfice concret 3",
    "Bénéfice concret 4",
    "Bénéfice concret 5"
  ],
  "accroche_fin": "1 phrase de clôture forte et mémorable, en lien avec l'ambition du client et l'impact de la formation"
}`;
}

// ─── Générateur principal ─────────────────────────────────────────────────────
export async function generateProposalContent(
  dossier: DossierData,
  organisme: OrganismeData
): Promise<ProposalContent> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (apiKey) {
    try {
      const client = new Anthropic({ apiKey });
      const msg = await client.messages.create({
        model:      "claude-haiku-4-5-20251001",
        max_tokens: 2500,
        messages:   [{ role: "user", content: buildPrompt(dossier, organisme) }],
      });

      const raw     = (msg.content[0] as { text: string }).text.trim();
      const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
      const parsed  = JSON.parse(cleaned) as ProposalContent;

      if (parsed.memo && parsed.phases?.length > 0) {
        console.log("[Proposal] Claude généré avec succès");
        return parsed;
      }
    } catch (err) {
      console.warn("[Proposal] Claude échoué, fallback :", err);
    }
  }

  // ── Fallback ────────────────────────────────────────────────────────────────
  const f = dossier.client;
  const form = dossier.formation;
  const nomClient = f.nomCommercial || `${f.prenom} ${f.nom}`.trim();
  const nbJours = Math.ceil(form.dureeHeures / 7);
  const nbPhases = Math.min(3, Math.max(1, nbJours));
  const lignes = (form.programme || form.objectifs || "").split("\n").filter(l => l.trim());

  return {
    memo: `${nomClient} souhaite renforcer ses compétences grâce à la formation « ${form.intitule} » (${form.dureeHeures}h). ${organisme.nom}, organisme certifié Qualiopi, propose un accompagnement sur mesure adapté à son activité.`,
    problematique: `Dans un environnement en constante évolution, les dirigeants de ${f.statutJuridique} comme ${nomClient} font face à des enjeux de montée en compétences croissants. La maîtrise de ${form.intitule.toLowerCase()} représente un avantage concurrentiel déterminant.`,
    approche: `${organisme.nom} déploie une approche pédagogique progressive, certifiée Qualiopi, combinant apports théoriques et mises en pratique directement applicables au contexte de l'entreprise. Chaque session est conçue pour maximiser le retour sur investissement.`,
    phases: Array.from({ length: nbPhases }, (_, i) => ({
      titre: `Phase ${i + 1} — ${form.intitule} (partie ${i + 1}/${nbPhases})`,
      description: lignes.slice(i * Math.ceil(lignes.length / nbPhases), (i + 1) * Math.ceil(lignes.length / nbPhases)).join(". ").slice(0, 200) || `Acquisition et mise en pratique des compétences — étape ${i + 1}`,
      livrables: [
        "Support de formation personnalisé",
        "Exercices pratiques adaptés au contexte métier",
        "Plan d'action individuel",
      ],
    })),
    benefices: [
      `Maîtrise opérationnelle de ${form.intitule}`,
      "Gain de temps et d'efficacité sur les tâches quotidiennes",
      "Compétences immédiatement applicables en entreprise",
      "Attestation de formation reconnue (certifié Qualiopi)",
      `Éligibilité à la prise en charge AGEFICE jusqu'à ${form.plafondAGEFICE ? form.plafondAGEFICE + " €" : "2 000 €"}`,
    ],
    accroche_fin: `Investir dans la formation aujourd'hui, c'est bâtir l'avantage concurrentiel de demain.`,
  };
}
