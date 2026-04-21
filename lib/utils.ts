import { type ClassValue, clsx } from "clsx";
import { addDays, subDays, addMonths, differenceInDays, format } from "date-fns";
import { fr } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return inputs.join(" ").replace(/\s+/g, " ").trim();
}

// AGEFICE rules:
// Dossier must be filed at least 15 days before training start (max 4 months before)
// Reimbursement request must be sent within 4 months after training end
export function calculerDateLimiteDepot(dateDebut: Date): Date {
  return subDays(dateDebut, 15);
}

export function calculerDateLimiteRemboursement(dateFin: Date): Date {
  return addMonths(dateFin, 4);
}

export function joursRestants(dateEcheance: Date): number {
  return differenceInDays(dateEcheance, new Date());
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "dd/MM/yyyy", { locale: fr });
}

export function formatDatetime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "dd/MM/yyyy HH:mm", { locale: fr });
}

export function formatMontant(montant: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(montant);
}

export function nombreEnLettres(n: number): string {
  // Simple implementation for common amounts
  const units = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf",
    "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"];
  const tens = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante", "quatre-vingt", "quatre-vingt"];

  if (n === 0) return "zéro";
  if (n < 0) return "moins " + nombreEnLettres(-n);

  const euros = Math.floor(n);
  const cents = Math.round((n - euros) * 100);

  function convert(num: number): string {
    if (num === 0) return "";
    if (num < 20) return units[num];
    if (num < 100) {
      const t = Math.floor(num / 10);
      const u = num % 10;
      if (t === 7) return "soixante-" + units[10 + u];
      if (t === 9) return "quatre-vingt-" + units[u];
      return tens[t] + (u === 1 && t !== 8 ? "-et-" : u > 0 ? "-" : "") + units[u];
    }
    if (num < 1000) {
      const h = Math.floor(num / 100);
      const r = num % 100;
      return (h === 1 ? "cent" : units[h] + "-cent") + (r > 0 ? "-" + convert(r) : "");
    }
    const k = Math.floor(num / 1000);
    const r = num % 1000;
    return (k === 1 ? "mille" : convert(k) + "-mille") + (r > 0 ? "-" + convert(r) : "");
  }

  const euroStr = convert(euros) + (euros > 1 ? " euros" : " euro");
  if (cents === 0) return euroStr;
  return euroStr + " et " + convert(cents) + (cents > 1 ? " centimes" : " centime");
}

export const STATUTS_DOSSIER = {
  en_preparation: { label: "En préparation", color: "bg-gray-100 text-gray-700", badge: "gray" },
  depose: { label: "Déposé", color: "bg-blue-100 text-blue-700", badge: "blue" },
  accord: { label: "Accord de prise en charge", color: "bg-cyan-100 text-cyan-700", badge: "cyan" },
  en_cours: { label: "Formation en cours", color: "bg-yellow-100 text-yellow-700", badge: "yellow" },
  termine: { label: "Formation terminée", color: "bg-orange-100 text-orange-700", badge: "orange" },
  remboursement_demande: { label: "Remboursement demandé", color: "bg-purple-100 text-purple-700", badge: "purple" },
  rembourse: { label: "Remboursé", color: "bg-green-100 text-green-700", badge: "green" },
  refuse: { label: "Refusé / Clôturé", color: "bg-red-100 text-red-700", badge: "red" },
} as const;

export type StatutDossier = keyof typeof STATUTS_DOSSIER;

export const TRANSITIONS_STATUT: Record<StatutDossier, StatutDossier[]> = {
  en_preparation: ["depose", "refuse"],
  depose: ["accord", "refuse"],
  accord: ["en_cours", "refuse"],
  en_cours: ["termine", "refuse"],
  termine: ["remboursement_demande", "refuse"],
  remboursement_demande: ["rembourse", "refuse"],
  rembourse: [],
  refuse: [],
};

export const TYPES_PIECES = {
  identite: "Pièce d'identité avec signature (< 10 ans)",
  attestation_cfp: "Attestation de versement CFP (URSSAF)",
  kbis_sirene: "Extrait Kbis ou avis de situation SIRENE",
} as const;

export const TYPES_DOCUMENTS = {
  proposition_commerciale: "Proposition commerciale",
  devis: "Devis",
  formulaire: "Demande préalable de financement AGEFICE",
  convention: "Convention de formation",
  convocation: "Convocation à la formation (Qualiopi)",
  programme: "Programme détaillé de formation",
  feuille_emargement: "Feuille d'émargement",
  evaluation: "Évaluation des acquis + satisfaction (Qualiopi)",
  attestation: "Attestation d'assiduité et de règlement",
  facture: "Facture acquittée",
  plan_developpement_competences: "Plan de développement des compétences",
} as const;

export const TYPES_FINANCEMENT = {
  agefice: "AGEFICE",
  cpf: "CPF (Compte Personnel de Formation)",
  opco: "OPCO (Opérateur de compétences)",
  region: "Région / Collectivité territoriale",
  france_travail: "France Travail (ex Pôle Emploi)",
  autofinancement: "Autofinancement",
  autre: "Autre financeur",
} as const;

export const MODALITES = {
  presentiel: "Présentiel",
  distanciel_synchrone: "Distanciel synchrone (classe virtuelle)",
  distanciel_asynchrone: "Distanciel asynchrone (FOAD)",
  hybride: "Hybride",
} as const;

export const TYPES_ACTION = {
  formation: "Action de formation",
  bilan: "Bilan de compétences",
  vae: "Validation des acquis de l'expérience",
  autre: "Autre",
} as const;

export const MODULES = {
  initiation: "Initiation",
  mise_a_jour: "Mise à jour",
  perfectionnement: "Perfectionnement",
} as const;

export const THEMATIQUES = {
  numerique: "Compétences numériques",
  langues: "Langues",
  commercial: "Commercial et marketing",
  gestion: "Gestion et comptabilité",
  rh: "Ressources humaines",
  management: "Management",
  juridique: "Juridique",
  securite: "Sécurité",
  autre: "Autre",
} as const;

export const TYPES_QUALIFICATION = {
  sans: "Sans qualification",
  attestation: "Attestation de fin de stage",
  diplome_etat: "Diplôme d'État",
  titre_homol: "Titre homologué",
  qualification_branche: "Qualification de branche",
  cqp: "CQP",
  rncp: "Certification RNCP / Répertoire spécifique",
} as const;

export const TYPES_CERTIFICATION = {
  attestation: "Attestation de fin de stage",
  rncp: "Certification RNCP ou Répertoire spécifique",
  diplome_etat: "Diplôme d'État",
  autre_diplome: "Autre diplôme",
} as const;

export const NIVEAUX_DIPLOME = {
  bac5: "Bac+5 : Sup. à la maîtrise",
  bac3: "Bac+3 : Licence ou maîtrise",
  bac2: "Bac+2 : BTS-DUT-DEUG",
  bac_pro: "Bac / Bac pro-BT-BP",
  bep_cap: "BEP-CAP",
  fin_scolarite: "Fin de scolarité obligatoire",
} as const;

export const ANCIENNETES_DIRECTION = {
  moins_1an: "Moins d'1 an",
  "1_3ans": "Entre 1 et 3 ans",
  "4_10ans": "Entre 4 et 10 ans",
  plus_10ans: "Plus de 10 ans",
} as const;

export const MODALITES_EVALUATION = {
  questionnaires: "Questionnaires / quiz",
  travaux: "Contrôle continu / travaux",
  releves: "Relevés (connexions, fréquentation)",
  emargement: "Feuilles de présence",
  autre: "Autre",
} as const;

export const MODES_REGLEMENT = {
  virement: "Virement bancaire",
  cheque: "Chèque",
  prelevement: "Prélèvement",
  especes: "Espèces",
  carte: "Carte bancaire",
} as const;

export function generateNumero(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `AGF-${year}${month}-${rand}`;
}

export function getUrgenceColor(jours: number): string {
  if (jours < 0) return "text-red-600 font-bold";
  if (jours <= 7) return "text-red-500 font-semibold";
  if (jours <= 15) return "text-orange-500 font-semibold";
  if (jours <= 30) return "text-yellow-600";
  return "text-green-600";
}
