import { format } from "date-fns";
import { fr } from "date-fns/locale";

function fmt(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "dd/MM/yyyy", { locale: fr });
}

function fmtMontant(n: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
}

function nombreEnLettres(n: number): string {
  const units = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf",
    "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"];
  const tens = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante", "quatre-vingt", "quatre-vingt"];
  if (n === 0) return "zéro";
  function conv(num: number): string {
    if (num === 0) return "";
    if (num < 20) return units[num];
    if (num < 100) {
      const t = Math.floor(num / 10), u = num % 10;
      if (t === 7) return "soixante-" + units[10 + u];
      if (t === 9) return "quatre-vingt" + (u > 0 ? "-" + units[u] : "s");
      return tens[t] + (u === 1 && t !== 8 ? "-et-" : u > 0 ? "-" : (t === 8 ? "s" : "")) + (u > 0 ? units[u] : "");
    }
    if (num < 1000) {
      const h = Math.floor(num / 100), r = num % 100;
      return (h === 1 ? "cent" : conv(h) + " cent") + (r > 0 ? " " + conv(r) : (h > 1 ? "s" : ""));
    }
    const k = Math.floor(num / 1000), r = num % 1000;
    return (k === 1 ? "mille" : conv(k) + " mille") + (r > 0 ? " " + conv(r) : "");
  }
  const euros = Math.floor(n);
  const cents = Math.round((n - euros) * 100);
  const euroStr = conv(euros) + (euros > 1 ? " euros" : " euro");
  if (cents === 0) return euroStr;
  return euroStr + " et " + conv(cents) + (cents > 1 ? " centimes" : " centime");
}

const MODALITES_LABEL: Record<string, string> = {
  presentiel: "Présentiel",
  distanciel_synchrone: "Distanciel synchrone (classe virtuelle)",
  distanciel_asynchrone: "Distanciel asynchrone (FOAD)",
  hybride: "Hybride (présentiel + distanciel)",
  presentiel_distanciel: "Présentiel / Distanciel",
};

const TYPES_ACTION_LABEL: Record<string, string> = {
  formation: "Action de formation",
  bilan: "Bilan de compétences",
  vae: "Validation des acquis de l'expérience",
  autre: "Autre",
};

const TYPES_CERTIFICATION_LABEL: Record<string, string> = {
  attestation: "Attestation de fin de stage",
  rncp: "Certification RNCP ou Répertoire spécifique",
  diplome_etat: "Diplôme d'État",
  autre_diplome: "Autre diplôme",
};

export interface OrganismeData {
  nom: string;
  siret: string;
  nda: string;
  qualiopi: string;
  dreets: string;
  adresse: string;
  codePostal: string;
  ville: string;
  email: string;
  telephone: string;
  tva: string;
  site: string;
  responsableCivilite: string;
  responsableNom: string;
  responsablePrenom: string;
  responsableQualite: string;
  responsableTel: string;
  responsableMail: string;
  pointAccueilNom: string;
  pointAccueilNumero: string;
  pointAccueilInterlocuteur: string;
  pointAccueilAdresse: string;
  pointAccueilCodePostal: string;
  pointAccueilVille: string;
  pointAccueilTel: string;
  pointAccueilMail: string;
  iban?: string;
}

export interface DossierData {
  numero: string;
  statut: string;
  typeAction: string;
  formationObligatoire: boolean;
  reconversion: boolean;
  formationEnEntreprise: boolean;
  dateDebut: Date | string;
  dateFin: Date | string;
  dateLimiteDepot: Date | string;
  dateLimiteRemboursement: Date | string;
  montantHT: number;
  tauxTVA: number;
  montantTTC: number;
  modalite: string;
  nomFormateur: string | null;
  nombreParticipants: number;
  lieuFormationAdresse: string | null;
  lieuFormationCodePostal: string | null;
  lieuFormationVille: string | null;
  dureePresIndividuel: number | null;
  dureePresCollectif: number | null;
  dureeDistSynchrone: number | null;
  dureeDistAsynchrone: number | null;
  dureePresIndividuelRealisee: number | null;
  dureePresCollectifRealisee: number | null;
  dureeDistSynchroneRealisee: number | null;
  dureeDistAsynchroneRealisee: number | null;
  modalitesDeroulement: string | null;
  modalitesEvaluation: string | null;
  typeCertification: string | null;
  modeReglement: string | null;
  dateReglement: Date | string | null;
  // Financement
  typeFinancement: string | null;
  nomFinanceur: string | null;
  montantPriseEnCharge: number | null;
  // Remise
  remisePourcent: number | null;
  remiseMontant: number | null;
  notes: string | null;
  client: {
    civilite: string | null;
    nom: string;
    prenom: string;
    nomNaissance: string | null;
    dateNaissance: Date | string | null;
    numeroSS: string | null;
    nomCommercial: string | null;
    statutJuridique: string;
    activitePrincipale: string | null;
    siret: string;
    codeApe: string;
    niveauDiplome: string | null;
    ancienneteDirection: string | null;
    adresse: string | null;
    codePostal: string | null;
    ville: string | null;
    email: string;
    telephone: string | null;
  };
  formation: {
    reference: string;
    intitule: string;
    dureeHeures: number;
    dureePresIndividuel: number | null;
    dureePresCollectif: number | null;
    dureeDistSynchrone: number | null;
    dureeDistAsynchrone: number | null;
    programme: string;
    objectifs: string | null;
    publicCible: string | null;
    prerequis: string | null;
    thematique: string | null;
    moduleType: string | null;
    typeQualification: string | null;
    nomFormateur: string | null;
    modalite: string;
    formationEnEntreprise: boolean;
    tarifInterHT: number;
    tarifIntraHT: number;
    certifiant: boolean;
    eligibleCPF: boolean;
    referenceRS: string | null;
    plafondAGEFICE: number | null;
  };
}

const CSS = `
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: Arial, Helvetica, sans-serif; font-size: 10.5pt; color: #111; background: #fff; }
.page { max-width: 210mm; margin: 0 auto; padding: 14mm 16mm; }
.org-header { border: 1px solid #999; padding: 10px 14px; margin-bottom: 16px; min-height: 60px; }
.org-header .org-name { font-weight: bold; font-size: 12pt; }
.org-header .org-sub { font-size: 9pt; color: #555; margin-top: 2px; }
h1 { font-size: 14pt; font-weight: bold; text-align: center; color: #003366; text-transform: uppercase;
     letter-spacing: 0.5px; border-bottom: 2px solid #003366; padding-bottom: 8px; margin: 16px 0 12px; }
h2 { font-size: 11pt; font-weight: bold; background: #003366; color: white; padding: 4px 10px;
     margin: 14px 0 6px; }
h3 { font-size: 10.5pt; font-weight: bold; color: #003366; margin: 10px 0 4px; border-bottom: 1px solid #ccc; padding-bottom: 2px; }
table { width: 100%; border-collapse: collapse; margin: 4px 0 10px; font-size: 10pt; }
th { background: #003366; color: white; padding: 5px 8px; text-align: left; font-size: 9.5pt; border: 1px solid #003366; }
td { padding: 4px 8px; border: 1px solid #ccc; vertical-align: top; }
.label { background: #f0f4f8; font-weight: bold; width: 42%; white-space: nowrap; }
.field-line { border-bottom: 1px solid #555; min-height: 22px; padding: 2px 4px; margin-bottom: 2px; }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 6px 0; }
.grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin: 6px 0; }
.field-block { margin-bottom: 8px; }
.field-block label { font-size: 9pt; color: #555; display: block; margin-bottom: 1px; }
.field-block .val { border-bottom: 1px solid #555; padding: 2px 4px; min-height: 20px; font-size: 10pt; }
.check-row { display: flex; align-items: center; gap: 8px; margin: 3px 0; font-size: 10pt; }
.check-row input[type=checkbox] { width: 14px; height: 14px; }
.checkbox-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 20px; }
.warning-box { background: #fff3cd; border: 1px solid #ffc107; padding: 8px 12px; margin: 10px 0;
               font-size: 9.5pt; border-radius: 3px; }
.info-box { background: #e8f0fe; border: 1px solid #4a86e8; padding: 8px 12px; margin: 10px 0;
            font-size: 9.5pt; border-radius: 3px; }
.sig-section { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 20px; }
.sig-box { border: 1px solid #999; padding: 10px 12px; min-height: 100px; }
.sig-box .sig-title { font-weight: bold; font-size: 10pt; border-bottom: 1px solid #999; padding-bottom: 4px; margin-bottom: 8px; }
.sig-line { border-bottom: 1px solid #555; height: 40px; margin-top: 20px; }
.footer { margin-top: 24px; padding-top: 8px; border-top: 1px solid #ccc; font-size: 8pt; color: #666; text-align: center; }
.agefice-logo { font-size: 20pt; font-weight: bold; color: #003366; }
.montant-highlight { background: #e8f0fe; font-weight: bold; }
.req { color: #c00; }
.duree-table td, .duree-table th { text-align: center; }
.duree-table td:first-child { text-align: left; }
.note-loi { font-size: 8pt; color: #555; margin-top: 6px; border-top: 1px solid #ddd; padding-top: 4px; }
@media print { body { padding: 0; } .page { padding: 10mm 12mm; } }
`;

function htmlWrapper(title: string, content: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>${CSS}</style>
</head>
<body><div class="page">${content}</div></body>
</html>`;
}

function orgHeader(organisme: OrganismeData): string {
  const adresse = [organisme.adresse, organisme.codePostal, organisme.ville].filter(Boolean).join(" — ");
  return `
<div class="org-header">
  <div class="org-name">${organisme.nom}</div>
  <div class="org-sub">SIRET : ${organisme.siret} | NDA : ${organisme.nda || "En cours"} | Qualiopi N° ${organisme.qualiopi}</div>
  <div class="org-sub">${adresse} | ${organisme.telephone} | ${organisme.email}</div>
</div>`;
}

function check(val: boolean): string {
  return val ? "☑" : "☐";
}

function fieldVal(v: string | null | undefined): string {
  return v || "&nbsp;";
}

// ── 1. DEMANDE PRÉALABLE DE FINANCEMENT ──────────────────────────────────
export function generateFormulaire(dossier: DossierData, organisme: OrganismeData): string {
  const client = dossier.client;
  const formation = dossier.formation;
  const adresseClient = [client.adresse, client.codePostal, client.ville].filter(Boolean).join(", ");
  const lieuFormation = [dossier.lieuFormationAdresse, dossier.lieuFormationCodePostal, dossier.lieuFormationVille].filter(Boolean).join(", ");
  const plafond = formation.plafondAGEFICE;

  // Coût pédagogique calculé depuis la formation (intra si en entreprise, inter sinon)
  const tarifUnitaire = formation.formationEnEntreprise ? formation.tarifIntraHT : formation.tarifInterHT;
  const coutPedagoHT  = tarifUnitaire * dossier.nombreParticipants;
  const montantDemande = plafond ? Math.min(coutPedagoHT, plafond) : coutPedagoHT;

  // Durées
  const duPrI = dossier.dureePresIndividuel ?? formation.dureePresIndividuel ?? "";
  const duPrC = dossier.dureePresCollectif ?? formation.dureePresCollectif ?? "";
  const duDiS = dossier.dureeDistSynchrone ?? formation.dureeDistSynchrone ?? "";
  const duDiA = dossier.dureeDistAsynchrone ?? formation.dureeDistAsynchrone ?? "";

  // Évaluation checkboxes
  let evalModes: string[] = [];
  try { evalModes = JSON.parse(dossier.modalitesEvaluation || "[]"); } catch { evalModes = []; }

  const niveauxDiplome: Record<string, string> = {
    bac5: "Bac+5", bac3: "Bac+3", bac2: "Bac+2 BTS-DUT-DEUG",
    bac_pro: "Bac / Bac pro", bep_cap: "BEP-CAP", fin_scolarite: "Fin de scolarité"
  };
  const anciennetes: Record<string, string> = {
    moins_1an: "Moins d'1 an", "1_3ans": "Entre 1 et 3 ans",
    "4_10ans": "Entre 4 et 10 ans", plus_10ans: "Plus de 10 ans"
  };

  const content = `
${orgHeader(organisme)}

<div style="text-align:center;margin:8px 0 4px">
  <div class="agefice-logo">AGEFICE</div>
  <div style="font-size:9pt;color:#555">www.agefice.fr</div>
</div>

<h1>Demande préalable de financement d'une action de formation</h1>

<div class="warning-box">
  ⚠ <strong>L'ensemble des champs doit être renseigné.</strong> Dans le cas contraire, la demande ne pourra être examinée.<br>
  À transmettre au moins <strong>15 jours calendaires</strong> avant le démarrage de l'action de formation.<br>
  Date limite de dépôt : <strong>${fmt(dossier.dateLimiteDepot)}</strong> — Dossier N° ${dossier.numero}
</div>

<h2>1. Point d'accueil (en charge de la constitution et du suivi de la demande)</h2>
<table>
  <tr><td class="label">Nom du Point d'accueil</td><td>${fieldVal(organisme.pointAccueilNom)}</td><td class="label">N° de Point d'accueil</td><td>${fieldVal(organisme.pointAccueilNumero)}</td></tr>
  <tr><td class="label">Interlocuteur</td><td>${fieldVal(organisme.pointAccueilInterlocuteur)}</td><td class="label">Adresse</td><td>${fieldVal(organisme.pointAccueilAdresse)}</td></tr>
  <tr><td class="label">Code postal</td><td>${fieldVal(organisme.pointAccueilCodePostal)}</td><td class="label">Ville</td><td>${fieldVal(organisme.pointAccueilVille)}</td></tr>
  <tr><td class="label">Tél.</td><td>${fieldVal(organisme.pointAccueilTel)}</td><td class="label">Mail</td><td>${fieldVal(organisme.pointAccueilMail)}</td></tr>
</table>

<h2>2. Entreprise</h2>
<table>
  <tr><td class="label">Nom de l'entreprise</td><td colspan="3">${fieldVal(client.nomCommercial || client.nom + " " + client.prenom)}</td></tr>
  <tr><td class="label">Nom commercial</td><td>${fieldVal(client.nomCommercial)}</td><td class="label">Code APE (NAF)</td><td>${fieldVal(client.codeApe)}</td></tr>
  <tr><td class="label">N° SIRET</td><td>${fieldVal(client.siret)}</td><td class="label">Forme juridique</td><td>${fieldVal(client.statutJuridique)}</td></tr>
  <tr><td class="label">Activité principale exercée</td><td colspan="3">${fieldVal(client.activitePrincipale)}</td></tr>
  <tr><td class="label">Adresse</td><td colspan="3">${fieldVal(adresseClient)}</td></tr>
  <tr><td class="label">Code postal</td><td>${fieldVal(client.codePostal)}</td><td class="label">Ville</td><td>${fieldVal(client.ville)}</td></tr>
</table>

<h2>3. Participant à la formation</h2>
<table>
  <tr>
    <td class="label">Civilité / Nom / Prénom</td>
    <td colspan="3">${fieldVal(client.civilite)} &nbsp; ${fieldVal(client.nom)} &nbsp; ${fieldVal(client.prenom)}</td>
  </tr>
  <tr><td class="label">Nom de naissance</td><td>${fieldVal(client.nomNaissance)}</td><td class="label">Date de naissance</td><td>${client.dateNaissance ? fmt(client.dateNaissance) : "&nbsp;"}</td></tr>
  <tr><td class="label">N° de Sécurité Sociale</td><td>${fieldVal(client.numeroSS)}</td><td class="label">Tél.</td><td>${fieldVal(client.telephone)}</td></tr>
  <tr><td class="label">Mail</td><td colspan="3">${fieldVal(client.email)}</td></tr>
  <tr><td class="label">Niveau du dernier diplôme</td><td colspan="3">${niveauxDiplome[client.niveauDiplome || ""] || "&nbsp;"}</td></tr>
  <tr><td class="label">Dirigeant d'entreprise depuis</td><td colspan="3">${anciennetes[client.ancienneteDirection || ""] || "&nbsp;"}</td></tr>
</table>

<h2>4. Organisme de formation</h2>
<table>
  <tr><td class="label">Raison sociale</td><td colspan="3">${fieldVal(organisme.nom)}</td></tr>
  <tr><td class="label">N° de déclaration d'activité (NDA)</td><td>${fieldVal(organisme.nda)}</td><td class="label">N° SIRET</td><td>${fieldVal(organisme.siret)}</td></tr>
  <tr><td class="label">Adresse</td><td colspan="3">${fieldVal(organisme.adresse)}</td></tr>
  <tr><td class="label">Code postal</td><td>${fieldVal(organisme.codePostal)}</td><td class="label">Ville</td><td>${fieldVal(organisme.ville)}</td></tr>
  <tr><td class="label">Responsable — Civilité / Nom / Prénom</td><td>${fieldVal(organisme.responsableCivilite + " " + organisme.responsableNom + " " + organisme.responsablePrenom)}</td>
      <td class="label">Qualité</td><td>${fieldVal(organisme.responsableQualite)}</td></tr>
  <tr><td class="label">Tél. responsable</td><td>${fieldVal(organisme.responsableTel)}</td><td class="label">Mail responsable</td><td>${fieldVal(organisme.responsableMail)}</td></tr>
</table>

<h2>5. Action de formation</h2>
<table>
  <tr>
    <td class="label">Type d'action</td>
    <td colspan="3">
      ${check(dossier.typeAction === "formation")} Action de formation &nbsp;
      ${check(dossier.typeAction === "bilan")} Bilan de compétences &nbsp;
      ${check(dossier.typeAction === "vae")} VAE &nbsp;
      ${check(dossier.typeAction === "autre")} Autre
    </td>
  </tr>
  <tr>
    <td class="label">Formation obligatoire</td><td>${check(dossier.formationObligatoire)} Oui &nbsp; ${check(!dossier.formationObligatoire)} Non</td>
    <td class="label">Reconversion</td><td>${check(dossier.reconversion)} Oui &nbsp; ${check(!dossier.reconversion)} Non</td>
  </tr>
  <tr><td class="label">Intitulé précis de la formation</td><td colspan="3">${fieldVal(formation.intitule)}</td></tr>
  <tr><td class="label">Référence</td><td>${fieldVal(formation.reference)}</td>
      <td class="label">Thématique</td><td>${fieldVal(formation.thematique)}</td></tr>
  <tr>
    <td class="label">Module</td>
    <td colspan="3">
      ${check(formation.moduleType === "initiation")} Initiation &nbsp;
      ${check(formation.moduleType === "mise_a_jour")} Mise à jour &nbsp;
      ${check(formation.moduleType === "perfectionnement")} Perfectionnement
    </td>
  </tr>
  <tr>
    <td class="label">Qualification</td>
    <td colspan="3">
      ${check(formation.typeQualification === "diplome_etat")} Diplôme d'État &nbsp;
      ${check(formation.typeQualification === "titre_homol")} Titre homol. &nbsp;
      ${check(formation.typeQualification === "qualification_branche")} Qualif. branche &nbsp;
      ${check(formation.typeQualification === "cqp")} CQP &nbsp;
      ${check(formation.typeQualification === "sans" || !formation.typeQualification)} Sans
    </td>
  </tr>
  <tr><td class="label">Date de début</td><td>${fmt(dossier.dateDebut)}</td><td class="label">Date de fin</td><td>${fmt(dossier.dateFin)}</td></tr>
  <tr>
    <td class="label">Formation en entreprise</td>
    <td>${check(formation.formationEnEntreprise)} Oui &nbsp; ${check(!formation.formationEnEntreprise)} Non</td>
    <td class="label">Nom du formateur</td>
    <td>${fieldVal(dossier.nomFormateur || formation.nomFormateur)}</td>
  </tr>
  <tr><td class="label">Adresse du lieu de formation</td><td colspan="3">${fieldVal(lieuFormation || organisme.adresse)}</td></tr>
  <tr>
    <td class="label">Coût pédagogique total H.T.</td>
    <td class="montant-highlight">${fmtMontant(coutPedagoHT)}</td>
    ${plafond ? `<td class="label">Plafond AGEFICE</td><td class="montant-highlight">${fmtMontant(plafond)}</td>` : "<td></td><td></td>"}
  </tr>
</table>

<table class="duree-table">
  <thead>
    <tr><th style="text-align:left">Durée en heure(s)</th><th>Prévue</th></tr>
  </thead>
  <tbody>
    <tr><td>Durée en présentiel individuel<sup>1</sup></td><td>${duPrI || "&nbsp;"}</td></tr>
    <tr><td>Durée en présentiel collectif<sup>2</sup></td><td>${duPrC || "&nbsp;"}</td></tr>
    <tr><td>Durée en distanciel synchrone<sup>3</sup></td><td>${duDiS || "&nbsp;"}</td></tr>
    <tr><td>Durée en distanciel asynchrone<sup>4</sup></td><td>${duDiA || "&nbsp;"}</td></tr>
    <tr style="font-weight:bold;background:#f0f4f8"><td>Total</td><td>${formation.dureeHeures}h</td></tr>
  </tbody>
</table>

<h2>6. Modalités de déroulement, de suivi et de sanction</h2>
<table>
  <tr>
    <td class="label">Modalités de déroulement<br><small>(assistance technique et pédagogique)</small></td>
    <td style="min-height:50px">${fieldVal(dossier.modalitesDeroulement)}</td>
  </tr>
  <tr>
    <td class="label">Modalités d'évaluation et de suivi</td>
    <td>
      ${check(evalModes.includes("questionnaires"))} Questionnaires, quiz &nbsp;
      ${check(evalModes.includes("travaux"))} Contrôle continu/travaux &nbsp;
      ${check(evalModes.includes("releves"))} Relevés &nbsp;
      ${check(evalModes.includes("emargement"))} Feuilles de présence &nbsp;
      ${check(evalModes.includes("autre"))} Autre
    </td>
  </tr>
  <tr>
    <td class="label">Nature de la certification</td>
    <td>
      ${check(dossier.typeCertification === "rncp")} Certification RNCP/Répertoire spécifique &nbsp;
      ${check(dossier.typeCertification === "diplome_etat")} Diplôme d'État &nbsp;
      ${check(dossier.typeCertification === "autre_diplome")} Autre diplôme &nbsp;
      ${check(dossier.typeCertification === "attestation" || !dossier.typeCertification)} Attestation de fin de stage
    </td>
  </tr>
</table>

<div class="note-loi">
  <sup>1</sup> Formateur et stagiaires nécessairement réunis physiquement en un même lieu<br>
  <sup>2</sup> Plus d'un stagiaire même s'ils appartiennent à la même entreprise<br>
  <sup>3</sup> Formateur et stagiaires nécessairement réunis en temps réel sur des plages horaires préalablement définies<br>
  <sup>4</sup> Bénéficiant d'un suivi logiciel des temps de connexion en temps réel avec horaire, durée et adresse IP
</div>

<div style="margin-top:16px;border:1px solid #999;padding:10px;font-size:9.5pt">
  <p>Par la présente, je certifie l'exactitude des informations portées sur cette demande, j'atteste avoir pris connaissance des critères
  de prise en charge exhaustifs disponibles sur le site de l'AGEFICE (<strong>www.agefice.fr</strong>) et m'engage à ne pas demander
  le même financement à un autre OPCO, Fonds d'Assurance Formation ou financeur.</p>
</div>

<div class="sig-section" style="margin-top:16px">
  <div class="sig-box">
    <div class="sig-title">Le demandeur (stagiaire)</div>
    <p style="font-size:9.5pt"><strong>${fieldVal(client.civilite)} ${fieldVal(client.nom)} ${fieldVal(client.prenom)}</strong></p>
    <p style="font-size:9pt;margin-top:6px">Fait à ________________________________</p>
    <p style="font-size:9pt;margin-top:4px">Le ____/____/________</p>
    <p style="font-size:9pt;margin-top:4px">Signature :</p>
    <div class="sig-line"></div>
  </div>
  <div class="sig-box">
    <div class="sig-title">L'organisme de formation (si mandat)</div>
    <p style="font-size:9.5pt"><strong>${fieldVal(organisme.nom)}</strong></p>
    <p style="font-size:9pt;margin-top:6px">${fieldVal(organisme.responsableCivilite)} ${fieldVal(organisme.responsableNom)} ${fieldVal(organisme.responsablePrenom)}</p>
    <p style="font-size:9pt;margin-top:4px">Qualité : ${fieldVal(organisme.responsableQualite)}</p>
    <div class="sig-line"></div>
  </div>
</div>

<div class="footer">
  AGEFICE — ${organisme.nom} | SIRET ${organisme.siret} | NDA ${organisme.nda || "en cours"} | Qualiopi N° ${organisme.qualiopi} | Dossier ${dossier.numero}
</div>`;

  return htmlWrapper(`Demande de financement AGEFICE — ${dossier.numero}`, content);
}

// ── 2. CONVENTION DE FORMATION ────────────────────────────────────────────
export function generateConvention(dossier: DossierData, organisme: OrganismeData): string {
  const client = dossier.client;
  const formation = dossier.formation;
  const adresseClient = [client.adresse, client.codePostal, client.ville].filter(Boolean).join(", ");
  const lieuFormation = [dossier.lieuFormationAdresse, dossier.lieuFormationCodePostal, dossier.lieuFormationVille].filter(Boolean).join(", ") || [organisme.adresse, organisme.codePostal, organisme.ville].filter(Boolean).join(", ");

  const content = `
${orgHeader(organisme)}
<h1>Convention de formation professionnelle</h1>
<p style="text-align:center;font-size:9pt;color:#555;margin-bottom:12px">Article L6353-1 du Code du travail | NDA : ${organisme.nda || "en cours"} | Dossier N° ${dossier.numero}</p>

<h2>Entre les soussignés :</h2>
<table>
  <tr>
    <th style="width:50%">L'organisme de formation</th>
    <th>Le bénéficiaire (stagiaire)</th>
  </tr>
  <tr>
    <td>
      <strong>${organisme.nom}</strong><br>
      SIRET : ${organisme.siret}<br>
      NDA : ${organisme.nda || "en cours"} — Qualiopi N° ${organisme.qualiopi}<br>
      ${organisme.adresse}, ${organisme.codePostal} ${organisme.ville}<br>
      Tél : ${organisme.telephone}<br>
      Représenté(e) par : ${organisme.responsableCivilite} ${organisme.responsableNom} ${organisme.responsablePrenom}<br>
      Qualité : ${organisme.responsableQualite}<br>
      <em>Ci-après désigné « l'Organisme »</em>
    </td>
    <td>
      <strong>${client.civilite || ""} ${client.prenom} ${client.nom}</strong><br>
      ${client.statutJuridique} — SIRET : ${client.siret}<br>
      Code APE : ${client.codeApe}<br>
      ${adresseClient}<br>
      Email : ${client.email}<br>
      Tél : ${client.telephone || "—"}<br>
      <em>Ci-après désigné « le Bénéficiaire »</em>
    </td>
  </tr>
</table>

<h2>Article 1 — Objet</h2>
<p>La présente convention a pour objet de définir les conditions dans lesquelles l'Organisme dispensera la formation professionnelle continue au Bénéficiaire, dans le cadre d'une demande de prise en charge AGEFICE.</p>

<h2>Article 2 — Nature et contenu de la formation</h2>
<table>
  <tr><td class="label">Intitulé de la formation</td><td>${formation.intitule}</td></tr>
  <tr><td class="label">Référence</td><td>${formation.reference}</td></tr>
  <tr><td class="label">Objectifs pédagogiques</td><td>${formation.objectifs || "Voir programme joint"}</td></tr>
  <tr><td class="label">Public cible</td><td>${formation.publicCible || "Chef d'entreprise / TNS"}</td></tr>
  <tr><td class="label">Prérequis</td><td>${formation.prerequis || "Aucun"}</td></tr>
  <tr><td class="label">Modalité pédagogique</td><td>${MODALITES_LABEL[dossier.modalite] || dossier.modalite}</td></tr>
</table>

<h2>Article 3 — Calendrier et lieu</h2>
<table>
  <tr><td class="label">Date de début</td><td>${fmt(dossier.dateDebut)}</td><td class="label">Date de fin</td><td>${fmt(dossier.dateFin)}</td></tr>
  <tr>
    <td class="label">Ventilation des heures</td>
    <td colspan="3">
      Présentiel individuel : ${dossier.dureePresIndividuel ?? formation.dureePresIndividuel ?? "—"}h |
      Présentiel collectif : ${dossier.dureePresCollectif ?? formation.dureePresCollectif ?? "—"}h |
      Distanciel synchrone : ${dossier.dureeDistSynchrone ?? formation.dureeDistSynchrone ?? "—"}h |
      Distanciel asynchrone : ${dossier.dureeDistAsynchrone ?? formation.dureeDistAsynchrone ?? "—"}h |
      <strong>Total : ${formation.dureeHeures}h</strong>
    </td>
  </tr>
  <tr><td class="label">Lieu de formation</td><td colspan="3">${lieuFormation}</td></tr>
  <tr><td class="label">Nom du formateur</td><td colspan="3">${dossier.nomFormateur || formation.nomFormateur || "À définir"}</td></tr>
</table>

<h2>Article 4 — Prix et modalités de règlement</h2>
<table>
  <tr><td class="label">Coût pédagogique H.T.</td><td>${fmtMontant(dossier.montantHT)}</td></tr>
  <tr><td class="label">TVA</td><td>Exonération de TVA — Art. 261.4.4° du CGI (organisme de formation professionnelle)</td></tr>
  <tr><td class="label" style="font-weight:bold">Coût total TTC</td><td style="font-weight:bold">${fmtMontant(dossier.montantTTC)}</td></tr>
  ${formation.plafondAGEFICE ? `<tr><td class="label">Prise en charge AGEFICE (plafond)</td><td>${fmtMontant(Math.min(dossier.montantTTC, formation.plafondAGEFICE))}</td></tr>` : ""}
</table>
<p style="font-size:9pt;color:#555;margin-top:4px">Le paiement direct par le bénéficiaire à l'organisme est obligatoire. Toute avance de fonds de l'organisme est interdite (AGEFICE).</p>

<h2>Article 5 — Suivi et évaluation</h2>
<p style="margin:6px 0">L'assiduité est contrôlée par feuille d'émargement signée (présentiel/synchrone) ou relevé de connexion (distanciel asynchrone). Une évaluation des acquis est réalisée en fin de formation. ${formation.certifiant ? "Cette formation est certifiante." : "Une attestation de fin de stage sera remise."}</p>

<h2>Article 6 — Conditions d'annulation</h2>
<p style="margin:6px 0">Toute annulation doit être notifiée par écrit au minimum <strong>10 jours ouvrés</strong> avant le début de la formation. En cas d'annulation tardive ou d'absence non justifiée, l'intégralité du prix pourra être facturée.</p>

<div class="sig-section">
  <div class="sig-box">
    <div class="sig-title">Pour le Bénéficiaire</div>
    <p><strong>${client.civilite || ""} ${client.prenom} ${client.nom}</strong></p>
    <p style="font-size:9pt;margin-top:6px">Fait à _________________________, le ____/____/________</p>
    <p style="font-size:9pt;margin-top:4px">Lu et approuvé — Signature :</p>
    <div class="sig-line"></div>
  </div>
  <div class="sig-box">
    <div class="sig-title">Pour l'Organisme de formation</div>
    <p><strong>${organisme.nom}</strong></p>
    <p style="font-size:9pt;margin-top:6px">${organisme.responsableCivilite} ${organisme.responsableNom} ${organisme.responsablePrenom} — ${organisme.responsableQualite}</p>
    <p style="font-size:9pt;margin-top:4px">Fait à _________________________, le ____/____/________</p>
    <p style="font-size:9pt;margin-top:4px">Cachet et signature :</p>
    <div class="sig-line"></div>
  </div>
</div>
<div class="footer">${organisme.nom} | SIRET ${organisme.siret} | NDA ${organisme.nda || "en cours"} | Qualiopi N° ${organisme.qualiopi} | Dossier AGEFICE ${dossier.numero}</div>`;
  return htmlWrapper(`Convention de formation — ${dossier.numero}`, content);
}

// ── Helper : formater le programme avec hiérarchie visuelle ──────────────
function formatProgrammeHTML(texte: string): string {
  const CSS_PROG = `
.prog-day { background:#1F4E79; color:#fff; padding:6px 12px; margin:14px 0 4px; font-size:10.5pt;
            font-weight:bold; border-radius:4px; letter-spacing:0.3px; }
.prog-module { background:#e8f0fe; color:#1F4E79; padding:5px 10px; margin:10px 0 4px;
               font-size:10pt; font-weight:bold; border-left:3px solid #1F4E79; }
.prog-bullets { margin:4px 0 6px 18px; padding:0; }
.prog-bullets li { font-size:9.5pt; line-height:1.55; margin:2px 0; color:#222; }
.prog-livrable { background:#e6f4ea; border-left:3px solid #2e7d32; padding:5px 10px;
                 margin:6px 0; font-size:9.5pt; color:#1b5e20; }
.prog-livrable::before { content:"📋 "; }
.prog-atelier { background:#fff3e0; border-left:3px solid #e65100; padding:5px 10px;
                margin:6px 0; font-size:9.5pt; color:#bf360c; }
.prog-atelier::before { content:"🛠 "; }
.prog-eval { background:#f3e5f5; border-left:3px solid #7b1fa2; padding:5px 10px;
             margin:6px 0; font-size:9.5pt; color:#4a148c; }
.prog-eval::before { content:"✅ "; }
`;

  const lines = texte.split("\n").map((l) => l.trim()).filter(Boolean);
  let html = `<style>${CSS_PROG}</style>`;
  let inBullets = false;

  const closeBullets = () => {
    if (inBullets) { html += "</ul>"; inBullets = false; }
  };

  for (const line of lines) {
    // JOUR X : ou JOUR X — titre de journée
    if (/^JOUR\s+\d+/i.test(line)) {
      closeBullets();
      const titre = line.replace(/^(JOUR\s+\d+)\s*[:—\-]\s*/i, "<span style='opacity:.75;font-weight:normal;font-size:9pt'>$1 — </span>");
      html += `<div class="prog-day">${titre}</div>`;
      continue;
    }
    // Module X : ou MATINÉE / APRÈS-MIDI
    if (/^(Module\s+\d+|MATINE+E?|APRES.MIDI|MATIN|APRÈS-MIDI)/i.test(line)) {
      closeBullets();
      html += `<div class="prog-module">${line.replace(/\s*:\s*$/, "")}</div>`;
      continue;
    }
    // Livrable :
    if (/^Livrable\s*:/i.test(line)) {
      closeBullets();
      html += `<div class="prog-livrable">${line.replace(/^Livrable\s*:\s*/i, "")}</div>`;
      continue;
    }
    // Atelier :
    if (/^Atelier\s*:/i.test(line)) {
      closeBullets();
      html += `<div class="prog-atelier">${line.replace(/^Atelier\s*:\s*/i, "")}</div>`;
      continue;
    }
    // Évaluation finale / Évaluation
    if (/^[EÉ]valuation/i.test(line)) {
      closeBullets();
      html += `<div class="prog-eval">${line}</div>`;
      continue;
    }
    // Bullet point (ligne commençant par - ou •)
    if (/^[-•]/.test(line)) {
      if (!inBullets) { html += `<ul class="prog-bullets">`; inBullets = true; }
      html += `<li>${line.replace(/^[-•]\s*/, "")}</li>`;
      continue;
    }
    // Ligne générique (titre de section ou texte)
    closeBullets();
    html += `<p style="font-size:9.5pt;margin:6px 0 2px;font-weight:bold;color:#333">${line}</p>`;
  }
  closeBullets();
  return html;
}

// ── 3. PROGRAMME / CONVOCATION ────────────────────────────────────────────
export function generateProgramme(dossier: DossierData, organisme: OrganismeData): string {
  const client = dossier.client;
  const formation = dossier.formation;
  const lieuFormation = [dossier.lieuFormationAdresse, dossier.lieuFormationCodePostal, dossier.lieuFormationVille].filter(Boolean).join(", ") || [organisme.adresse, organisme.codePostal, organisme.ville].filter(Boolean).join(", ");
  const isDistanciel = dossier.modalite.includes("distanciel") || dossier.modalite === "hybride";
  const isFOAD = dossier.modalite === "distanciel_asynchrone" || (formation.dureeDistAsynchrone ?? 0) > 0;

  const content = `
${orgHeader(organisme)}
<h1>Programme de formation — Convocation</h1>

<div class="info-box">
  <strong>${formation.intitule}</strong> — Réf. ${formation.reference} — Dossier AGEFICE N° ${dossier.numero}
</div>

<h2>Convocation du participant</h2>
<table>
  <tr><td class="label">Participant</td><td><strong>${client.civilite || ""} ${client.prenom} ${client.nom}</strong></td></tr>
  <tr><td class="label">Entreprise / SIRET</td><td>${client.statutJuridique} — ${client.siret}</td></tr>
  <tr><td class="label">Email</td><td>${client.email}</td></tr>
  <tr><td class="label">Tél.</td><td>${client.telephone || "—"}</td></tr>
</table>

<h2>Modalités pratiques</h2>
<table>
  <tr><td class="label">Date de début</td><td>${fmt(dossier.dateDebut)}</td><td class="label">Date de fin</td><td>${fmt(dossier.dateFin)}</td></tr>
  <tr><td class="label">Durée totale</td><td><strong>${formation.dureeHeures} heures</strong></td><td class="label">Modalité</td><td>${MODALITES_LABEL[dossier.modalite] || dossier.modalite}</td></tr>
  <tr><td class="label">Lieu</td><td colspan="3">${lieuFormation}</td></tr>
  <tr><td class="label">Nom du formateur</td><td colspan="3">${dossier.nomFormateur || formation.nomFormateur || "À préciser"}</td></tr>
  <tr><td class="label">Nombre de participants</td><td colspan="3">${dossier.nombreParticipants}</td></tr>
</table>

<h2>Programme détaillé — Contenu de la formation</h2>
<table style="margin-bottom:10px">
  <tr><td class="label">Intitulé</td><td>${formation.intitule}</td></tr>
  <tr><td class="label">Catégorie de l'action</td><td>${TYPES_ACTION_LABEL[dossier.typeAction] || "Action de formation (développement des compétences)"}</td></tr>
</table>
${formatProgrammeHTML(formation.programme)}

${formation.objectifs ? `
<h3>Objectifs pédagogiques</h3>
<p style="margin:6px 0;font-size:10pt">${formation.objectifs}</p>` : ""}

${formation.publicCible ? `
<h3>Public cible</h3>
<p style="margin:6px 0;font-size:10pt">${formation.publicCible}</p>` : ""}

${formation.prerequis ? `
<h3>Prérequis</h3>
<p style="margin:6px 0;font-size:10pt">${formation.prerequis}</p>` : ""}

<h3>Modalités pédagogiques et techniques</h3>
<p style="margin:6px 0;font-size:10pt">${dossier.modalitesDeroulement || "Exposés interactifs, ateliers pratiques, mises en situation, échanges."}</p>

<h3>Modalités de contrôle de l'assiduité</h3>
<p style="margin:6px 0;font-size:10pt">${isDistanciel ? "Relevé de connexion logiciel avec horaire, durée et adresse IP." : "Feuille d'émargement signée par demi-journée."}</p>

<h3>Modalités de sanction et d'évaluation</h3>
<p style="margin:6px 0;font-size:10pt">Évaluation des acquis en cours et en fin de formation. ${TYPES_CERTIFICATION_LABEL[dossier.typeCertification || "attestation"] || "Attestation de fin de stage"} remise au participant.</p>

${isFOAD ? `
<h3>Spécificités FOAD (formation à distance)</h3>
<ul style="margin:6px 0 6px 20px;font-size:10pt;line-height:1.6">
  <li>Nature des travaux demandés : exercices pratiques, quiz, projets appliqués au contexte professionnel</li>
  <li>Temps estimé pour la réalisation des travaux : intégré dans la durée totale de ${formation.dureeHeures}h</li>
  <li>Modalités de suivi : relevé de connexion en temps réel (horaire, durée, adresse IP)</li>
  <li>Assistance pédagogique : disponible par email et visioconférence aux horaires définis</li>
  <li>Assistance technique : support disponible pour tout problème d'accès à la plateforme</li>
</ul>` : ""}

<div class="footer">${organisme.nom} | SIRET ${organisme.siret} | NDA ${organisme.nda || "en cours"} | Qualiopi N° ${organisme.qualiopi} | Dossier AGEFICE ${dossier.numero}</div>`;
  return htmlWrapper(`Programme de formation — ${dossier.numero}`, content);
}

// ── 4. CONVOCATION À LA FORMATION (Qualiopi) ─────────────────────────────
export function generateConvocation(dossier: DossierData, organisme: OrganismeData): string {
  const client = dossier.client;
  const formation = dossier.formation;
  const lieuFormation = [dossier.lieuFormationAdresse, dossier.lieuFormationCodePostal, dossier.lieuFormationVille]
    .filter(Boolean).join(", ") || [organisme.adresse, organisme.codePostal, organisme.ville].filter(Boolean).join(", ");
  const isDistanciel = dossier.modalite.includes("distanciel") || dossier.modalite === "hybride";
  const isAsynchrone = dossier.modalite === "distanciel_asynchrone";
  const isAgefice = !dossier.typeFinancement || dossier.typeFinancement === "agefice";

  // Durée totale ventilée
  const durees = [
    { label: "Présentiel individuel", val: dossier.dureePresIndividuel ?? formation.dureePresIndividuel },
    { label: "Présentiel collectif",  val: dossier.dureePresCollectif  ?? formation.dureePresCollectif  },
    { label: "Distanciel synchrone",  val: dossier.dureeDistSynchrone  ?? formation.dureeDistSynchrone  },
    { label: "Distanciel asynchrone", val: dossier.dureeDistAsynchrone ?? formation.dureeDistAsynchrone },
  ].filter(d => d.val);

  const content = `
${orgHeader(organisme)}
<h1>Convocation à la formation</h1>

<p style="text-align:right;font-size:9.5pt;margin-bottom:12px">
  ${organisme.ville}, le ${fmt(new Date())}<br>
  Dossier N° <strong>${dossier.numero}</strong>
</p>

<p style="margin-bottom:16px;font-size:10.5pt;line-height:1.7">
  <strong>${client.civilite || "M./Mme"} ${client.prenom} ${client.nom}</strong><br>
  ${client.statutJuridique} — SIRET ${client.siret}<br>
  ${[client.adresse, client.codePostal, client.ville].filter(Boolean).join(", ")}
</p>

<p style="font-size:10.5pt;line-height:1.8;margin-bottom:16px">
  Madame, Monsieur,<br><br>
  Nous avons le plaisir de vous convoquer à la formation dont le détail figure ci-dessous,
  dans le cadre de votre demande de prise en charge${isAgefice ? " <strong>AGEFICE</strong>" : ""}.
</p>

<h2>Informations sur la formation</h2>
<table>
  <tr><td class="label">Intitulé de la formation</td><td><strong>${formation.intitule}</strong></td></tr>
  <tr><td class="label">Référence</td><td>${formation.reference}</td></tr>
  <tr><td class="label">Date de début</td><td><strong>${fmt(dossier.dateDebut)}</strong></td></tr>
  <tr><td class="label">Date de fin</td><td><strong>${fmt(dossier.dateFin)}</strong></td></tr>
  <tr><td class="label">Durée totale</td><td><strong>${formation.dureeHeures} heures</strong>${durees.length > 0 ? ` (${durees.map(d => `${d.label} : ${d.val}h`).join(" | ")})` : ""}</td></tr>
  <tr><td class="label">Modalité</td><td>${MODALITES_LABEL[dossier.modalite] || dossier.modalite}</td></tr>
  <tr><td class="label">Lieu de formation</td><td>${isAsynchrone ? "Distanciel — accès à la plateforme de formation" : (lieuFormation || "À préciser")}</td></tr>
  <tr><td class="label">Nom du formateur</td><td>${dossier.nomFormateur || formation.nomFormateur || "À préciser"}</td></tr>
</table>

${formation.objectifs ? `
<h2>Objectifs pédagogiques</h2>
<p style="margin:6px 0;font-size:10pt;line-height:1.7">${formation.objectifs.split("\n").join("<br>")}</p>
` : ""}

${formation.programme ? `
<h2>Programme de formation</h2>
${formatProgrammeHTML(formation.programme)}
` : ""}

<h2>Documents à apporter le premier jour</h2>
<ul style="margin:8px 0 10px 20px;font-size:10pt;line-height:1.8">
  <li>Pièce d'identité valide (carte nationale d'identité ou passeport)</li>
  ${isAgefice ? `<li>Attestation de versement de la Cotisation à la Formation Professionnelle (CFP) — URSSAF</li>
  <li>Extrait Kbis ou avis de situation SIRENE (moins de 3 mois)</li>
  <li>Tout document requis par l'AGEFICE pour la constitution de votre dossier</li>` : ""}
  ${!isDistanciel ? "<li>Tenue adaptée à la formation (si applicable)</li>" : ""}
  ${isDistanciel ? "<li>Ordinateur avec connexion internet stable (microphone + webcam recommandés)</li>" : ""}
</ul>

${isDistanciel ? `
<h2>Accès à la formation à distance</h2>
<p style="font-size:10pt;margin:6px 0;line-height:1.7">
  Un lien de connexion (ou accès à la plateforme) vous sera transmis par email à l'adresse
  <strong>${client.email}</strong> avant le démarrage de la formation.<br>
  Pensez à tester votre connexion et votre équipement au préalable.<br>
  Assistance technique disponible : ${organisme.telephone} — ${organisme.email}
</p>
` : ""}

<h2>Contrôle de l'assiduité et certification</h2>
<p style="font-size:10pt;margin:6px 0;line-height:1.7">
  ${isAsynchrone
    ? "Votre assiduité sera contrôlée par relevé automatique des connexions (horaire, durée, adresse IP), conformément aux exigences AGEFICE."
    : "Une feuille d'émargement sera signée à chaque demi-journée par vous-même et le formateur."}<br>
  À l'issue de la formation : <strong>${formation.certifiant ? "certification — " + (formation.referenceRS ? "RS " + formation.referenceRS : "voir programme") : "attestation de fin de stage"}</strong> remise au participant.
</p>

<h2>Contact et informations complémentaires</h2>
<table>
  <tr><td class="label">Organisme de formation</td><td>${organisme.nom}</td></tr>
  <tr><td class="label">Responsable</td><td>${organisme.responsableCivilite} ${organisme.responsablePrenom} ${organisme.responsableNom} — ${organisme.responsableQualite}</td></tr>
  <tr><td class="label">Téléphone</td><td>${organisme.telephone}</td></tr>
  <tr><td class="label">Email</td><td>${organisme.email}</td></tr>
  ${organisme.site ? `<tr><td class="label">Site web</td><td>${organisme.site}</td></tr>` : ""}
</table>

<p style="font-size:10pt;margin:16px 0;line-height:1.7">
  En cas d'empêchement, merci de nous prévenir dans les meilleurs délais et au moins
  <strong>10 jours ouvrés avant</strong> le début de la formation, afin de permettre une éventuelle
  reprogrammation ou annulation sans frais.
</p>

<div class="sig-section" style="margin-top:20px">
  <div class="sig-box">
    <div class="sig-title">Pour l'organisme de formation</div>
    <p><strong>${organisme.nom}</strong></p>
    <p style="font-size:9pt;margin-top:4px">${organisme.responsableCivilite} ${organisme.responsableNom} ${organisme.responsablePrenom}<br>${organisme.responsableQualite}</p>
    <p style="font-size:9pt;margin-top:6px">Fait à ${organisme.ville}, le ${fmt(new Date())}</p>
    <div class="sig-line"></div>
  </div>
  <div class="sig-box">
    <div class="sig-title">Accusé de réception (optionnel)</div>
    <p style="font-size:9.5pt">Je soussigné(e) ${client.civilite || ""} ${client.prenom} ${client.nom}<br>
    accuse réception de cette convocation et confirme ma participation.</p>
    <p style="font-size:9pt;margin-top:6px">Fait à _________________________, le ____/____/________</p>
    <div class="sig-line"></div>
  </div>
</div>

<div class="footer">${organisme.nom} | SIRET ${organisme.siret} | NDA ${organisme.nda || "en cours"} | Qualiopi N° ${organisme.qualiopi} | Dossier ${dossier.numero}</div>`;

  return htmlWrapper(`Convocation — ${formation.intitule} — ${dossier.numero}`, content);
}

// ── 5. FEUILLE D'ÉMARGEMENT ───────────────────────────────────────────────
export function generateFeuilleEmargement(dossier: DossierData, organisme: OrganismeData): string {
  const client = dossier.client;
  const formation = dossier.formation;
  const lieuFormation = [dossier.lieuFormationAdresse, dossier.lieuFormationCodePostal, dossier.lieuFormationVille].filter(Boolean).join(", ") || [organisme.adresse, organisme.codePostal, organisme.ville].filter(Boolean).join(", ");
  const isDistanciel = dossier.modalite === "distanciel_asynchrone";

  // Build half-day rows between start and end
  const rows: string[] = [];
  const current = new Date(dossier.dateDebut);
  const end = new Date(dossier.dateFin);
  while (current <= end && rows.length < 30) {
    const dow = current.getDay();
    if (dow !== 0 && dow !== 6) {
      const dayLabel = format(current, "EEEE dd/MM/yyyy", { locale: fr });
      rows.push(`<tr>
        <td style="white-space:nowrap">${dayLabel}</td>
        <td style="text-align:center">Matin<br><small>9h00–12h00</small></td>
        <td style="text-align:center;width:120px">&nbsp;</td>
        <td style="text-align:center;width:120px">&nbsp;</td>
        ${isDistanciel ? `<td style="text-align:center;width:140px">&nbsp;</td>` : ""}
      </tr>
      <tr>
        <td>&nbsp;</td>
        <td style="text-align:center">Après-midi<br><small>13h30–17h00</small></td>
        <td style="text-align:center">&nbsp;</td>
        <td style="text-align:center">&nbsp;</td>
        ${isDistanciel ? `<td style="text-align:center">&nbsp;</td>` : ""}
      </tr>`);
    }
    current.setDate(current.getDate() + 1);
  }

  const content = `
${orgHeader(organisme)}
<h1>Feuille d'émargement</h1>

<table>
  <tr><td class="label">Formation</td><td colspan="3"><strong>${formation.intitule}</strong> — Réf. ${formation.reference}</td></tr>
  <tr><td class="label">Dossier AGEFICE</td><td>${dossier.numero}</td><td class="label">Modalité</td><td>${MODALITES_LABEL[dossier.modalite] || dossier.modalite}</td></tr>
  <tr><td class="label">Participant</td><td><strong>${client.civilite || ""} ${client.prenom} ${client.nom}</strong></td><td class="label">SIRET</td><td>${client.siret}</td></tr>
  <tr><td class="label">Formateur</td><td>${dossier.nomFormateur || formation.nomFormateur || "À préciser"}</td><td class="label">Nb participants</td><td>${dossier.nombreParticipants}</td></tr>
  <tr><td class="label">Du</td><td>${fmt(dossier.dateDebut)}</td><td class="label">Au</td><td>${fmt(dossier.dateFin)}</td></tr>
  <tr><td class="label">Lieu de formation</td><td colspan="3">${lieuFormation}</td></tr>
</table>

<table style="margin-top:12px">
  <thead>
    <tr>
      <th style="text-align:left">Date</th>
      <th>Demi-journée</th>
      <th>Signature du participant</th>
      <th>Signature du formateur</th>
      ${isDistanciel ? `<th>Adresse IP / Connexion</th>` : ""}
    </tr>
  </thead>
  <tbody>
    ${rows.join("")}
  </tbody>
</table>

<div class="sig-section">
  <div class="sig-box">
    <div class="sig-title">Le participant certifie avoir suivi la formation</div>
    <p><strong>${client.civilite || ""} ${client.prenom} ${client.nom}</strong></p>
    <p style="font-size:9pt;margin-top:6px">Date : ____/____/________</p>
    <div class="sig-line"></div>
  </div>
  <div class="sig-box">
    <div class="sig-title">Le formateur certifie l'exactitude de la présente feuille</div>
    <p><strong>${dossier.nomFormateur || formation.nomFormateur || organisme.nom}</strong></p>
    <p style="font-size:9pt;margin-top:6px">Date : ____/____/________</p>
    <div class="sig-line"></div>
  </div>
</div>
<div class="footer">${organisme.nom} | SIRET ${organisme.siret} | NDA ${organisme.nda || "en cours"} | Qualiopi N° ${organisme.qualiopi} | Dossier AGEFICE ${dossier.numero}</div>`;
  return htmlWrapper(`Feuille d'émargement — ${dossier.numero}`, content);
}

// ── 6. ÉVALUATION DES ACQUIS + QUESTIONNAIRE DE SATISFACTION (Qualiopi) ──
export function generateEvaluation(dossier: DossierData, organisme: OrganismeData): string {
  const client = dossier.client;
  const formation = dossier.formation;

  // Parse objectifs en liste (pour la grille d'évaluation)
  const objectifsList: string[] = formation.objectifs
    ? formation.objectifs.split(/\n|;/).map(l => l.replace(/^[-•*]\s*/, "").trim()).filter(l => l.length > 3)
    : ["Maîtriser les concepts fondamentaux de la formation",
       "Appliquer les méthodes et outils présentés",
       "Adapter les acquis à son contexte professionnel"];

  const lignesEvalAcquis = objectifsList.map((obj, i) => `
  <tr>
    <td style="font-size:9.5pt">${i + 1}. ${obj}</td>
    <td style="text-align:center;width:70px">☐</td>
    <td style="text-align:center;width:70px">☐</td>
    <td style="text-align:center;width:70px">☐</td>
    <td style="text-align:center;width:80px;font-size:9pt"></td>
  </tr>`).join("");

  const questionsSatisfaction = [
    "Les objectifs de la formation ont été clairement présentés",
    "Le contenu de la formation correspondait à mes attentes",
    "Les méthodes pédagogiques étaient adaptées et variées",
    "Le formateur maîtrisait les sujets traités et était disponible",
    "Les conditions matérielles (lieu, équipements, supports) étaient satisfaisantes",
    "Cette formation m'apportera des bénéfices concrets dans mon activité professionnelle",
    "Je recommanderais cette formation à un(e) confrère/consœur",
  ];

  const lignesSatisfaction = questionsSatisfaction.map((q, i) => `
  <tr>
    <td style="font-size:9.5pt">${i + 1}. ${q}</td>
    <td style="text-align:center;width:50px">☐</td>
    <td style="text-align:center;width:50px">☐</td>
    <td style="text-align:center;width:50px">☐</td>
    <td style="text-align:center;width:50px">☐</td>
    <td style="text-align:center;width:50px">☐</td>
  </tr>`).join("");

  const content = `
${orgHeader(organisme)}
<h1>Évaluation de la formation — Qualiopi</h1>
<div class="info-box">
  <strong>${formation.intitule}</strong> — Réf. ${formation.reference} — Dossier N° ${dossier.numero}<br>
  Participant : <strong>${client.civilite || ""} ${client.prenom} ${client.nom}</strong> — Du ${fmt(dossier.dateDebut)} au ${fmt(dossier.dateFin)}
</div>

<!-- PARTIE 1 : ÉVALUATION DES ACQUIS -->
<h2>Partie 1 — Évaluation des acquis de formation</h2>
<p style="font-size:9.5pt;margin:4px 0 8px;color:#555">
  Cette grille est remplie <strong>conjointement par le formateur et le stagiaire</strong> à l'issue de la formation.
  Elle atteste de l'atteinte des objectifs pédagogiques (Qualiopi — Indicateur 7).
</p>

<table>
  <thead>
    <tr>
      <th style="text-align:left">Objectif pédagogique</th>
      <th style="text-align:center;width:70px">Non atteint</th>
      <th style="text-align:center;width:70px">Partiellement atteint</th>
      <th style="text-align:center;width:70px">Atteint</th>
      <th style="text-align:center;width:80px">Commentaire</th>
    </tr>
  </thead>
  <tbody>
    ${lignesEvalAcquis}
  </tbody>
</table>

<div class="grid2" style="margin-top:8px">
  <div class="field-block">
    <label>Points forts identifiés :</label>
    <div class="field-line" style="min-height:50px">&nbsp;</div>
  </div>
  <div class="field-block">
    <label>Axes de progression / Recommandations :</label>
    <div class="field-line" style="min-height:50px">&nbsp;</div>
  </div>
</div>

<div class="sig-section" style="margin-top:10px">
  <div class="sig-box">
    <div class="sig-title">Visa du formateur</div>
    <p style="font-size:9.5pt"><strong>${dossier.nomFormateur || formation.nomFormateur || organisme.nom}</strong></p>
    <p style="font-size:9pt;margin-top:4px">Date : ____/____/________</p>
    <div class="sig-line"></div>
  </div>
  <div class="sig-box">
    <div class="sig-title">Visa du stagiaire</div>
    <p style="font-size:9.5pt"><strong>${client.civilite || ""} ${client.prenom} ${client.nom}</strong></p>
    <p style="font-size:9pt;margin-top:4px">Date : ____/____/________</p>
    <div class="sig-line"></div>
  </div>
</div>

<div style="border-top:3px double #003366;margin:20px 0 16px;"></div>

<!-- PARTIE 2 : QUESTIONNAIRE DE SATISFACTION -->
<h2>Partie 2 — Questionnaire de satisfaction à chaud</h2>
<p style="font-size:9.5pt;margin:4px 0 8px;color:#555">
  Rempli par le <strong>stagiaire seul</strong>, de façon anonyme si souhaité, à l'issue de la formation.
  Vos retours nous permettent d'améliorer en continu la qualité de nos formations (Qualiopi — Indicateur 8).
</p>

<table>
  <thead>
    <tr>
      <th style="text-align:left">Question</th>
      <th style="text-align:center;width:50px;font-size:8.5pt">Très insuffisant<br>1</th>
      <th style="text-align:center;width:50px;font-size:8.5pt">Insuffisant<br>2</th>
      <th style="text-align:center;width:50px;font-size:8.5pt">Satisfaisant<br>3</th>
      <th style="text-align:center;width:50px;font-size:8.5pt">Bien<br>4</th>
      <th style="text-align:center;width:50px;font-size:8.5pt">Très bien<br>5</th>
    </tr>
  </thead>
  <tbody>
    ${lignesSatisfaction}
  </tbody>
</table>

<div style="margin-top:10px">
  <div class="field-block">
    <label>Ce que vous avez le plus apprécié dans cette formation :</label>
    <div class="field-line" style="min-height:40px">&nbsp;</div>
  </div>
  <div class="field-block">
    <label>Ce qui pourrait être amélioré (contenu, organisation, méthodes…) :</label>
    <div class="field-line" style="min-height:40px">&nbsp;</div>
  </div>
  <div class="field-block">
    <label>Commentaires libres / Suggestions :</label>
    <div class="field-line" style="min-height:40px">&nbsp;</div>
  </div>
</div>

<div class="sig-section" style="margin-top:10px">
  <div class="sig-box">
    <div class="sig-title">Signature du stagiaire (optionnelle)</div>
    <p style="font-size:9pt">Complété le : ____/____/________</p>
    <div class="sig-line"></div>
  </div>
  <div class="sig-box" style="background:#f9f9f9">
    <div class="sig-title">Réservé à l'organisme — Traitement</div>
    <p style="font-size:9pt">Note globale calculée : _______ / 5</p>
    <p style="font-size:9pt;margin-top:4px">Actions correctives identifiées : ☐ Oui ☐ Non</p>
    <p style="font-size:9pt;margin-top:4px">Traité le : __/__/______ — Par : _____________________</p>
  </div>
</div>

<div class="footer">${organisme.nom} | SIRET ${organisme.siret} | NDA ${organisme.nda || "en cours"} | Qualiopi N° ${organisme.qualiopi} | Dossier ${dossier.numero}</div>`;

  return htmlWrapper(`Évaluation — ${formation.intitule} — ${dossier.numero}`, content);
}

// ── 7. ATTESTATION D'ASSIDUITÉ ET DE RÈGLEMENT (modèle officiel AGEFICE) ──
export function generateAttestation(dossier: DossierData, organisme: OrganismeData): string {
  const client = dossier.client;
  const formation = dossier.formation;

  // Durées prévues et réalisées
  const durees = [
    { label: "Durée en présentiel individuel¹", prevue: dossier.dureePresIndividuel ?? formation.dureePresIndividuel ?? null, realisee: dossier.dureePresIndividuelRealisee },
    { label: "Durée en présentiel collectif²", prevue: dossier.dureePresCollectif ?? formation.dureePresCollectif ?? null, realisee: dossier.dureePresCollectifRealisee },
    { label: "Durée en distanciel synchrone³", prevue: dossier.dureeDistSynchrone ?? formation.dureeDistSynchrone ?? null, realisee: dossier.dureeDistSynchroneRealisee },
    { label: "Durée en distanciel asynchrone⁴", prevue: dossier.dureeDistAsynchrone ?? formation.dureeDistAsynchrone ?? null, realisee: dossier.dureeDistAsynchroneRealisee },
  ];

  const montantLettres = nombreEnLettres(dossier.montantHT);

  const content = `
${orgHeader(organisme)}
<h1>Attestation d'assiduité de formation et de règlement</h1>
<p style="text-align:center;font-size:9pt;color:#555;margin-bottom:12px">Modèle AGEFICE — 2025/2026 — Dossier N° ${dossier.numero}</p>

<p style="margin:10px 0;font-size:10.5pt;line-height:1.7">
  Je soussigné(e) <strong>${organisme.responsablePrenom} ${organisme.responsableNom}</strong>
  agissant en qualité de <strong>${organisme.responsableQualite}</strong>
  de <strong>${organisme.nom}</strong>
  enregistré sous le numéro de déclaration d'activité
  <strong>${organisme.nda || "……………………"}</strong>
  auprès de la DREETS/DRIEETS/DEETS de <strong>${organisme.dreets}</strong>, atteste que :
</p>

<ul style="margin:8px 0 12px 24px;font-size:10.5pt;line-height:1.8">
  <li><strong>Madame ou Monsieur :</strong> ${client.civilite || ""} ${client.prenom} ${client.nom}</li>
  <li><strong>de :</strong> ${client.statutJuridique} — ${client.siret} — ${client.activitePrincipale || client.codeApe}</li>
  <li>a bien suivi l'action de formation telle que détaillée ci-dessous</li>
</ul>

<h3>Formation concernée</h3>
<table>
  <tr><td class="label">Intitulé de formation</td><td>${formation.intitule}</td></tr>
  <tr><td class="label">Date de démarrage</td><td>${fmt(dossier.dateDebut)}</td></tr>
  <tr><td class="label">Date de fin</td><td>${fmt(dossier.dateFin)}</td></tr>
  <tr><td class="label">Nom et qualité du formateur</td><td>${dossier.nomFormateur || formation.nomFormateur || "………………………………………………"}</td></tr>
  <tr><td class="label">Nombre de participants</td><td>${dossier.nombreParticipants}</td></tr>
</table>

<table class="duree-table" style="margin-top:10px">
  <thead>
    <tr><th style="text-align:left">Durée en heure(s)</th><th>Prévue</th><th>Réalisée</th></tr>
  </thead>
  <tbody>
    ${durees.map(d => `
    <tr>
      <td>${d.label}</td>
      <td>${d.prevue !== null && d.prevue !== undefined ? d.prevue + "h" : "&nbsp;"}</td>
      <td>${d.realisee !== null && d.realisee !== undefined ? d.realisee + "h" : "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"}</td>
    </tr>`).join("")}
    <tr style="font-weight:bold;background:#f0f4f8">
      <td>Total</td>
      <td>${formation.dureeHeures}h</td>
      <td>&nbsp;</td>
    </tr>
  </tbody>
</table>

<p style="margin:12px 0;font-size:10pt;line-height:1.6">
  L'organisme de formation assure avoir réalisé la formation conformément aux modalités détaillées dans la demande préalable de financement
  et/ou dans la convention de formation signée avec le stagiaire, et dans le respect des critères de financement de l'AGEFICE.
  Il assure avoir fourni la double assistance technique et pédagogique prévue par les textes et s'engage à conserver l'ensemble des pièces justificatives.
</p>

<div style="border:2px solid #ffc107;background:#fffde7;padding:10px 14px;margin:12px 0;font-size:10pt">
  <strong>Si la facture acquittée n'est pas transmise :</strong><br>
  J'atteste également que le bénéficiaire de cette action a bien réglé la totalité du coût pédagogique H.T.
  (ou de sa participation au coût pédagogique H.T.) pour un montant de :<br>
  <strong>${fmtMontant(dossier.montantHT)}</strong> — <em>${montantLettres}</em><br>
  payé par <strong>${dossier.modeReglement || "………………………………"}</strong>
  en date du <strong>${dossier.dateReglement ? fmt(dossier.dateReglement) : "____/____/________"}</strong>
</div>

<p style="font-size:9pt;color:#555;margin:8px 0">
  L'AGEFICE se réserve le droit de suspendre les paiements en cas de non-conformité, de procéder à tout signalement
  auprès des autorités compétentes et d'initier toutes procédures, y compris juridictionnelles, en cas de fausses déclarations.
</p>

<div class="sig-section">
  <div class="sig-box">
    <div class="sig-title">L'organisme de formation</div>
    <p><strong>${organisme.nom}</strong></p>
    <p style="font-size:9pt;margin-top:4px">${organisme.responsableCivilite} ${organisme.responsableNom} ${organisme.responsablePrenom}</p>
    <p style="font-size:9pt;margin-top:6px">Fait à <strong>${organisme.ville || "______________________"}</strong></p>
    <p style="font-size:9pt;margin-top:4px">Le ____/____/________</p>
    <p style="font-size:9pt;margin-top:6px">Signature et cachet :</p>
    <div class="sig-line"></div>
  </div>
  <div class="sig-box">
    <div class="sig-title">Le stagiaire</div>
    <p><strong>${client.civilite || ""} ${client.prenom} ${client.nom}</strong></p>
    <p style="font-size:9pt;margin-top:4px">${client.statutJuridique} — SIRET ${client.siret}</p>
    <p style="font-size:9pt;margin-top:6px">Fait à _______________________</p>
    <p style="font-size:9pt;margin-top:4px">Le ____/____/________</p>
    <p style="font-size:9pt;margin-top:6px">Signature et cachet :</p>
    <div class="sig-line"></div>
  </div>
</div>

<div class="note-loi" style="margin-top:14px">
  <sup>1</sup> Formateur et stagiaires nécessairement réunis physiquement en un même lieu<br>
  <sup>2</sup> Plus d'un stagiaire même s'ils appartiennent à la même entreprise<br>
  <sup>3</sup> Formateur et stagiaires nécessairement réunis en temps réel sur des plages horaires préalablement définies (classe virtuelle, visioconférence)<br>
  <sup>4</sup> Bénéficiant d'un suivi logiciel des temps de connexion en temps réel avec horaire, durée et adresse IP
</div>
<div class="footer">${organisme.nom} | SIRET ${organisme.siret} | NDA ${organisme.nda || "en cours"} | Qualiopi N° ${organisme.qualiopi}</div>`;
  return htmlWrapper(`Attestation d'assiduité — ${dossier.numero}`, content);
}

// ── 8. FACTURE ACQUITTÉE ──────────────────────────────────────────────────
export function generateFacture(dossier: DossierData, organisme: OrganismeData): string {
  const client = dossier.client;
  const formation = dossier.formation;
  const adresseClient = [client.adresse, client.codePostal, client.ville].filter(Boolean).join(", ");
  const numFacture = `FACT-${dossier.numero.replace("AGF-", "")}`;

  // Calcul remise
  const remiseMt = dossier.remiseMontant ?? (dossier.remisePourcent ? dossier.montantHT * dossier.remisePourcent / 100 : 0);
  const montantHTApresRemise = dossier.montantHT - remiseMt;
  const montantTTCApresRemise = montantHTApresRemise * (1 + dossier.tauxTVA / 100);

  // Financement
  const TYPES_FIN: Record<string, string> = {
    agefice: "AGEFICE", cpf: "CPF", opco: "OPCO", region: "Région / Collectivité",
    france_travail: "France Travail", autofinancement: "Autofinancement", autre: "Autre financeur",
  };
  const nomFinanceur = dossier.nomFinanceur || (dossier.typeFinancement ? TYPES_FIN[dossier.typeFinancement] : null);
  const plafond = formation.plafondAGEFICE;
  const montantPriseEnCharge = dossier.montantPriseEnCharge
    ?? (plafond && !dossier.typeFinancement || dossier.typeFinancement === "agefice"
        ? Math.min(montantTTCApresRemise, plafond ?? montantTTCApresRemise)
        : null);
  const resteCharge = montantPriseEnCharge != null
    ? Math.max(0, montantTTCApresRemise - montantPriseEnCharge)
    : null;

  const content = `
${orgHeader(organisme)}
<h1>Facture acquittée</h1>

<div class="grid2" style="margin:14px 0">
  <div>
    <h3>Émetteur</h3>
    <strong>${organisme.nom}</strong><br>
    SIRET : ${organisme.siret}<br>
    NDA : ${organisme.nda || "en cours"} | Qualiopi N° ${organisme.qualiopi}<br>
    ${organisme.adresse}, ${organisme.codePostal} ${organisme.ville}<br>
    ${organisme.telephone} | ${organisme.email}<br>
    ${organisme.tva ? "TVA : " + organisme.tva : "TVA non applicable — Art. 261.4.4° CGI"}
  </div>
  <div style="text-align:right">
    <div style="font-size:9pt;color:#555">N° de facture</div>
    <div style="font-size:16pt;font-weight:bold;color:#003366">${numFacture}</div>
    <div style="font-size:9pt;color:#555;margin-top:6px">Date d'émission</div>
    <div style="font-weight:bold">${fmt(new Date())}</div>
    <div style="font-size:9pt;color:#555;margin-top:6px">Dossier N°</div>
    <div style="font-weight:bold">${dossier.numero}</div>
  </div>
</div>

<h3>Destinataire (Client)</h3>
<table>
  <tr><td class="label">Nom / Prénom</td><td><strong>${client.civilite || ""} ${client.prenom} ${client.nom}</strong></td></tr>
  <tr><td class="label">Statut / SIRET</td><td>${client.statutJuridique} — ${client.siret}</td></tr>
  <tr><td class="label">Code APE</td><td>${client.codeApe}</td></tr>
  <tr><td class="label">Adresse</td><td>${adresseClient}</td></tr>
  <tr><td class="label">Email</td><td>${client.email}</td></tr>
</table>

<h2>Détail de la prestation</h2>
<table>
  <thead>
    <tr>
      <th>Désignation</th>
      <th style="width:60px;text-align:center">Qté</th>
      <th style="width:130px;text-align:right">Prix unitaire H.T.</th>
      <th style="width:130px;text-align:right">Montant H.T.</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>
        <strong>${formation.intitule}</strong><br>
        <small>Réf. ${formation.reference} | ${formation.dureeHeures}h | Formateur : ${dossier.nomFormateur || formation.nomFormateur || "—"}</small><br>
        <small>Du ${fmt(dossier.dateDebut)} au ${fmt(dossier.dateFin)} | ${MODALITES_LABEL[dossier.modalite] || dossier.modalite}</small>
      </td>
      <td style="text-align:center">1</td>
      <td style="text-align:right">${fmtMontant(dossier.montantHT)}</td>
      <td style="text-align:right">${fmtMontant(dossier.montantHT)}</td>
    </tr>
    ${remiseMt > 0 ? `
    <tr style="color:#c00">
      <td><em>Remise commerciale${dossier.remisePourcent ? ` (${dossier.remisePourcent}%)` : ""}</em></td>
      <td></td>
      <td></td>
      <td style="text-align:right">− ${fmtMontant(remiseMt)}</td>
    </tr>` : ""}
  </tbody>
</table>

<table style="margin-top:6px;width:50%;margin-left:auto">
  ${remiseMt > 0 ? `<tr><td class="label">Montant H.T. brut</td><td style="text-align:right">${fmtMontant(dossier.montantHT)}</td></tr>
  <tr><td class="label">Remise (${dossier.remisePourcent ?? ""}%)</td><td style="text-align:right;color:#c00">− ${fmtMontant(remiseMt)}</td></tr>` : ""}
  <tr><td class="label">Total H.T. net</td><td style="text-align:right">${fmtMontant(montantHTApresRemise)}</td></tr>
  <tr><td class="label">TVA (${dossier.tauxTVA}%)</td><td style="text-align:right">${fmtMontant(montantTTCApresRemise - montantHTApresRemise)}</td></tr>
  <tr class="montant-highlight">
    <td style="font-weight:bold;padding:6px 8px">Total T.T.C.</td>
    <td style="font-weight:bold;text-align:right;font-size:13pt;padding:6px 8px;color:#003366">${fmtMontant(montantTTCApresRemise)}</td>
  </tr>
</table>
<p style="font-size:8pt;color:#555;margin:4px 0">TVA non applicable — Art. 261.4.4° du Code Général des Impôts (organisme de formation professionnelle continue).</p>

${nomFinanceur || montantPriseEnCharge ? `
<div class="info-box" style="margin-top:12px">
  <strong>Financement :</strong>
  ${nomFinanceur ? `Financeur : <strong>${nomFinanceur}</strong>` : ""}
  ${montantPriseEnCharge ? ` | Montant pris en charge : <strong>${fmtMontant(montantPriseEnCharge)}</strong>` : ""}
  ${resteCharge != null && resteCharge > 0 ? ` | Reste à charge du bénéficiaire : <strong>${fmtMontant(resteCharge)}</strong>` : ""}
  ${resteCharge === 0 ? " | <span style='color:#007700'>Intégralement pris en charge</span>" : ""}
</div>` : ""}

<div style="text-align:center;border:2px solid #003366;padding:12px;margin:16px 0;background:#e8f0fe">
  <div style="font-size:16pt;font-weight:bold;color:#003366">✓ FACTURE ACQUITTÉE</div>
  <div style="font-size:10pt;margin-top:6px">
    Paiement reçu de <strong>${client.prenom} ${client.nom}</strong>
    par <strong>${dossier.modeReglement || "virement bancaire"}</strong>
    le <strong>${dossier.dateReglement ? fmt(dossier.dateReglement) : fmt(new Date())}</strong>
  </div>
  <div style="font-size:9pt;color:#555;margin-top:4px">
    La facture acquittée est une preuve comptable et juridique (Art. 1353 du Code civil) attestant que le paiement a été effectué en totalité par le bénéficiaire.
  </div>
</div>

<div class="sig-box" style="max-width:300px">
  <div class="sig-title">Cachet et signature de l'organisme</div>
  <p>${organisme.responsableCivilite} ${organisme.responsableNom} ${organisme.responsablePrenom}</p>
  <p style="font-size:9pt;margin-top:4px">Fait à ${organisme.ville}, le ${fmt(new Date())}</p>
  <div class="sig-line"></div>
</div>

<div class="footer">${organisme.nom} | SIRET ${organisme.siret} | NDA ${organisme.nda || "en cours"} | Qualiopi N° ${organisme.qualiopi} | ${organisme.email}</div>`;
  return htmlWrapper(`Facture ${numFacture} — ${dossier.numero}`, content);
}

export type DocType =
  | "proposition_commerciale"
  | "devis"
  | "formulaire"
  | "convention"
  | "convocation"
  | "programme"
  | "feuille_emargement"
  | "evaluation"
  | "attestation"
  | "facture"
  | "plan_developpement_competences";

// ── PLAN DE DÉVELOPPEMENT DES COMPÉTENCES ────────────────────────────────────
// Format des lignes FAMILLE dans le champ notes du dossier :
// FAMILLE: {nom} | {effectif} | {postes} | {besoins} | {compétences visées} | {modalités}
// Exemple :
// FAMILLE: Administration et gestion | 11 | Secrétaire, responsables | Tâches récurrentes | Rédiger avec IA | Tronc commun + 2 ateliers

interface BlocCompetencePDC {
  titre:     string;
  objectifs: string;
}

interface JourPlanningPDC {
  jour:       number;
  duree_h:    number;
  matin:      string;
  apres_midi: string;
  bloc:       string;
}

interface FamilleMetiers {
  nom:                string;
  effectif:           number;
  postes:             string;
  besoins:            string;
  competences:        string;
  blocs_competences?: BlocCompetencePDC[];
  modalites:          string;
  planning_jours?:    JourPlanningPDC[];
}

function parseFamillesFromNotes(notes: string | null, defaultEffectif: number, formation: DossierData["formation"]): FamilleMetiers[] {
  const familles: FamilleMetiers[] = [];
  if (notes) {
    const lines = notes.split("\n");
    for (const line of lines) {
      if (line.trim().toUpperCase().startsWith("FAMILLE:")) {
        const raw = line.replace(/^FAMILLE\s*:/i, "").trim();
        const parts = raw.split("|").map((p) => p.trim());
        if (parts.length >= 2) {
          familles.push({
            nom:         parts[0] || "Ensemble des salariés",
            effectif:    parseInt(parts[1]) || 0,
            postes:      parts[2] || "",
            besoins:     parts[3] || "",
            competences: parts[4] || "",
            modalites:   parts[5] || "Tronc commun + atelier de mise en pratique",
          });
        }
      }
    }
  }

  if (!familles.length) {
    // Famille unique par défaut
    familles.push({
      nom:         "Ensemble des salariés",
      effectif:    defaultEffectif,
      postes:      formation.publicCible || "Salariés de l'entreprise",
      besoins:     "Monter en compétences sur les usages de l'IA dans les tâches quotidiennes",
      competences: formation.objectifs
        ? formation.objectifs.slice(0, 200)
        : "Identifier et utiliser les outils d'IA générative dans le contexte professionnel",
      modalites:   "Tronc commun + atelier de mise en pratique métier",
    });
  }
  return familles;
}

function getNoteTexteLibre(notes: string | null): string {
  if (!notes) return "";
  // Retourner les lignes qui ne sont PAS des lignes FAMILLE
  return notes
    .split("\n")
    .filter((l) => !l.trim().toUpperCase().startsWith("FAMILLE:"))
    .join("\n")
    .trim();
}

// PDCContent peut être fourni par generatePDCAsync (Claude) ou généré en fallback
export interface PDCContent {
  intro:    string;
  methodo:  string;
  familles: FamilleMetiers[];
}

export function generatePlanDeveloppementCompetences(
  dossier: DossierData,
  organisme: OrganismeData,
  content?: PDCContent
): string {
  const client    = dossier.client;
  const formation = dossier.formation;
  const familles  = content?.familles ?? parseFamillesFromNotes(dossier.notes, dossier.nombreParticipants, formation);
  const totalEffectif = familles.reduce((s, f) => s + f.effectif, 0) || dossier.nombreParticipants;
  const nomEntreprise = client.nomCommercial || `${client.prenom} ${client.nom}`.trim();
  const texteLibre    = getNoteTexteLibre(dossier.notes);

  // Contexte formation
  const titreFormation = formation.intitule;
  const dureeH         = formation.dureeHeures;
  const modaliteLabel  = MODALITES_LABEL[formation.modalite] || formation.modalite;

  // Groupements particuliers (familles regroupées si même modalité atelier partagée)
  const famillesGroupees = familles.filter((f) => f.modalites.toLowerCase().includes("mutualis"));
  const descGroupements  = famillesGroupees.length > 1
    ? `Dans l'organisation retenue à ce stade, les fonctions ${famillesGroupees.map((f) => f.nom.toLowerCase()).join(" et ")} sont regroupées dans un atelier commun, portant à ${famillesGroupees.reduce((s, f) => s + f.effectif, 0)} participants l'effectif de cette session mutualisée.`
    : "";

  const CSS_PDC = `
.pdc-intro { font-size: 10.5pt; line-height: 1.6; text-align: justify; margin: 12px 0 16px; color: #222; }
.pdc-method { background: #f8f9fa; border-left: 4px solid #003366; padding: 12px 16px; margin: 10px 0 16px; font-size: 10pt; line-height: 1.6; color: #333; }
.pdc-method p { margin-bottom: 8px; }
.pdc-synthese th { font-size: 9pt; padding: 6px 8px; }
.pdc-synthese td { font-size: 9pt; padding: 5px 8px; vertical-align: top; line-height: 1.45; }
.pdc-synthese tr:nth-child(even) td { background: #f5f8ff; }
.famille-nom { font-weight: bold; color: #003366; }
.effectif-badge { display: inline-block; background: #003366; color: white; border-radius: 12px;
                  padding: 2px 8px; font-size: 8.5pt; font-weight: bold; }
.synthese-bullets { background: #e8f0fe; border: 1px solid #c7d9f5; padding: 8px 12px; margin: 14px 0 6px; font-size: 9.5pt; }
.synthese-bullets li { margin: 3px 0 3px 16px; }
/* ── Sections détail ── */
.pdc-famille-detail { border: 1px solid #c7d9f5; border-radius: 6px; margin: 18px 0; padding: 0; page-break-inside: avoid; }
.pdc-famille-header { background: #003366; color: white; padding: 8px 14px; border-radius: 5px 5px 0 0; display: flex; justify-content: space-between; align-items: center; }
.pdc-famille-header .fnom { font-size: 11pt; font-weight: bold; }
.pdc-famille-header .feff { background: rgba(255,255,255,0.25); border-radius: 10px; padding: 2px 10px; font-size: 9pt; }
.pdc-famille-body { padding: 12px 14px; }
.pdc-blocs-title { font-size: 9.5pt; font-weight: bold; color: #003366; text-transform: uppercase; letter-spacing: .5px; margin: 10px 0 6px; border-bottom: 1px solid #dde8f8; padding-bottom: 3px; }
.pdc-blocs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 8px; margin-bottom: 14px; }
.pdc-bloc-card { background: #f0f5ff; border: 1px solid #b8d0f0; border-radius: 4px; padding: 8px 10px; }
.pdc-bloc-card .bc-titre { font-size: 9pt; font-weight: bold; color: #003366; margin-bottom: 4px; }
.pdc-bloc-card .bc-obj { font-size: 8.5pt; line-height: 1.5; color: #333; }
.pdc-planning th { font-size: 8.5pt; background: #e8f0fe; color: #003366; padding: 5px 8px; text-align: left; }
.pdc-planning td { font-size: 8.5pt; padding: 5px 8px; vertical-align: top; line-height: 1.45; border-bottom: 1px solid #e8eef8; }
.pdc-planning .jour-num { font-weight: bold; color: #003366; white-space: nowrap; }
.pdc-planning .duree-badge { display: inline-block; background: #003366; color: white; border-radius: 8px; padding: 1px 7px; font-size: 8pt; }
.pdc-planning .seq-matin { background: #fffde7; border-left: 3px solid #f9a825; }
.pdc-planning .seq-apm { background: #e8f5e9; border-left: 3px solid #43a047; }
.pdc-planning .bloc-ref { font-size: 7.5pt; color: #6678aa; font-style: italic; }
`;

  const lignesTableau = familles.map((f) => `
<tr>
  <td><span class="famille-nom">${f.nom}</span></td>
  <td style="text-align:center"><span class="effectif-badge">${f.effectif}</span></td>
  <td>${f.postes}</td>
  <td>${f.besoins}</td>
  <td>${f.competences}</td>
  <td>${f.modalites}</td>
</tr>`).join("");

  // ── Sections détail par famille (blocs + planning) ───────────────────────
  const detailFamilles = familles.map((fam) => {
    // Blocs de compétences
    const blocsHtml = fam.blocs_competences && fam.blocs_competences.length > 0
      ? `<div class="pdc-blocs-title">Compétences visées — bloc par bloc</div>
<div class="pdc-blocs-grid">
${fam.blocs_competences.map((b) => `  <div class="pdc-bloc-card">
    <div class="bc-titre">${b.titre}</div>
    <div class="bc-obj">${b.objectifs}</div>
  </div>`).join("\n")}
</div>`
      : `<div class="pdc-blocs-title">Compétences visées</div>
<p style="font-size:9pt;margin:4px 0 12px">${fam.competences}</p>`;

    // Modalités prévues (résumé uniquement)
    const planningHtml = `<div class="pdc-blocs-title">Modalités prévues</div>
<p style="font-size:9pt;margin:4px 0 6px">${fam.modalites}</p>`;

    return `<div class="pdc-famille-detail">
  <div class="pdc-famille-header">
    <span class="fnom">${fam.nom}</span>
    <span class="feff">${fam.effectif} participant${fam.effectif > 1 ? "s" : ""} — ${fam.postes}</span>
  </div>
  <div class="pdc-famille-body">
    ${blocsHtml}
    ${planningHtml}
  </div>
</div>`;
  }).join("\n");

  // ── Intro paragraph ──────────────────────────────────────────────────────
  const introHtml = content?.intro
    ? `<p>${content.intro.replace(/\n/g, "<br>")}</p>`
    : `<p>Dans le cadre de son plan de développement des compétences, <strong>${nomEntreprise}</strong> souhaite
  engager l'ensemble des salariés identifiés dans une montée en compétences progressive sur les usages
  professionnels de la formation <em>« ${titreFormation} »</em> (${dureeH} heures — ${modaliteLabel}).
  À ce stade du projet, la base de travail repose sur <strong>${totalEffectif} salarié${totalEffectif > 1 ? "s" : ""}</strong>
  répartis selon leurs fonctions au sein de la structure. Le dispositif proposé s'appuie sur un socle
  commun de formation, complété par des mises en application adaptées aux principales familles de métiers.</p>`;

  // ── Methodo paragraph ─────────────────────────────────────────────────────
  const methodoHtml = content?.methodo
    ? `<p>${content.methodo.replace(/\n/g, "<br>")}</p>`
    : `<p>Le plan de développement des compétences est construit sur l'hypothèse d'un niveau d'entrée
  <strong>débutant</strong> pour l'ensemble des salariés. Cette hypothèse justifie la mise en place d'un
  <strong>tronc commun</strong> préalable, destiné à apporter à tous les participants une base partagée.
  À partir de ce socle, la formation est déclinée par <strong>familles de métiers</strong>, afin de
  garantir l'adaptation des contenus aux situations de travail rencontrées dans la structure.
  ${descGroupements}</p>`;

  const htmlContent = `
${orgHeader(organisme)}

<h1>Plan de développement des compétences</h1>
<h2 style="text-align:center;background:none;color:#003366;border-bottom:2px solid #003366;padding:4px 0 8px;font-size:13pt;">${nomEntreprise}</h2>

<div class="pdc-intro">
  ${introHtml}
  ${texteLibre ? `<p style="margin-top:8px;">${texteLibre.replace(/\n/g, "<br>")}</p>` : ""}
</div>

<h2>Commentaire méthodologique</h2>
<div class="pdc-method">
  ${methodoHtml}
  <p>Le dispositif permet ainsi de combiner :</p>
</div>

<ul class="synthese-bullets">
  <li>une <strong>acculturation commune</strong> à l'intelligence artificielle pour l'ensemble des salariés identifiés ;</li>
  <li>une <strong>adaptation par familles de métiers</strong> aux usages et situations professionnelles spécifiques ;</li>
  <li>une mise en œuvre réaliste, avec des groupes cohérents au regard des effectifs actuellement connus.</li>
</ul>

<h2>Tableau de synthèse</h2>
<table class="pdc-synthese">
  <thead>
    <tr>
      <th style="width:16%">Famille de métiers</th>
      <th style="width:8%">Effectif concerné</th>
      <th style="width:18%">Postes concernés</th>
      <th style="width:18%">Besoins repérés</th>
      <th style="width:22%">Compétences visées</th>
      <th style="width:18%">Modalités prévues</th>
    </tr>
  </thead>
  <tbody>
    ${lignesTableau}
    <tr style="background:#e8f0fe">
      <td colspan="1" style="font-weight:bold;border-top:2px solid #003366">TOTAL</td>
      <td style="text-align:center;font-weight:bold;border-top:2px solid #003366">
        <span class="effectif-badge">${totalEffectif}</span>
      </td>
      <td colspan="4" style="border-top:2px solid #003366;color:#555;font-size:8.5pt;font-style:italic">
        Formation dispensée par <strong>${organisme.nom}</strong> — certifié Qualiopi n° ${organisme.qualiopi || "en cours"}
      </td>
    </tr>
  </tbody>
</table>

<h2>Détail par famille de métiers</h2>
${detailFamilles}

<div class="footer">
  Document établi par ${organisme.nom} — SIRET ${organisme.siret} — NDA ${organisme.nda || "En cours"} — Qualiopi n° ${organisme.qualiopi || "—"}
</div>`;

  return htmlWrapper(`PDC — ${nomEntreprise}`, `<style>${CSS_PDC}</style>${htmlContent}`);
}

// ── PROPOSITION COMMERCIALE ───────────────────────────────────────────────────
export function generatePropositionCommerciale(
  dossier: DossierData,
  organisme: OrganismeData,
  content?: import("@/lib/generateProposal").ProposalContent
): string {
  const client    = dossier.client;
  const formation = dossier.formation;
  const nomClient = client.nomCommercial || `${client.prenom} ${client.nom}`.trim();
  const dirigeant = `${client.civilite || ""} ${client.prenom} ${client.nom}`.trim();

  // Coût pédagogique
  const tarifUnitaire = formation.formationEnEntreprise ? formation.tarifIntraHT : formation.tarifInterHT;
  const coutHT        = tarifUnitaire * dossier.nombreParticipants;
  const plafond       = formation.plafondAGEFICE;
  const montantAGEFICE = plafond ? Math.min(coutHT, plafond) : null;
  const resteCharge   = montantAGEFICE ? coutHT - montantAGEFICE : coutHT;

  const nbJours = Math.ceil(formation.dureeHeures / 7);

  // Phases depuis le contenu IA ou fallback
  const phases = content?.phases ?? [
    { titre: "Formation complète", description: formation.objectifs || formation.intitule, livrables: ["Support de formation", "Attestation Qualiopi"] },
  ];
  const benefices = content?.benefices ?? ["Compétences opérationnelles immédiatement applicables", "Certification Qualiopi reconnue"];
  const memo = content?.memo ?? `${nomClient} s'engage dans la formation « ${formation.intitule} » avec ${organisme.nom}.`;
  const problematique = content?.problematique ?? "";
  const approche = content?.approche ?? "";
  const accroche_fin = content?.accroche_fin ?? "Investir dans la formation, c'est bâtir l'avantage de demain.";

  // Couleurs AIssociate
  const NAVY   = "#1a1a3e";
  const BLUE   = "#1F4E79";
  const ACCENT = "#e8b84b";  // or doré
  const LIGHT  = "#f0f4f8";

  // ── Helpers visuels ──────────────────────────────────────────────────────
  function mirrorText(t: string) {
    return t.split(" ").map(w => w.split("").reverse().join("")).join(" ").toUpperCase();
  }

  function sectionHeader(title: string, subtitle?: string) {
    return `<div class="section-header">
  <div class="section-header-inner">
    <div class="section-watermark">${mirrorText(title)}</div>
    <div>
      <h2 class="section-title">${title}</h2>
      ${subtitle ? `<p class="section-subtitle">${subtitle}</p>` : ""}
    </div>
  </div>
</div>`;
  }

  function serviceCard(icon: string, title: string, desc: string) {
    return `<div class="service-card">
  <div class="service-icon">${icon}</div>
  <div class="service-title">${title}</div>
  <div class="service-desc">${desc}</div>
</div>`;
  }

  function phaseCard(num: number, phase: { titre: string; description: string; livrables: string[] }) {
    return `<div class="phase-card">
  <div class="phase-num">${num.toString().padStart(2, "0")}</div>
  <div class="phase-body">
    <div class="phase-titre">${phase.titre}</div>
    <div class="phase-desc">${phase.description}</div>
    <ul class="phase-livrables">
      ${phase.livrables.map(l => `<li>✓ ${l}</li>`).join("")}
    </ul>
  </div>
</div>`;
  }

  const CSS = `
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Segoe UI', Arial, sans-serif; color: #222; background: #fff; }

/* ── PAGE LAYOUT ── */
.page { width: 100%; min-height: 100vh; position: relative; page-break-after: always; overflow: hidden; }
.page:last-child { page-break-after: avoid; }

/* ── COVER ── */
.cover {
  background: linear-gradient(145deg, ${NAVY} 0%, ${BLUE} 60%, #2c5f8a 100%);
  color: white;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 0;
}
.cover-top { display: flex; justify-content: space-between; align-items: center; padding: 32px 48px 0; }
.cover-logo { height: 48px; object-fit: contain; filter: brightness(0) invert(1); }
.cover-label { font-size: 9pt; letter-spacing: 3px; text-transform: uppercase; opacity: .6; }
.cover-main { flex: 1; display: flex; flex-direction: column; justify-content: center; padding: 40px 48px; }
.cover-tag { display: inline-block; background: ${ACCENT}; color: ${NAVY}; font-size: 9pt; font-weight: 800;
  letter-spacing: 3px; text-transform: uppercase; padding: 6px 16px; border-radius: 2px; margin-bottom: 28px; }
.cover-title { font-size: 42pt; font-weight: 900; line-height: 1.05; letter-spacing: -1px; margin-bottom: 8px; }
.cover-title span { color: ${ACCENT}; }
.cover-divider { width: 60px; height: 4px; background: ${ACCENT}; border-radius: 2px; margin: 24px 0; }
.cover-for { font-size: 10pt; opacity: .7; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px; }
.cover-client { font-size: 22pt; font-weight: 700; }
.cover-meta { font-size: 10pt; opacity: .6; margin-top: 8px; }
.cover-memo { max-width: 520px; font-size: 11pt; line-height: 1.7; opacity: .88;
  background: rgba(255,255,255,.08); border-left: 3px solid ${ACCENT}; padding: 16px 20px; margin-top: 32px;
  border-radius: 0 4px 4px 0; }
.cover-bottom { display: flex; justify-content: space-between; align-items: flex-end;
  padding: 24px 48px; border-top: 1px solid rgba(255,255,255,.15); margin-top: auto; }
.cover-author { font-size: 9pt; opacity: .65; }
.cover-author strong { display: block; font-size: 11pt; opacity: 1; color: white; margin-bottom: 2px; }
.cover-date { font-size: 9pt; opacity: .5; text-align: right; }

/* ── CONTENT PAGES ── */
.content-page { padding: 56px 64px; background: #fff; }
.page-logo-bar { display: flex; justify-content: space-between; align-items: center;
  border-bottom: 2px solid ${NAVY}; padding-bottom: 12px; margin-bottom: 40px; }
.page-logo-bar img { height: 32px; object-fit: contain; }
.page-logo-bar .page-num { font-size: 8.5pt; color: #999; font-weight: 600; letter-spacing: 1px; }

/* ── SECTION HEADERS ── */
.section-header { margin-bottom: 32px; }
.section-header-inner { position: relative; overflow: hidden; }
.section-watermark {
  position: absolute; right: -10px; top: -8px;
  font-size: 36pt; font-weight: 900; color: ${NAVY}; opacity: .05;
  letter-spacing: -2px; white-space: nowrap; transform: scaleX(-1);
  pointer-events: none; user-select: none;
}
.section-title { font-size: 24pt; font-weight: 900; color: ${NAVY}; line-height: 1.1; }
.section-subtitle { font-size: 10.5pt; color: #666; margin-top: 6px; line-height: 1.5; max-width: 540px; }
.section-accent-bar { width: 48px; height: 4px; background: ${ACCENT}; border-radius: 2px; margin: 12px 0 24px; }

/* ── QUI SOMMES NOUS ── */
.intro-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; align-items: start; }
.intro-text { font-size: 11pt; line-height: 1.8; color: #333; }
.intro-badges { display: flex; flex-direction: column; gap: 12px; }
.intro-badge { display: flex; align-items: center; gap: 12px; background: ${LIGHT}; border-radius: 8px; padding: 14px 16px; }
.intro-badge-icon { font-size: 20pt; flex-shrink: 0; }
.intro-badge-text { font-size: 9.5pt; line-height: 1.4; color: ${NAVY}; font-weight: 600; }

/* ── SERVICES GRID ── */
.services-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 8px; }
.service-card { background: ${LIGHT}; border-radius: 8px; padding: 18px 16px; border-top: 3px solid ${NAVY}; }
.service-icon { font-size: 22pt; margin-bottom: 10px; }
.service-title { font-size: 9.5pt; font-weight: 800; color: ${NAVY}; text-transform: uppercase;
  letter-spacing: .5px; margin-bottom: 6px; }
.service-desc { font-size: 8.5pt; line-height: 1.5; color: #555; }

/* ── PROBLÉMATIQUE ── */
.prob-box { background: linear-gradient(135deg, ${NAVY} 0%, ${BLUE} 100%); color: white;
  border-radius: 12px; padding: 32px 36px; margin-bottom: 24px; }
.prob-box p { font-size: 11pt; line-height: 1.8; opacity: .9; }
.prob-title { font-size: 13pt; font-weight: 800; color: ${ACCENT}; margin-bottom: 12px;
  text-transform: uppercase; letter-spacing: 1px; }

/* ── APPROCHE ── */
.approche-box { background: ${LIGHT}; border-left: 4px solid ${ACCENT}; border-radius: 0 8px 8px 0;
  padding: 20px 24px; margin-bottom: 24px; }
.approche-box p { font-size: 11pt; line-height: 1.7; color: #333; }

/* ── PHASES ── */
.phases-list { display: flex; flex-direction: column; gap: 16px; }
.phase-card { display: flex; gap: 20px; background: #fff; border: 1px solid #e2e8f0;
  border-radius: 10px; padding: 20px 24px; box-shadow: 0 1px 4px rgba(0,0,0,.06); }
.phase-num { font-size: 36pt; font-weight: 900; color: ${NAVY}; opacity: .15;
  line-height: 1; flex-shrink: 0; width: 64px; padding-top: 4px; text-align: center; }
.phase-body { flex: 1; }
.phase-titre { font-size: 12pt; font-weight: 800; color: ${NAVY}; margin-bottom: 6px; }
.phase-desc { font-size: 10pt; line-height: 1.6; color: #444; margin-bottom: 10px; }
.phase-livrables { list-style: none; display: flex; flex-wrap: wrap; gap: 6px; }
.phase-livrables li { font-size: 8.5pt; background: #e8f0fe; color: ${NAVY}; border-radius: 20px;
  padding: 3px 12px; font-weight: 600; }

/* ── MÉTHODOLOGIE ── */
.methodo-steps { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-top: 8px; }
.methodo-step { text-align: center; padding: 18px 12px; }
.methodo-step-num { width: 40px; height: 40px; background: ${NAVY}; color: white; border-radius: 50%;
  font-size: 13pt; font-weight: 800; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; }
.methodo-step-title { font-size: 9pt; font-weight: 700; color: ${NAVY}; margin-bottom: 5px; text-transform: uppercase; letter-spacing: .5px; }
.methodo-step-desc { font-size: 8pt; line-height: 1.5; color: #666; }
.methodo-connector { display: flex; align-items: center; justify-content: center; font-size: 18pt; color: ${ACCENT}; padding-top: 18px; }
.qualiopi-badge { display: flex; align-items: center; gap: 16px; background: linear-gradient(135deg, ${NAVY}, ${BLUE});
  color: white; border-radius: 10px; padding: 18px 24px; margin-top: 24px; }
.qualiopi-badge-icon { font-size: 28pt; flex-shrink: 0; }
.qualiopi-badge-text h4 { font-size: 11pt; font-weight: 800; margin-bottom: 4px; }
.qualiopi-badge-text p { font-size: 9pt; opacity: .8; line-height: 1.5; }

/* ── BÉNÉFICES ── */
.benefices-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 8px; }
.benefice-item { display: flex; align-items: flex-start; gap: 12px; padding: 14px 16px;
  background: ${LIGHT}; border-radius: 8px; border-left: 3px solid ${ACCENT}; }
.benefice-icon { font-size: 16pt; flex-shrink: 0; margin-top: 2px; }
.benefice-text { font-size: 10pt; line-height: 1.5; color: #333; font-weight: 500; }

/* ── ÉQUIPE ── */
.team-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-top: 8px; }
.team-card { background: ${LIGHT}; border-radius: 10px; padding: 20px 20px 16px; text-align: center; }
.team-avatar { width: 56px; height: 56px; background: linear-gradient(135deg, ${NAVY}, ${BLUE}); color: white;
  border-radius: 50%; font-size: 18pt; font-weight: 800; display: flex; align-items: center;
  justify-content: center; margin: 0 auto 10px; }
.team-name { font-size: 11pt; font-weight: 800; color: ${NAVY}; margin-bottom: 2px; }
.team-role { font-size: 9pt; color: #666; }
.team-mission { font-size: 8.5pt; line-height: 1.5; color: #444; margin-top: 8px;
  border-top: 1px solid #dde; padding-top: 8px; }

/* ── BUDGET ── */
.budget-table { width: 100%; border-collapse: collapse; margin-top: 12px; }
.budget-table th { background: ${NAVY}; color: white; padding: 10px 14px; text-align: left;
  font-size: 9.5pt; font-weight: 700; }
.budget-table td { padding: 10px 14px; font-size: 9.5pt; border-bottom: 1px solid #e8eef8; vertical-align: top; }
.budget-table tr:nth-child(even) td { background: ${LIGHT}; }
.budget-table .total-row td { background: ${NAVY}; color: white; font-weight: 800; font-size: 10.5pt; border: none; }
.budget-table .agefice-row td { background: #e8f5e9; color: #2e7d32; font-weight: 700; }
.budget-table .reste-row td { background: #fff3e0; color: #e65100; font-weight: 700; }
.financement-note { background: #e8f0fe; border: 1px solid #b8d0f0; border-radius: 6px;
  padding: 14px 18px; margin-top: 16px; font-size: 9.5pt; line-height: 1.6; color: ${NAVY}; }
.financement-note strong { font-size: 10pt; }

/* ── CLOSING ── */
.closing-page {
  background: linear-gradient(145deg, ${NAVY} 0%, ${BLUE} 100%);
  color: white; min-height: 100vh; display: flex; flex-direction: column;
  justify-content: center; align-items: center; text-align: center; padding: 60px 48px;
}
.closing-tag { font-size: 9pt; letter-spacing: 3px; text-transform: uppercase; opacity: .6; margin-bottom: 20px; }
.closing-accroche { font-size: 22pt; font-weight: 900; max-width: 580px; line-height: 1.3;
  margin: 0 auto 16px; }
.closing-accroche span { color: ${ACCENT}; }
.closing-divider { width: 60px; height: 4px; background: ${ACCENT}; border-radius: 2px; margin: 28px auto; }
.closing-contacts { display: flex; gap: 32px; justify-content: center; flex-wrap: wrap; margin: 24px 0; }
.closing-contact { font-size: 10.5pt; opacity: .85; }
.closing-contact strong { display: block; color: ${ACCENT}; font-size: 8.5pt;
  text-transform: uppercase; letter-spacing: 1px; margin-bottom: 3px; opacity: 1; }
.closing-logo { height: 44px; filter: brightness(0) invert(1); margin-top: 32px; opacity: .7; }
.closing-cta { display: inline-block; background: ${ACCENT}; color: ${NAVY};
  font-weight: 800; font-size: 10pt; padding: 14px 36px; border-radius: 4px;
  text-decoration: none; letter-spacing: 1px; text-transform: uppercase; margin: 24px 0; }

@media print {
  .page { page-break-after: always; }
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
`;

  const now = new Date();
  const logoSrc = "/logo-aissociate.png";

  // ── PAGE 1 : Couverture ────────────────────────────────────────────────────
  const pageCover = `
<div class="page cover">
  <div class="cover-top">
    <img src="${logoSrc}" class="cover-logo" alt="${organisme.nom}" onerror="this.style.display='none'">
    <div class="cover-label">${organisme.nom} &nbsp;·&nbsp; Formation professionnelle certifiée Qualiopi</div>
  </div>
  <div class="cover-main">
    <div class="cover-tag">Proposition commerciale</div>
    <div class="cover-title">
      ${formation.intitule.split(" ").slice(0, 3).join("<br>")}<br>
      <span>${formation.intitule.split(" ").slice(3).join(" ")}</span>
    </div>
    <div class="cover-divider"></div>
    <div class="cover-for">Rédigé pour</div>
    <div class="cover-client">${nomClient}</div>
    <div class="cover-meta">${dirigeant} &nbsp;·&nbsp; ${client.statutJuridique} &nbsp;·&nbsp; SIRET ${client.siret}</div>
    <div class="cover-memo">${memo}</div>
  </div>
  <div class="cover-bottom">
    <div class="cover-author">
      <strong>${organisme.responsableCivilite} ${organisme.responsablePrenom} ${organisme.responsableNom}</strong>
      ${organisme.responsableQualite} — ${organisme.nom}
    </div>
    <div class="cover-date">
      ${format(now, "MMMM yyyy", { locale: fr })}<br>
      <span style="font-size:8pt;opacity:.4">Réf. dossier ${dossier.numero}</span>
    </div>
  </div>
</div>`;

  // ── PAGE 2 : Qui sommes-nous ───────────────────────────────────────────────
  const pageAbout = `
<div class="page content-page">
  <div class="page-logo-bar">
    <img src="${logoSrc}" alt="${organisme.nom}" onerror="this.style.display='none'">
    <span class="page-num">Qui sommes-nous</span>
  </div>
  ${sectionHeader("Qui sommes-nous ?")}
  <div class="section-accent-bar"></div>
  <div class="intro-grid">
    <div class="intro-text">
      <p>${organisme.nom} accompagne les chefs d'entreprise et leurs équipes dans leur montée en compétences professionnelles, avec une approche concrète et orientée résultats.</p>
      <br>
      <p>Basé à ${organisme.ville}, ${organisme.dreets || "La Réunion"}, nous intervenons auprès des TPE et PME locales pour les aider à transformer les défis en opportunités grâce à la formation.</p>
      <br>
      <p>Notre certification <strong>Qualiopi</strong> garantit un processus pédagogique rigoureux, audité et reconnu au niveau national — gage de qualité pour vous et condition d'accès aux financements publics.</p>
    </div>
    <div class="intro-badges">
      <div class="intro-badge">
        <div class="intro-badge-icon">🏆</div>
        <div class="intro-badge-text">Certifié Qualiopi n° ${organisme.qualiopi || "en cours"} — Label national de qualité des organismes de formation</div>
      </div>
      <div class="intro-badge">
        <div class="intro-badge-icon">📍</div>
        <div class="intro-badge-text">Ancré localement — Formateurs experts du tissu économique de ${organisme.dreets || "La Réunion"}</div>
      </div>
      <div class="intro-badge">
        <div class="intro-badge-icon">🎯</div>
        <div class="intro-badge-text">Approche ROI — Formations conçues pour produire des résultats mesurables en entreprise</div>
      </div>
      <div class="intro-badge">
        <div class="intro-badge-icon">💰</div>
        <div class="intro-badge-text">Financement AGEFICE — Accompagnement complet du montage de votre dossier de prise en charge</div>
      </div>
    </div>
  </div>
</div>`;

  // ── PAGE 3 : Ce que nous faisons ──────────────────────────────────────────
  const pageServices = `
<div class="page content-page">
  <div class="page-logo-bar">
    <img src="${logoSrc}" alt="${organisme.nom}" onerror="this.style.display='none'">
    <span class="page-num">Ce que nous faisons</span>
  </div>
  ${sectionHeader("Ce que nous faisons", "Des formations opérationnelles, immédiatement applicables à votre activité")}
  <div class="section-accent-bar"></div>
  <div class="services-grid">
    ${serviceCard("🎓", "Formations métier", "Programmes ciblés sur les compétences clés pour votre secteur d'activité et vos enjeux concrets.")}
    ${serviceCard("🤖", "IA & Transformation digitale", "Intégration des outils d'intelligence artificielle dans vos processus pour gagner en efficacité.")}
    ${serviceCard("📈", "Performance commerciale", "Techniques de vente, négociation et développement client adaptées aux TPE/PME locales.")}
    ${serviceCard("⚙️", "Optimisation des processus", "Automatisation, organisation et productivité pour absorber la croissance sans perdre le contrôle.")}
    ${serviceCard("📊", "Pilotage par la data", "Tableaux de bord, KPIs et prise de décision basée sur les données pour des résultats mesurables.")}
    ${serviceCard("🌐", "Présence digitale", "Site web, réseaux sociaux, SEO et acquisition client en ligne pour renforcer votre visibilité locale.")}
  </div>
  <div style="margin-top:28px">
    <div class="prob-box">
      <div class="prob-title">La problématique identifiée</div>
      <p>${problematique}</p>
    </div>
    <div class="approche-box">
      <p><strong>Notre réponse :</strong> ${approche}</p>
    </div>
  </div>
</div>`;

  // ── PAGE 4 : Programme & Stratégie ────────────────────────────────────────
  const pageProgramme = `
<div class="page content-page">
  <div class="page-logo-bar">
    <img src="${logoSrc}" alt="${organisme.nom}" onerror="this.style.display='none'">
    <span class="page-num">La stratégie de formation</span>
  </div>
  ${sectionHeader("La stratégie de formation", `« ${formation.intitule} » — ${formation.dureeHeures}h sur ${nbJours} jour${nbJours > 1 ? "s" : ""}`)}
  <div class="section-accent-bar"></div>

  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:28px">
    <div style="background:${LIGHT};border-radius:8px;padding:14px 16px;text-align:center">
      <div style="font-size:22pt;font-weight:900;color:${NAVY}">${formation.dureeHeures}h</div>
      <div style="font-size:8.5pt;color:#666;text-transform:uppercase;letter-spacing:.5px">Durée totale</div>
    </div>
    <div style="background:${LIGHT};border-radius:8px;padding:14px 16px;text-align:center">
      <div style="font-size:22pt;font-weight:900;color:${NAVY}">${nbJours}j</div>
      <div style="font-size:8.5pt;color:#666;text-transform:uppercase;letter-spacing:.5px">Jours de formation</div>
    </div>
    <div style="background:${LIGHT};border-radius:8px;padding:14px 16px;text-align:center">
      <div style="font-size:22pt;font-weight:900;color:${NAVY}">${dossier.nombreParticipants}</div>
      <div style="font-size:8.5pt;color:#666;text-transform:uppercase;letter-spacing:.5px">Participant${dossier.nombreParticipants > 1 ? "s" : ""}</div>
    </div>
  </div>

  <div class="phases-list">
    ${phases.map((p, i) => phaseCard(i + 1, p)).join("")}
  </div>
</div>`;

  // ── PAGE 5 : Méthodologie ─────────────────────────────────────────────────
  const pageMethodo = `
<div class="page content-page">
  <div class="page-logo-bar">
    <img src="${logoSrc}" alt="${organisme.nom}" onerror="this.style.display='none'">
    <span class="page-num">Méthodologie</span>
  </div>
  ${sectionHeader("Méthodologie", "Une approche pédagogique rigoureuse, orientée pratique et mesurable")}
  <div class="section-accent-bar"></div>

  <div class="methodo-steps">
    <div class="methodo-step">
      <div class="methodo-step-num">1</div>
      <div class="methodo-step-title">Diagnostic</div>
      <div class="methodo-step-desc">Analyse de vos besoins et du niveau initial des participants</div>
    </div>
    <div class="methodo-step">
      <div class="methodo-step-num">2</div>
      <div class="methodo-step-title">Conception</div>
      <div class="methodo-step-desc">Programme adapté à votre contexte métier et vos objectifs</div>
    </div>
    <div class="methodo-step">
      <div class="methodo-step-num">3</div>
      <div class="methodo-step-title">Formation</div>
      <div class="methodo-step-desc">Sessions alternant apports théoriques et ateliers pratiques</div>
    </div>
    <div class="methodo-step">
      <div class="methodo-step-num">4</div>
      <div class="methodo-step-title">Évaluation</div>
      <div class="methodo-step-desc">Mesure des acquis et remise de l'attestation Qualiopi</div>
    </div>
  </div>

  <div class="qualiopi-badge" style="margin-top:28px">
    <div class="qualiopi-badge-icon">✅</div>
    <div class="qualiopi-badge-text">
      <h4>Certification Qualiopi — Marque de la République Française</h4>
      <p>Notre organisme est certifié Qualiopi n° ${organisme.qualiopi || "en cours"} — certification délivrée par la DREETS ${organisme.dreets || ""}. Elle atteste de la qualité du processus mis en œuvre et est obligatoire pour accéder aux financements publics et mutualisés (AGEFICE, OPCO, CPF).</p>
    </div>
  </div>

  <div style="margin-top:28px">
    ${sectionHeader("Bénéfices attendus", "Ce que cette formation va concrètement changer pour vous")}
    <div class="section-accent-bar"></div>
    <div class="benefices-grid">
      ${benefices.map((b, i) => {
        const icons = ["🚀", "⏱️", "💡", "🎯", "💰", "📊", "🔧"];
        return `<div class="benefice-item">
  <div class="benefice-icon">${icons[i % icons.length]}</div>
  <div class="benefice-text">${b}</div>
</div>`;
      }).join("")}
    </div>
  </div>
</div>`;

  // ── PAGE 6 : Notre équipe ─────────────────────────────────────────────────
  const resp = organisme.responsableNom + " " + organisme.responsablePrenom;
  const respInitials = ((organisme.responsablePrenom[0] || "") + (organisme.responsableNom[0] || "")).toUpperCase() || "OF";
  const formInitials = (dossier.nomFormateur || formation.nomFormateur || "F").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  const pageEquipe = `
<div class="page content-page">
  <div class="page-logo-bar">
    <img src="${logoSrc}" alt="${organisme.nom}" onerror="this.style.display='none'">
    <span class="page-num">Notre équipe</span>
  </div>
  ${sectionHeader("Notre équipe", "Des experts au service de votre réussite")}
  <div class="section-accent-bar"></div>
  <div class="team-grid">
    <div class="team-card">
      <div class="team-avatar">${respInitials}</div>
      <div class="team-name">${organisme.responsableCivilite} ${resp.trim()}</div>
      <div class="team-role">${organisme.responsableQualite}</div>
      <div class="team-mission">Pilote la stratégie pédagogique, coordonne la formation et assure le suivi personnalisé de chaque dossier client.</div>
    </div>
    ${dossier.nomFormateur || formation.nomFormateur ? `<div class="team-card">
      <div class="team-avatar">${formInitials}</div>
      <div class="team-name">${dossier.nomFormateur || formation.nomFormateur}</div>
      <div class="team-role">Formateur expert</div>
      <div class="team-mission">Anime les sessions de formation « ${formation.intitule} », apporte son expertise terrain et assure la progression des participants.</div>
    </div>` : `<div class="team-card">
      <div class="team-avatar">🎓</div>
      <div class="team-name">Formateur Expert</div>
      <div class="team-role">Spécialiste ${formation.thematique || "formation"}</div>
      <div class="team-mission">Expert sélectionné pour cette formation, il apporte une expertise terrain directement applicable à votre activité.</div>
    </div>`}
    <div class="team-card" style="grid-column:1/-1">
      <div style="display:flex;align-items:center;gap:20px">
        <div style="flex:1">
          <div style="font-size:10pt;font-weight:700;color:${NAVY};margin-bottom:8px">Modèle d'accompagnement IA propriétaire</div>
          <p style="font-size:9pt;line-height:1.6;color:#555">Notre approche intègre les dernières avancées en intelligence artificielle pour personnaliser les parcours de formation, optimiser les contenus et mesurer en temps réel la progression des apprenants. Validé BPI France IA Booster.</p>
        </div>
        <div style="font-size:40pt;flex-shrink:0">🤖</div>
      </div>
    </div>
  </div>
</div>`;

  // ── PAGE 7 : Budget ───────────────────────────────────────────────────────
  const pageBudget = `
<div class="page content-page">
  <div class="page-logo-bar">
    <img src="${logoSrc}" alt="${organisme.nom}" onerror="this.style.display='none'">
    <span class="page-num">Budget prévisionnel</span>
  </div>
  ${sectionHeader("Budget prévisionnel", "Un investissement rentable, avec possibilité de prise en charge AGEFICE")}
  <div class="section-accent-bar"></div>

  <table class="budget-table">
    <thead>
      <tr>
        <th style="width:45%">Prestation</th>
        <th>Durée</th>
        <th>Participants</th>
        <th>P.U. HT</th>
        <th style="text-align:right">Total HT</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>${formation.intitule}</strong><br><span style="font-size:8pt;color:#666">Réf. ${formation.reference} — ${MODALITES_LABEL[dossier.modalite] || dossier.modalite}</span></td>
        <td>${formation.dureeHeures}h</td>
        <td>${dossier.nombreParticipants} pers.</td>
        <td>${fmtMontant(tarifUnitaire)}</td>
        <td style="text-align:right;font-weight:700">${fmtMontant(coutHT)}</td>
      </tr>
      <tr class="total-row">
        <td colspan="4">Coût pédagogique total HT</td>
        <td style="text-align:right">${fmtMontant(coutHT)}</td>
      </tr>
      ${montantAGEFICE ? `<tr class="agefice-row">
        <td colspan="4">💚 Prise en charge AGEFICE (estimée)</td>
        <td style="text-align:right">- ${fmtMontant(montantAGEFICE)}</td>
      </tr>
      <tr class="reste-row">
        <td colspan="4">🔶 Reste à charge estimé</td>
        <td style="text-align:right">${fmtMontant(resteCharge)}</td>
      </tr>` : ""}
    </tbody>
  </table>

  <div class="financement-note">
    <strong>💡 Prise en charge AGEFICE</strong><br>
    En tant que chef d'entreprise affilié à la Chambre de Métiers ou relevant du régime des TNS, vous êtes potentiellement éligible à une prise en charge AGEFICE
    ${plafond ? ` jusqu'à <strong>${fmtMontant(plafond)}</strong> par an` : ""}.
    ${organisme.nom} vous accompagne dans la constitution complète du dossier de financement, sans frais supplémentaires.
  </div>

  <div style="margin-top:20px;background:${LIGHT};border-radius:8px;padding:18px 20px">
    <div style="font-size:10pt;font-weight:700;color:${NAVY};margin-bottom:8px">Modalités de règlement</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:9.5pt;color:#444">
      <div>📅 <strong>Démarrage :</strong> dès validation de la présente proposition</div>
      <div>💳 <strong>Mode :</strong> Virement bancaire${organisme.iban ? ` — IBAN <span style="font-family:monospace">${organisme.iban}</span>` : ""}</div>
      <div>📅 <strong>Dates :</strong> ${fmt(dossier.dateDebut)} → ${fmt(dossier.dateFin)}</div>
      <div>📍 <strong>Lieu :</strong> ${[dossier.lieuFormationVille || organisme.ville].filter(Boolean).join(", ")}</div>
    </div>
  </div>
</div>`;

  // ── PAGE 8 : Closing ──────────────────────────────────────────────────────
  const pageClosing = `
<div class="page closing-page">
  <div class="closing-tag">Merci de votre confiance</div>
  <div class="closing-accroche">
    ${accroche_fin.replace(/([^.!?]+[.!?])\s/, '$1<br><span>')}${accroche_fin.includes('<span>') ? '' : '</span>'}
  </div>
  <div class="closing-divider"></div>
  <div class="closing-contacts">
    ${organisme.telephone ? `<div class="closing-contact"><strong>Téléphone</strong>${organisme.telephone}</div>` : ""}
    ${organisme.email ? `<div class="closing-contact"><strong>Email</strong>${organisme.email}</div>` : ""}
    ${organisme.site ? `<div class="closing-contact"><strong>Site web</strong>${organisme.site}</div>` : ""}
    ${organisme.ville ? `<div class="closing-contact"><strong>Localisation</strong>${organisme.ville}, ${organisme.dreets || ""}</div>` : ""}
  </div>
  <img src="${logoSrc}" class="closing-logo" alt="${organisme.nom}" onerror="this.style.display='none'">
  <div style="margin-top:20px;font-size:8.5pt;opacity:.4">
    ${organisme.nom} — SIRET ${organisme.siret} — NDA ${organisme.nda || "en cours"} — Qualiopi N° ${organisme.qualiopi || "—"} — Dossier ${dossier.numero}
  </div>
</div>`;

  const fullHtml = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Proposition Commerciale — ${formation.intitule} — ${nomClient}</title>
<style>${CSS}</style>
</head>
<body>
${pageCover}
${pageAbout}
${pageServices}
${pageProgramme}
${pageMethodo}
${pageEquipe}
${pageBudget}
${pageClosing}
</body>
</html>`;

  return fullHtml;
}

// ── DEVIS ─────────────────────────────────────────────────────────────────────
function generateDevis(dossier: DossierData, organisme: OrganismeData): string {
  const client = dossier.client;
  const formation = dossier.formation;

  // Coût pédagogique depuis la formation (même logique que formulaire)
  const tarifUnitaire = formation.formationEnEntreprise ? formation.tarifIntraHT : formation.tarifInterHT;
  const coutPedagoHT  = tarifUnitaire * dossier.nombreParticipants;
  const remisePct     = (dossier as any).remisePourcent ?? 0;
  const remiseMontant = Math.round(coutPedagoHT * remisePct / 100 * 100) / 100;
  const netHT         = coutPedagoHT - remiseMontant;
  const montantTVA    = Math.round(netHT * (dossier.tauxTVA / 100) * 100) / 100;
  const montantTTC    = netHT + montantTVA;

  // Validité 30 jours
  const dateDevis   = new Date();
  const dateValidite = new Date(dateDevis);
  dateValidite.setDate(dateValidite.getDate() + 30);

  const lieuFormation = [dossier.lieuFormationAdresse, dossier.lieuFormationCodePostal, dossier.lieuFormationVille]
    .filter(Boolean).join(", ") || [organisme.adresse, organisme.codePostal, organisme.ville].filter(Boolean).join(", ");

  const content = `
${orgHeader(organisme)}
<h1>Devis</h1>

<table style="width:100%;margin-bottom:16px">
  <tr>
    <td style="width:50%;vertical-align:top">
      <strong style="font-size:10pt">Établi à l'attention de :</strong><br>
      <strong>${client.civilite || ""} ${client.prenom} ${client.nom}</strong><br>
      ${client.nomCommercial ? `${client.nomCommercial}<br>` : ""}
      ${client.statutJuridique} — SIRET ${client.siret}<br>
      ${[client.adresse, client.codePostal, client.ville].filter(Boolean).join(", ")}<br>
      ${client.email}${client.telephone ? ` — ${client.telephone}` : ""}
    </td>
    <td style="width:50%;vertical-align:top;text-align:right">
      <table style="margin-left:auto;border:none">
        <tr><td class="label" style="text-align:right">N° Devis</td><td style="font-weight:bold">DEVIS-${dossier.numero}</td></tr>
        <tr><td class="label" style="text-align:right">Date</td><td>${fmt(dateDevis)}</td></tr>
        <tr><td class="label" style="text-align:right">Valable jusqu'au</td><td style="color:#b45309;font-weight:bold">${fmt(dateValidite)}</td></tr>
      </table>
    </td>
  </tr>
</table>

<h2>Objet de la prestation</h2>
<table>
  <tr><td class="label">Formation</td><td><strong>${formation.intitule}</strong></td></tr>
  <tr><td class="label">Référence</td><td>${formation.reference}</td></tr>
  <tr><td class="label">Date de début</td><td>${fmt(dossier.dateDebut)}</td></tr>
  <tr><td class="label">Date de fin</td><td>${fmt(dossier.dateFin)}</td></tr>
  <tr><td class="label">Durée</td><td><strong>${formation.dureeHeures} heures</strong></td></tr>
  <tr><td class="label">Modalité</td><td>${MODALITES_LABEL[dossier.modalite] || dossier.modalite}</td></tr>
  <tr><td class="label">Lieu</td><td>${lieuFormation || "À préciser"}</td></tr>
  <tr><td class="label">Formateur</td><td>${dossier.nomFormateur || formation.nomFormateur || "À préciser"}</td></tr>
  <tr><td class="label">Nombre de participants</td><td>${dossier.nombreParticipants}</td></tr>
</table>

<h2>Détail financier</h2>
<table style="width:100%;margin:12px 0">
  <thead>
    <tr>
      <th style="text-align:left;width:55%">Désignation</th>
      <th style="text-align:center;width:15%">Qté</th>
      <th style="text-align:right;width:15%">P.U. HT</th>
      <th style="text-align:right;width:15%">Montant HT</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>
        <strong>${formation.intitule}</strong><br>
        <span style="font-size:8.5pt;color:#555">Formation ${MODALITES_LABEL[dossier.modalite] || dossier.modalite} — ${formation.dureeHeures}h — Réf. ${formation.reference}</span>
      </td>
      <td style="text-align:center">${dossier.nombreParticipants} pers.</td>
      <td style="text-align:right">${fmtMontant(tarifUnitaire)}</td>
      <td style="text-align:right">${fmtMontant(coutPedagoHT)}</td>
    </tr>
    ${remisePct > 0 ? `<tr>
      <td colspan="3" style="text-align:right;font-style:italic;color:#555">Remise commerciale (${remisePct}%)</td>
      <td style="text-align:right;color:#b45309">- ${fmtMontant(remiseMontant)}</td>
    </tr>` : ""}
  </tbody>
  <tfoot>
    <tr style="border-top:2px solid #003366">
      <td colspan="3" style="text-align:right;font-weight:bold;padding-top:6px">Total HT</td>
      <td style="text-align:right;font-weight:bold;padding-top:6px">${fmtMontant(netHT)}</td>
    </tr>
    <tr>
      <td colspan="3" style="text-align:right;color:#555">TVA ${dossier.tauxTVA}%${dossier.tauxTVA === 0 ? " (exonéré — Art. 261-4-4° CGI)" : ""}</td>
      <td style="text-align:right;color:#555">${dossier.tauxTVA === 0 ? "—" : fmtMontant(montantTVA)}</td>
    </tr>
    <tr style="background:#003366;color:white">
      <td colspan="3" style="text-align:right;font-weight:bold;font-size:11pt;padding:7px 8px">Total TTC</td>
      <td style="text-align:right;font-weight:bold;font-size:11pt;padding:7px 8px">${fmtMontant(montantTTC)}</td>
    </tr>
  </tfoot>
</table>

${(dossier as any).typeFinancement && (dossier as any).typeFinancement !== "autofinancement" ? `
<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:4px;padding:10px 14px;margin:10px 0;font-size:9.5pt">
  <strong>Financement prévu :</strong> ${(dossier as any).typeFinancement === "agefice" ? "Prise en charge AGEFICE" : (dossier as any).nomFinanceur || (dossier as any).typeFinancement}
  ${(dossier as any).montantPriseEnCharge ? ` — Montant pris en charge : <strong>${fmtMontant((dossier as any).montantPriseEnCharge)}</strong>` : ""}
</div>` : ""}

<h2>Conditions de règlement</h2>
<table>
  <tr><td class="label">Mode de règlement</td><td>Virement bancaire</td></tr>
  <tr><td class="label">Échéances</td><td>50 % à la signature du présent devis — 50 % à l'issue de la formation</td></tr>
  ${organisme.iban ? `<tr><td class="label">IBAN</td><td style="font-family:monospace;letter-spacing:.5px"><strong>${organisme.iban}</strong></td></tr>` : ""}
  <tr><td class="label">Bénéficiaire</td><td>${organisme.nom} — SIRET ${organisme.siret}</td></tr>
</table>

<p style="font-size:9pt;margin:12px 0;color:#555;font-style:italic">
  En application de l'article L6353-3 du Code du travail, une convention de formation vous sera transmise dès validation du présent devis.
  Toute annulation moins de 10 jours ouvrés avant le début de la formation pourra faire l'objet d'une facturation partielle.
</p>

<div class="sig-section" style="margin-top:24px">
  <div class="sig-box">
    <div class="sig-title">L'organisme de formation</div>
    <p><strong>${organisme.nom}</strong></p>
    <p style="font-size:9pt;margin-top:4px">${organisme.responsableCivilite} ${organisme.responsableNom} ${organisme.responsablePrenom}<br>${organisme.responsableQualite}</p>
    <p style="font-size:9pt;margin-top:6px">Fait à ${organisme.ville}, le ${fmt(new Date())}</p>
    <div class="sig-line"></div>
  </div>
  <div class="sig-box">
    <div class="sig-title">Bon pour accord — Le client</div>
    <p style="font-size:9.5pt">${client.civilite || ""} ${client.prenom} ${client.nom}<br>
    <span style="font-size:8.5pt;color:#555">${client.nomCommercial || client.statutJuridique}</span></p>
    <p style="font-size:9pt;margin-top:6px">Lu et approuvé — Fait à _____________, le ____/____/________</p>
    <div class="sig-line"></div>
  </div>
</div>

<div class="footer">${organisme.nom} | SIRET ${organisme.siret} | NDA ${organisme.nda || "en cours"} | Qualiopi N° ${organisme.qualiopi} | DEVIS-${dossier.numero}</div>`;

  return htmlWrapper(`Devis DEVIS-${dossier.numero}`, content);
}

export function generateDocument(
  type: DocType,
  dossier: DossierData,
  organisme: OrganismeData
): string {
  switch (type) {
    case "proposition_commerciale":        return generatePropositionCommerciale(dossier, organisme);
    case "devis":                          return generateDevis(dossier, organisme);
    case "formulaire":                    return generateFormulaire(dossier, organisme);
    case "convention":                    return generateConvention(dossier, organisme);
    case "convocation":                   return generateConvocation(dossier, organisme);
    case "programme":                     return generateProgramme(dossier, organisme);
    case "feuille_emargement":            return generateFeuilleEmargement(dossier, organisme);
    case "evaluation":                    return generateEvaluation(dossier, organisme);
    case "attestation":                   return generateAttestation(dossier, organisme);
    case "facture":                       return generateFacture(dossier, organisme);
    case "plan_developpement_competences": return generatePlanDeveloppementCompetences(dossier, organisme);
    default: throw new Error(`Type de document inconnu : ${type}`);
  }
}
