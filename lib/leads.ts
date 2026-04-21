import Anthropic from "@anthropic-ai/sdk";

// ─────────────────────────────────────────────
// Codes APE ciblés : métiers opérationnels à La Réunion, fortement automatisables
// ─────────────────────────────────────────────
export const APE_CIBLES: Record<string, string> = {
  // Commerce de détail
  "4711B": "Supérette / épicerie",
  "4711C": "Supermarché",
  "4719B": "Commerce de détail alimentaire",
  "4731Z": "Commerce carburant",
  "4741Z": "Commerce d'informatique",
  "4752A": "Commerce de quincaillerie/bricolage",
  "4759A": "Commerce électroménager",
  "4761Z": "Librairie",
  "4771Z": "Commerce habillement",
  "4775Z": "Commerce cosmétiques",
  "4776Z": "Fleuriste / animalerie",
  "4779A": "Commerce de meubles",
  "4789Z": "Commerce marché / vente directe",
  // Restauration & hôtellerie
  "5610A": "Restauration rapide",
  "5610B": "Café / restaurant traditionnel",
  "5621Z": "Traiteur / restauration événementielle",
  "5629A": "Restauration collective",
  "5630Z": "Bar / débit de boissons",
  "5510Z": "Hôtel",
  "5520Z": "Hébergement touristique",
  // BTP / Construction
  "4120A": "Construction maisons individuelles",
  "4120B": "Construction bâtiments",
  "4211Z": "Travaux routiers",
  "4299Z": "Autres travaux de génie civil",
  "4312A": "Travaux terrassement",
  "4321A": "Électricité bâtiment",
  "4322A": "Plomberie / chauffage",
  "4331Z": "Plâtrerie",
  "4332A": "Menuiserie bois",
  "4332C": "Agencement / menuiserie métal",
  "4333Z": "Revêtements sols / murs",
  "4334Z": "Peinture / vitrerie",
  "4339Z": "Autres travaux de finition",
  "4391A": "Travaux couverture",
  "4399A": "Montage structures métalliques",
  // Transport & logistique
  "4941A": "Transports routiers marchandises interurbains",
  "4941B": "Transports de marchandises",
  "4942Z": "Déménagement",
  "5229A": "Messagerie / fret express",
  "5310Z": "Activités de poste",
  // Automobile
  "4511Z": "Commerce de voitures",
  "4520A": "Entretien / réparation auto",
  "4520B": "Carrosserie",
  "4531Z": "Commerce pièces auto",
  "4540Z": "Commerce / réparation motos",
  // Santé & médico-social
  "8621Z": "Médecin généraliste",
  "8623Z": "Chirurgien-dentiste",
  "8690F": "Infirmiers libéraux",
  "8710A": "Hébergement médicalisé adultes",
  "8720A": "Hébergement handicap mental",
  "8730B": "Hébergement personnes âgées",
  // Industrie / Artisanat alimentaire
  "1071A": "Boulangerie",
  "1071B": "Boulangerie-pâtisserie",
  "1072Z": "Pâtisserie",
  "1073Z": "Confiserie",
  "1081Z": "Sucrerie",
  "1082Z": "Chocolaterie",
  "1084Z": "Condiments et assaisonnements",
  "1085Z": "Plats cuisinés",
  "1086Z": "Aliments homogénéisés",
  "1089Z": "Industries alimentaires",
  "1101Z": "Rhum / spiritueux",
  // Services aux entreprises
  "8121Z": "Nettoyage courant bâtiments",
  "8122Z": "Nettoyage industriel",
  "8129A": "Services de désinsectisation",
  "8211Z": "Services administratifs",
  "8219A": "Photocopie / édition bureautique",
  "8220Z": "Centre d'appels",
  "8291Z": "Agences de recouvrement",
  "8292Z": "Conditionnement à façon",
  "8299Z": "Activités de soutien entreprises",
  // Réparation
  "9511Z": "Réparation ordinateurs",
  "9521Z": "Réparation électronique",
  "9522Z": "Réparation électroménager",
  "9523Z": "Réparation chaussures",
  "9524Z": "Réparation meubles",
  "9525Z": "Réparation horlogerie / bijouterie",
  "9529Z": "Réparation biens personnels",
  // Immobilier
  "6820A": "Location logements",
  "6820B": "Location terrains",
  "6831Z": "Agences immobilières",
  "6832A": "Gestion syndicats de copropriété",
  "6832B": "Gestion patrimoine immobilier",
};

export const SECTEURS_LABELS: Record<string, string> = {
  commerce: "Commerce de détail",
  restauration: "Restauration / Hôtellerie",
  btp: "BTP / Construction",
  transport: "Transport / Logistique",
  automobile: "Automobile",
  sante: "Santé / Médico-social",
  agroalimentaire: "Agro-alimentaire / Artisanat",
  services: "Services aux entreprises",
  reparation: "Réparation",
  immobilier: "Immobilier",
};

export const STATUTS_LEAD: Record<string, { label: string; color: string }> = {
  nouveau: { label: "Nouveau", color: "blue" },
  contacte: { label: "Contacté", color: "yellow" },
  repondu: { label: "A répondu", color: "purple" },
  qualifie: { label: "Qualifié", color: "green" },
  disqualifie: { label: "Disqualifié", color: "red" },
};

// Mapping secteur → liste de codes APE (généré depuis APE_CIBLES)
export const SECTEUR_APE_MAP: Record<string, string[]> = {
  commerce:       ["4711B","4711C","4719B","4731Z","4741Z","4752A","4759A","4761Z","4771Z","4775Z","4776Z","4779A","4789Z"],
  restauration:   ["5610A","5610B","5621Z","5629A","5630Z","5510Z","5520Z"],
  btp:            ["4120A","4120B","4211Z","4299Z","4312A","4321A","4322A","4331Z","4332A","4332C","4333Z","4334Z","4339Z","4391A","4399A"],
  transport:      ["4941A","4941B","4942Z","5229A","5310Z"],
  automobile:     ["4511Z","4520A","4520B","4531Z","4540Z"],
  sante:          ["8621Z","8623Z","8690F","8710A","8720A","8730B"],
  agroalimentaire:["1071A","1071B","1072Z","1073Z","1081Z","1082Z","1084Z","1085Z","1086Z","1089Z","1101Z"],
  services:       ["8121Z","8122Z","8129A","8211Z","8219A","8220Z","8291Z","8292Z","8299Z"],
  reparation:     ["9511Z","9521Z","9522Z","9523Z","9524Z","9525Z","9529Z"],
  immobilier:     ["6820A","6820B","6831Z","6832A","6832B"],
};

/** Retourne les codes APE pour les secteurs sélectionnés (tous si liste vide) */
export function getCodesFromSecteurs(secteurs: string[]): string[] {
  if (!secteurs.length) return Object.keys(APE_CIBLES);
  return secteurs.flatMap((s) => SECTEUR_APE_MAP[s] ?? []);
}

// Paramètres de recherche configurables
export interface RechercheParams {
  secteurs: string[];       // clés de SECTEURS_LABELS, [] = tous
  effectifMin: number;      // défaut 4
  effectifMax: number;      // défaut 30
  caMin: number;            // en K€, défaut 500  (filtre client-side)
  caMax: number;            // en K€, défaut 10000
  nombre: number;           // leads demandés, défaut 30
  page: number;             // page Pappers (rotation auto si 0)
}

// ─────────────────────────────────────────────
// Pappers API
// ─────────────────────────────────────────────
interface PappersEntreprise {
  nom_entreprise: string;
  siren: string;
  siret?: string;
  // Pour les entrepreneurs individuels, nom/prénom sont à la racine
  personne_morale?: boolean;
  nom?: string | null;
  prenom?: string | null;
  code_naf?: string;
  libelle_code_naf?: string;
  tranche_effectif?: string;
  effectif?: string;        // ex: "Entre 6 et 9 salariés"
  effectif_min?: number;
  effectif_max?: number;
  chiffre_affaires?: number;
  statut_consolide?: string; // "actif" | "inactif"
  siege?: {
    siret?: string;
    adresse_ligne_1?: string;
    code_postal?: string;
    ville?: string;
  };
  // Vide dans les résultats de recherche — rempli seulement via /entreprise/{siren}
  dirigeants?: Array<{
    nom?: string;
    prenom?: string;
    qualite?: string;
  }>;
}

interface PappersResponse {
  total: number;
  page: number;
  resultats: PappersEntreprise[]; // ← champ réel de l'API
}

// Convertit "4711B" → "47.11B" (format Pappers avec point)
function formatNafCode(code: string): string {
  const c = code.replace(/\s/g, "");
  if (c.length >= 5 && c[4] !== ".") {
    return c.slice(0, 2) + "." + c.slice(2);
  }
  return c;
}

export async function searchLeadsPappers(
  params: Partial<RechercheParams> = {}
): Promise<PappersEntreprise[]> {
  const token = process.env.PAPPERS_API_TOKEN;
  if (!token) throw new Error("PAPPERS_API_TOKEN manquant dans .env");

  const {
    secteurs = [],
    effectifMin = 4,
    effectifMax = 30,
    caMin = 0,
    caMax = Infinity,
    nombre = 30,
    page = 1,
  } = params;

  // Codes APE à partir des secteurs sélectionnés
  const allCodes = getCodesFromSecteurs(secteurs);

  // Rotation sur un sous-ensemble de 10 codes pour varier les résultats
  const start = ((page - 1) * 10) % allCodes.length;
  const slice = [
    ...allCodes.slice(start, start + 10),
    ...allCodes.slice(0, Math.max(0, start + 10 - allCodes.length)),
  ];
  const nafFormatted = slice.map(formatNafCode).join(",");

  const urlParams = new URLSearchParams({
    api_token: token,
    departement: "974",
    code_naf: nafFormatted,
    par_page: String(Math.min(nombre, 100)),
    page: "1",
  });

  const res = await fetch(
    `https://api.pappers.fr/v2/recherche?${urlParams.toString()}`
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Pappers API error ${res.status}: ${err}`);
  }

  const data: PappersResponse = await res.json();
  const caMinEuros = caMin * 1000;
  const caMaxEuros = caMax === Infinity ? Infinity : caMax * 1000;

  // Filtrage client-side : actives + effectif + CA
  return (data.resultats || []).filter((e) => {
    if (e.statut_consolide === "inactif") return false;

    // Filtre effectif
    if (e.effectif_max === 0) return false;
    if (e.effectif_min !== undefined && e.effectif_max !== undefined) {
      if (e.effectif_max < effectifMin || e.effectif_min > effectifMax) return false;
    } else {
      const eff = parseEffectif(e.tranche_effectif);
      if (eff !== null && (eff < effectifMin || eff > effectifMax)) return false;
    }

    // Filtre CA (si la donnée est disponible)
    if (e.chiffre_affaires !== null && e.chiffre_affaires !== undefined) {
      if (e.chiffre_affaires < caMinEuros || e.chiffre_affaires > caMaxEuros) return false;
    }

    return true;
  });
}

export function mapPappersToLead(e: PappersEntreprise) {
  const secteur = getSecteurFromApe(e.code_naf || "");

  // Effectif : préférer effectif_min, sinon parser la tranche
  const effectif =
    e.effectif_min !== undefined
      ? e.effectif_min
      : parseEffectif(e.tranche_effectif);

  // Dirigeant :
  // - Entrepreneur individuel → nom/prénom à la racine
  // - Société → dirigeants[] est vide dans /recherche, on met le nom d'entreprise
  let nomDirigeant = "Dirigeant";
  let prenomDirigeant: string | null = null;
  if (!e.personne_morale && e.nom) {
    nomDirigeant = e.nom;
    prenomDirigeant = e.prenom || null;
  } else if (e.dirigeants && e.dirigeants.length > 0) {
    nomDirigeant = e.dirigeants[0].nom || "Dirigeant";
    prenomDirigeant = e.dirigeants[0].prenom || null;
  }

  return {
    nomEntreprise: e.nom_entreprise,
    siren: e.siren,
    siret: e.siege?.siret || e.siret || null,
    codeApe: e.code_naf || null,
    secteurActivite: secteur,
    chiffreAffaires: e.chiffre_affaires || null,
    effectif,
    adresse: e.siege?.adresse_ligne_1 || null,
    codePostal: e.siege?.code_postal || null,
    ville: e.siege?.ville || "La Réunion",
    nomDirigeant,
    prenomDirigeant,
    telephone: null,
    email: null,
    sourceDonnee: "pappers",
    statut: "nouveau",
  };
}

function parseEffectif(tranche?: string): number | null {
  if (!tranche) return null;
  const map: Record<string, number> = {
    "0": 0, "1": 1, "2": 3, "3": 6, "11": 10,
    "12": 15, "21": 25, "22": 35, "31": 75,
  };
  return map[tranche] ?? null;
}

function getSecteurFromApe(code: string): string {
  if (!code) return "Autre";
  const c = code.replace(/\s/g, "").toUpperCase();
  const label = APE_CIBLES[c];
  if (label) return label;

  const prefix = c.slice(0, 2);
  const n = parseInt(prefix);
  if (n >= 10 && n <= 33) return "Agro-alimentaire / Artisanat";
  if (n >= 41 && n <= 43) return "BTP / Construction";
  if (n === 45) return "Automobile";
  if (n >= 47 && n <= 49) return "Transport / Logistique";
  if (n >= 55 && n <= 56) return "Restauration / Hôtellerie";
  if (n >= 68 && n <= 68) return "Immobilier";
  if (n >= 81 && n <= 82) return "Services aux entreprises";
  if (n >= 86 && n <= 87) return "Santé / Médico-social";
  if (n >= 95 && n <= 95) return "Réparation";
  return "Autre";
}

// ─────────────────────────────────────────────
// Génération IA avec Claude
// ─────────────────────────────────────────────
export async function genererDescriptionEnjeux(
  nomEntreprise: string,
  secteur: string,
  codeApe: string | null,
  effectif: number | null,
  chiffreAffaires: number | null
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return genererDescriptionTemplate(secteur);

  const client = new Anthropic({ apiKey });

  const prompt = `Tu es un expert en transformation digitale et IA pour les PME à La Réunion.

Décris en 3-4 phrases les principaux enjeux business de l'entreprise suivante, en mettant l'accent sur les tâches répétitives et les opportunités d'automatisation par l'IA :

- Entreprise : ${nomEntreprise}
- Secteur : ${secteur}${codeApe ? ` (APE: ${codeApe})` : ""}
- Effectif estimé : ${effectif ? `${effectif} employés` : "entre 4 et 30 employés"}
- CA estimé : ${chiffreAffaires ? `${(chiffreAffaires / 1000).toFixed(0)}K€` : "entre 500K€ et 10M€"}
- Contexte : PME à La Réunion

Réponds uniquement avec la description des enjeux, sans titre ni introduction. Sois concret et orienté terrain.`;

  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    messages: [{ role: "user", content: prompt }],
  });

  return (msg.content[0] as { text: string }).text.trim();
}

function genererDescriptionTemplate(secteur: string): string {
  const templates: Record<string, string> = {
    "Commerce de détail":
      "La gestion des stocks, les commandes fournisseurs, la relation client et les reportings mobilisent une grande partie du temps des équipes. L'IA peut automatiser la réassort, les réponses aux questions clients et le suivi des ventes en temps réel.",
    "Restauration / Hôtellerie":
      "La gestion des réservations, des plannings, des commandes et de la satisfaction client est chronophage et source d'erreurs. L'IA peut optimiser les plannings, automatiser les confirmations et analyser les avis clients.",
    "BTP / Construction":
      "La rédaction des devis, le suivi de chantier, la gestion des sous-traitants et la facturation sont des tâches très consommatrices de temps. L'IA peut automatiser la génération de devis, les relances et le reporting de chantier.",
    "Transport / Logistique":
      "L'optimisation des tournées, le suivi des livraisons et la gestion documentaire sont des enjeux clés. L'IA peut optimiser les routes, automatiser les bons de livraison et alerter en cas d'anomalie.",
    Automobile:
      "La prise de rendez-vous, le suivi des réparations, les relances clients et la gestion des pièces représentent une charge administrative importante. L'IA peut automatiser ces processus et améliorer l'expérience client.",
    "Santé / Médico-social":
      "La gestion des rendez-vous, des dossiers patients, des ordonnances et de la conformité réglementaire est complexe. L'IA peut automatiser les rappels, le tri des dossiers et les reportings de conformité.",
    "Agro-alimentaire / Artisanat":
      "La gestion de la production, des approvisionnements, de la traçabilité et des commandes est critique. L'IA peut automatiser la planification de production et le suivi qualité.",
    "Services aux entreprises":
      "La gestion des missions, des plannings, de la facturation et du suivi client est fragmentée. L'IA peut centraliser et automatiser ces processus pour gagner en efficacité.",
    Réparation:
      "La prise en charge, le diagnostic, le suivi des réparations et la relation client sont peu digitalisés. L'IA peut structurer et automatiser ces flux pour améliorer les délais et la satisfaction.",
    Immobilier:
      "La gestion des mandats, des visites, des baux et de la relation propriétaire/locataire est chronophage. L'IA peut automatiser les relances, générer les documents et analyser le marché.",
  };
  return (
    templates[secteur] ||
    "Les processus administratifs, la gestion client et le reporting mobilisent une grande part des ressources. L'IA peut automatiser ces tâches répétitives et libérer du temps pour le cœur de métier."
  );
}

// ─────────────────────────────────────────────
// Génération du message de prospection (Cialdini)
// ─────────────────────────────────────────────
export async function genererMessageProspection(lead: {
  prenomDirigeant?: string | null;
  nomDirigeant: string;
  nomEntreprise: string;
  secteurActivite?: string | null;
  descriptionEnjeux?: string | null;
  effectif?: number | null;
  chiffreAffaires?: number | null;
}): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const contactUrl =
    process.env.CONTACT_FORM_URL || "https://aissociate.re/contact";

  if (!apiKey) {
    return genererMessageTemplate(lead, contactUrl);
  }

  const client = new Anthropic({ apiKey });

  const prompt = `Tu es un expert en copywriting de prospection commerciale B2B.

Rédige un message de premier contact WhatsApp/SMS pour un dirigeant de PME à La Réunion.
Le message doit être court (max 250 mots), naturel, et utiliser les principes de Robert Cialdini :
1. Personnalisation (sympathie + familiarité)
2. Preuve sociale : "Vos concurrents ont déjà bénéficié de cette aide"
3. Autorité : Le gouvernement français pousse à l'adoption de l'IA, enveloppe minimum 3 000€ disponible
4. Rareté : Places et budget limités
5. Facilitation : Certification Qualiopi n°814211-1, zéro friction administrative
6. CTA clair : Formulaire de contact ${contactUrl}

Infos sur le prospect :
- Prénom : ${lead.prenomDirigeant || "Bonjour"}
- Entreprise : ${lead.nomEntreprise}
- Secteur : ${lead.secteurActivite || "PME"}
- Enjeux identifiés : ${lead.descriptionEnjeux || "automatisation des processus opérationnels"}

Règles :
- Commence par une accroche personnalisée liée aux enjeux du secteur
- Pas d'emojis excessifs (max 2)
- Ton professionnel mais chaleureux
- Termine par le CTA avec le lien
- N'invente pas de statistiques précises, reste sur les enjeux du secteur`;

  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 500,
    messages: [{ role: "user", content: prompt }],
  });

  return (msg.content[0] as { text: string }).text.trim();
}

function genererMessageTemplate(
  lead: {
    prenomDirigeant?: string | null;
    nomDirigeant: string;
    nomEntreprise: string;
    secteurActivite?: string | null;
    descriptionEnjeux?: string | null;
  },
  contactUrl: string
): string {
  const prenom = lead.prenomDirigeant || lead.nomDirigeant;
  const secteur = lead.secteurActivite || "votre secteur";
  const enjeux =
    lead.descriptionEnjeux ||
    "la gestion des processus quotidiens prend beaucoup de temps";

  return `Bonjour ${prenom},

En tant que dirigeant de ${lead.nomEntreprise}, vous savez mieux que quiconque que dans le domaine ${secteur.toLowerCase()}, ${enjeux.toLowerCase().replace(/\.$/, "")}.

De nombreuses entreprises comme la vôtre à La Réunion ont déjà transformé leur activité grâce à l'IA — et profité d'une aide gouvernementale de minimum 3 000€ pour former leurs équipes.

Le gouvernement français a lancé un plan national pour accélérer l'adoption de l'IA dans les PME. Cette enveloppe est accessible dès maintenant, mais les places sont limitées.

Chez AIssociate, nous sommes certifiés Qualiopi (n°814211-1) : nous gérons toute la partie administrative pour vous, sans friction.

👉 Vérifiez votre éligibilité en 2 minutes : ${contactUrl}

À votre disposition pour en discuter,
L'équipe AIssociate`;
}

// ─────────────────────────────────────────────
// WhatsApp deep link
// ─────────────────────────────────────────────
export function genererLienWhatsApp(
  telephone: string,
  message: string
): string {
  const phoneClean = telephone.replace(/[^0-9+]/g, "");
  const phoneIntl = phoneClean.startsWith("0")
    ? "+262" + phoneClean.slice(1)
    : phoneClean;
  const encoded = encodeURIComponent(message);
  return `https://api.whatsapp.com/send?phone=${phoneIntl}&text=${encoded}`;
}
