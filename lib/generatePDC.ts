// ─────────────────────────────────────────────────────────────────────────────
// Générateur asynchrone du Plan de Développement des Compétences
// Utilise Claude (si clé dispo) pour produire un tableau cohérent avec la
// formation sélectionnée, sinon parsing des lignes FAMILLE: dans les notes.
// ─────────────────────────────────────────────────────────────────────────────

import Anthropic from "@anthropic-ai/sdk";
import type { DossierData, OrganismeData } from "@/lib/documents";
import { generatePlanDeveloppementCompetences } from "@/lib/documents";

// ─── Types internes ───────────────────────────────────────────────────────────
export interface BlocCompetence {
  titre:     string;   // ex: "Bloc 1 — Fondamentaux IA"
  objectifs: string;   // compétences détaillées visées pour ce bloc
}

export interface JourPlanning {
  jour:       number;   // 1, 2, 3…
  duree_h:    number;   // max 7h
  matin:      string;   // contenu séquence matin
  apres_midi: string;   // contenu séquence après-midi
  bloc:       string;   // référence au titre du bloc de compétence
}

export interface FamillePDC {
  nom:                string;
  effectif:           number;
  postes:             string;
  besoins:            string;
  competences:        string;               // résumé court (1 phrase)
  blocs_competences?: BlocCompetence[];     // détail bloc par bloc
  modalites:          string;               // résumé court (1 phrase)
  planning_jours?:    JourPlanning[];       // planning jour par jour
}

export interface PDCContent {
  intro:     string;
  methodo:   string;
  familles:  FamillePDC[];
}

// ─── Génération des modalités de déroulement (section 6 AGEFICE) ─────────────
export async function generateModalitesDeroulement(dossier: DossierData): Promise<string> {
  const f = dossier.formation;
  const modaliteLabel: Record<string, string> = {
    presentiel:              "présentiel",
    distanciel_synchrone:    "distanciel synchrone (classe virtuelle)",
    distanciel_asynchrone:   "distanciel asynchrone (FOAD)",
    hybride:                 "hybride (présentiel + distanciel)",
    presentiel_distanciel:   "présentiel / distanciel",
  };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    try {
      const client = new Anthropic({ apiKey });
      const prompt = `Tu es un expert en ingénierie pédagogique. Rédige le texte du champ "Modalités de déroulement (assistance technique et pédagogique)" pour le formulaire AGEFICE de demande préalable de financement.

FORMATION
- Intitulé : ${f.intitule}
- Durée : ${f.dureeHeures}h
- Modalité : ${modaliteLabel[f.modalite] || f.modalite}
- Public cible : ${f.publicCible || "Dirigeants et salariés d'entreprise"}
- Objectifs : ${f.objectifs || "Non précisés"}
- Programme : ${f.programme}
- Prérequis : ${f.prerequis || "Aucun"}

CONSIGNES
- Rédige un texte court (3 à 5 phrases maximum)
- Décris concrètement comment se déroule la formation : méthodes pédagogiques, outils, assistance du formateur
- Adapte le ton au mode de déroulement (${modaliteLabel[f.modalite] || f.modalite})
- Mentionne les modalités d'assistance technique et pédagogique pendant la formation
- Style professionnel, administratif, sans bullet points
- Réponds UNIQUEMENT avec le texte (pas de titre, pas de markdown, pas d'explication)`;

      const msg = await client.messages.create({
        model:      "claude-haiku-4-5-20251001",
        max_tokens: 400,
        messages:   [{ role: "user", content: prompt }],
      });

      const text = (msg.content[0] as { text: string }).text.trim();
      if (text.length > 20) {
        console.log("[Modalités] Claude généré:", text.slice(0, 80) + "…");
        return text;
      }
    } catch (err) {
      console.warn("[Modalités] Claude échoué, fallback template :", err);
    }
  }

  // ── Fallback template selon modalité ─────────────────────────────────────
  const isDistanciel = f.modalite.startsWith("distanciel");
  const isHybride    = f.modalite === "hybride" || f.modalite === "presentiel_distanciel";
  const base = isDistanciel
    ? `La formation se déroule en distanciel synchrone via une plateforme de classe virtuelle. Le formateur anime les sessions en temps réel et assure une assistance pédagogique continue par messagerie et lors des créneaux de formation. Les ressources pédagogiques (supports, exercices, enregistrements) sont mises à disposition sur l'espace en ligne dédié à chaque participant.`
    : isHybride
    ? `La formation alterne des séquences en présentiel et des modules à distance. Le formateur assure une présence physique lors des sessions en salle et un accompagnement à distance entre les séances, via une plateforme dédiée. L'assistance pédagogique est assurée tout au long du parcours.`
    : `La formation se déroule en présentiel, animée par un formateur expert. Des apports théoriques, des démonstrations, des exercices pratiques et des mises en situation sont organisés tout au long de la session. Le formateur assure un suivi individualisé et répond aux questions des participants en temps réel.`;

  return base;
}

// ─── Prompt Claude ────────────────────────────────────────────────────────────
function buildPrompt(dossier: DossierData, nomEntreprise: string): string {
  const f = dossier.formation;
  const modaliteLabel: Record<string, string> = {
    presentiel: "Présentiel",
    distanciel_synchrone: "Distanciel synchrone (classe virtuelle)",
    distanciel_asynchrone: "Distanciel asynchrone (FOAD)",
    hybride: "Hybride (présentiel + distanciel)",
    presentiel_distanciel: "Présentiel / Distanciel",
  };

  // Calcul du nombre de jours (max 7h/jour)
  const nbJours = Math.ceil(f.dureeHeures / 7);
  const planningExemple = Array.from({ length: nbJours }, (_, i) => {
    const heuresCeJour = Math.min(7, f.dureeHeures - i * 7);
    const demiH = heuresCeJour / 2;
    return `{"jour":${i+1},"duree_h":${heuresCeJour},"matin":"[Contenu séquence matin — ${demiH}h]","apres_midi":"[Contenu séquence après-midi — ${demiH}h]","bloc":"[Référence au bloc de compétence du jour]"}`;
  }).join(",\n      ");

  return `Tu es un expert RH et ingénierie pédagogique. Génère un Plan de Développement des Compétences (PDC) au format JSON strict.

ENTREPRISE
- Nom : ${nomEntreprise}
- Activité principale : ${dossier.client.activitePrincipale || "non précisée"}
- Nombre total de participants : ${dossier.nombreParticipants}

FORMATION SÉLECTIONNÉE
- Intitulé : ${f.intitule}
- Durée totale : ${f.dureeHeures}h → ${nbJours} jour${nbJours > 1 ? "s" : ""} (maximum 7h/jour)
- Modalité : ${modaliteLabel[f.modalite] || f.modalite}
- Public cible : ${f.publicCible || "Salariés de l'entreprise"}
- Objectifs pédagogiques : ${f.objectifs || "Non précisés"}
- Programme détaillé : ${f.programme || "Non précisé"}
- Prérequis : ${f.prerequis || "Aucun"}

NOTES CONTEXTUELLES
${dossier.notes || "(aucune note additionnelle)"}

RÈGLES IMPÉRATIVES
1. BLOCS DE COMPÉTENCES : Découpe les compétences visées en blocs distincts tirés du programme (1 bloc = 1 module/thème principal). Chaque bloc doit décrire concrètement les savoir-faire acquis pour CETTE famille de métiers.
2. PLANNING JOUR PAR JOUR : Pour chaque famille, génère un planning de ${nbJours} jour${nbJours > 1 ? "s" : ""} MAXIMUM 7h/JOUR. Chaque jour a une séquence matin ET après-midi. Les contenus doivent correspondre au programme de la formation, adaptés aux besoins de la famille.
3. COHÉRENCE : Le nombre total d'heures dans planning_jours doit être égal à ${f.dureeHeures}h.
4. Maximum 5 familles. Si public homogène, 1 seule famille suffit.
5. La somme des effectifs doit égaler ${dossier.nombreParticipants}.

Réponds UNIQUEMENT avec ce JSON (sans markdown, sans explication) :
{
  "intro": "Paragraphe d'introduction (3-5 phrases, spécifique à l'entreprise et à la formation)",
  "methodo": "Commentaire méthodologique (2-4 phrases, justifiant l'approche pédagogique par blocs et par familles)",
  "familles": [
    {
      "nom": "Nom de la famille de métiers",
      "effectif": 0,
      "postes": "Liste des postes concernés",
      "besoins": "Besoins opérationnels identifiés (1-2 phrases)",
      "competences": "Résumé des compétences visées (1 phrase synthétique)",
      "blocs_competences": [
        {
          "titre": "Bloc N — [Thème du bloc issu du programme]",
          "objectifs": "Compétences détaillées visées pour ce bloc, adaptées aux métiers de cette famille (2-3 phrases)"
        }
      ],
      "modalites": "Résumé des modalités (1 phrase : tronc commun + ateliers)",
      "planning_jours": [
        ${planningExemple}
      ]
    }
  ]
}`;
}

// ─── Parsing fallback (notes FAMILLE:) ───────────────────────────────────────
function parseFamillesFromNotes(dossier: DossierData): PDCContent | null {
  const notes = dossier.notes || "";
  const familles: FamillePDC[] = [];
  const f = dossier.formation;

  for (const line of notes.split("\n")) {
    if (line.trim().toUpperCase().startsWith("FAMILLE:")) {
      const raw   = line.replace(/^FAMILLE\s*:/i, "").trim();
      const parts = raw.split("|").map((p) => p.trim());
      if (parts.length >= 2) {
        familles.push({
          nom:         parts[0] || "Ensemble des salariés",
          effectif:    parseInt(parts[1]) || 0,
          postes:      parts[2] || "",
          besoins:     parts[3] || "",
          competences: parts[4] || (f.objectifs?.slice(0, 200) ?? ""),
          modalites:   parts[5] || "Tronc commun + atelier de mise en pratique",
        });
      }
    }
  }

  if (!familles.length) return null;

  const nomEnt = dossier.client.nomCommercial || `${dossier.client.prenom} ${dossier.client.nom}`.trim();
  const total  = familles.reduce((s, fam) => s + fam.effectif, 0);

  return {
    intro:   `Dans le cadre de son plan de développement des compétences, ${nomEnt} souhaite engager l'ensemble des salariés identifiés dans une montée en compétences progressive sur les usages professionnels de l'intelligence artificielle grâce à la formation « ${f.intitule} » (${f.dureeHeures} heures). À ce stade du projet, la base de travail repose sur ${total} salarié${total > 1 ? "s" : ""} répartis selon leurs fonctions au sein de la structure. Le dispositif proposé s'appuie sur un socle commun de formation, complété par des mises en application adaptées aux principales familles de métiers.`,
    methodo: `Le plan de développement des compétences est construit sur l'hypothèse d'un niveau d'entrée débutant pour l'ensemble des salariés. Cette hypothèse justifie la mise en place d'un tronc commun préalable, destiné à apporter à tous les participants une base partagée. À partir de ce socle, la formation est déclinée par familles de métiers, afin de garantir l'adaptation des contenus aux situations de travail rencontrées dans la structure.`,
    familles,
  };
}

// ─── Entrée principale ────────────────────────────────────────────────────────
export async function generatePDCAsync(
  dossier: DossierData,
  organisme: OrganismeData
): Promise<string> {
  const nomEntreprise = dossier.client.nomCommercial
    || `${dossier.client.prenom} ${dossier.client.nom}`.trim();

  // ── 1. Essai Claude ──────────────────────────────────────────────────────
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    try {
      const client = new Anthropic({ apiKey });
      const msg    = await client.messages.create({
        model:      "claude-haiku-4-5-20251001",
        max_tokens: 5000,
        messages:   [{ role: "user", content: buildPrompt(dossier, nomEntreprise) }],
      });

      const raw     = (msg.content[0] as { text: string }).text.trim();
      // Nettoyer si Claude enveloppe dans ```json...```
      const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
      const parsed  = JSON.parse(cleaned) as PDCContent;

      if (parsed.familles && parsed.familles.length > 0) {
        console.log(`[PDC] Claude a généré ${parsed.familles.length} famille(s)`);
        return generatePlanDeveloppementCompetences(dossier, organisme, parsed);
      }
    } catch (err) {
      console.warn("[PDC] Claude échoué, fallback notes/template :", err);
    }
  }

  // ── 2. Fallback : lignes FAMILLE: dans les notes ─────────────────────────
  const fromNotes = parseFamillesFromNotes(dossier);
  if (fromNotes) {
    console.log(`[PDC] Fallback notes : ${fromNotes.familles.length} famille(s)`);
    return generatePlanDeveloppementCompetences(dossier, organisme, fromNotes);
  }

  // ── 3. Fallback final : famille unique générique avec planning ────────────
  const f = dossier.formation;
  const nbJours = Math.ceil(f.dureeHeures / 7);
  // Découper le programme en blocs (lignes non vides, groupées par 3)
  const lignesProg = (f.programme || f.objectifs || "").split("\n").filter((l) => l.trim().length > 0);
  const nbBlocs = Math.max(1, Math.min(nbJours, Math.ceil(lignesProg.length / 3)));
  const blocsGeneric: BlocCompetence[] = Array.from({ length: nbBlocs }, (_, i) => {
    const slice = lignesProg.slice(i * Math.ceil(lignesProg.length / nbBlocs), (i + 1) * Math.ceil(lignesProg.length / nbBlocs));
    return {
      titre:     `Bloc ${i + 1} — ${f.intitule} (partie ${i + 1}/${nbBlocs})`,
      objectifs: slice.join(" ").slice(0, 300) || f.objectifs?.slice(0, 200) || "Compétences visées par la formation",
    };
  });
  const planningGeneric: JourPlanning[] = Array.from({ length: nbJours }, (_, i) => {
    const heures = Math.min(7, f.dureeHeures - i * 7);
    const blocRef = blocsGeneric[Math.min(i, blocsGeneric.length - 1)].titre;
    return {
      jour:       i + 1,
      duree_h:    heures,
      matin:      `${f.intitule} — séquence matin (${(heures / 2).toFixed(1)}h) : apports théoriques et démonstrations`,
      apres_midi: `${f.intitule} — séquence après-midi (${(heures / 2).toFixed(1)}h) : exercices pratiques et mise en situation`,
      bloc:       blocRef,
    };
  });

  const genericContent: PDCContent = {
    intro:   `Dans le cadre de son plan de développement des compétences, ${nomEntreprise} engage ${dossier.nombreParticipants} salarié${dossier.nombreParticipants > 1 ? "s" : ""} dans une montée en compétences sur la formation « ${f.intitule} » (${f.dureeHeures} heures — ${nbJours} jour${nbJours > 1 ? "s" : ""}). Le dispositif s'appuie sur une approche progressive adaptée au contexte opérationnel de la structure.`,
    methodo: `Le dispositif est construit sur un tronc commun structuré en ${nbBlocs} bloc${nbBlocs > 1 ? "s" : ""} de compétences, permettant à l'ensemble des participants d'acquérir les fondamentaux, suivi d'une mise en application concrète sur les situations professionnelles rencontrées. La progression jour par jour respecte une durée maximale de 7 heures par journée de formation.`,
    familles: [{
      nom:               "Ensemble des salariés",
      effectif:          dossier.nombreParticipants,
      postes:            f.publicCible || "Salariés de l'entreprise",
      besoins:           "Monter en compétences sur les usages professionnels liés à la formation",
      competences:       f.objectifs?.slice(0, 250) || "Acquérir les compétences visées par la formation",
      blocs_competences: blocsGeneric,
      modalites:         `Tronc commun ${f.dureeHeures}h réparti sur ${nbJours} jour${nbJours > 1 ? "s" : ""} — max 7h/jour`,
      planning_jours:    planningGeneric,
    }],
  };
  return generatePlanDeveloppementCompetences(dossier, organisme, genericContent);
}
