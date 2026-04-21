import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "path";

const dbPath = path.join(process.cwd(), "prisma", "dev.db");
const adapter = new PrismaLibSql({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // === FORMATIONS AISSOCIATE ===
  const formations = [
    {
      reference: "INTROIA1",
      intitule: "Création de contenus rédactionnels et visuels par l'usage responsable de l'intelligence artificielle générative",
      programme: "Module 1 : Mise en œuvre de la stratégie d'implémentation de l'IA Générative sur le poste de travail\n- Analyse du contexte et identification des besoins\n- Configuration des outils d'IA Générative\n- Élaboration d'un plan d'actions pour l'implémentation\n\nModule 2 : La création de contenus rédactionnels et visuels\n- Les techniques de Prompt Engineering\n- Créer des contenus rédactionnels et visuels avec l'IA Générative\n- Garantir la confidentialité des données professionnelles\n- La création de contenus inclusifs & accessibles\n\nModule 3 : La conformité éthique et réglementaire\n- Le cadre réglementaire Européen : les directives de l'IA Act\n- La protection des données personnelles (RGPD)\n- La mise en place d'une veille réglementaire",
      objectifs: "Analyser ses besoins professionnels en matière d'IA générative, utiliser des outils d'IA générative pour créer des contenus rédactionnels et visuels, appliquer les principes de confidentialité et de protection des données, produire des contenus conformes aux exigences éthiques et réglementaires, intégrer l'IA générative de manière responsable dans ses pratiques professionnelles.",
      publicCible: "Grand public",
      prerequis: "Maîtrise de base de l'outil informatique et navigation internet.",
      dureeHeures: 21,
      tarifInterHT: 1800,
      tarifIntraHT: 1800,
      modalite: "presentiel_distanciel",
      certifiant: true,
      eligibleCPF: true,
      referenceRS: "RS 7667",
      plafondAGEFICE: 1800,
    },
    {
      reference: "INTROIA2",
      intitule: "Introduction aux IA pour les PME, exploiter le potentiel des IA",
      programme: "Création et Gestion d'Agents Multi-IA : Introduction aux Agents IA pour répondre aux besoins métiers du marketing, finance, RH, comptabilité, administratif, service client.\n\nStratégies Avancées d'instructions aux IA : Apprentissage des fondamentaux concernant les instructions IA avancées, pour obtenir des résultats plus approfondis et analytiques.\n\nAtelier : Résolution de Tâches Automatisables : Application pratique des compétences acquises pour automatiser des tâches identifiées dans le questionnaire initial. Travail en groupe pour résoudre des cas réels.",
      objectifs: "Création d'Agents IA GPT, stratégies IA avancées, introduire les IA dans le workflow de l'entreprise.",
      publicCible: "Tous collaborateurs et métiers de l'entreprise (dirigeants et cadres)",
      prerequis: "Connaissance basique des outils d'IA",
      dureeHeures: 7,
      tarifInterHT: 595,
      tarifIntraHT: 545,
      modalite: "presentiel_distanciel",
      certifiant: false,
      eligibleCPF: false,
      plafondAGEFICE: 595,
    },
    {
      reference: "INTROIA3",
      intitule: "Automatisation des process des PME et intégration des Agents IA dans le workflow",
      programme: "1- Création d'Agents IA Avancés :\n- Développement d'agents spécialisés pour des tâches spécifiques\n- Techniques de déploiement multi-agents pour coordonner les fonctions\n\n2- Techniques de Prompting Stratégique :\n- Personnalisation avancée des prompts selon les besoins\n- Structuration d'interactions en plusieurs étapes\n\nAtelier : Intégration et Optimisation des Agents dans les Processus Métier\n- Cas pratiques : Automatisation de tâches métier spécifiques\n- Travail collaboratif en groupes\n- Feedback et itérations",
      objectifs: "Création d'agents IA spécialiste, intégration d'agents IA dans le workflow, stratégies avancées.",
      publicCible: "Bonne compréhension des concepts d'IA",
      prerequis: "Audit et Analyse des Processus : Identifier les tâches à optimiser et les leviers pour maximiser l'automatisation avec l'IA. Maîtrise avancée des IA.",
      dureeHeures: 14,
      tarifInterHT: 1190,
      tarifIntraHT: 1090,
      modalite: "presentiel_distanciel",
      certifiant: false,
      eligibleCPF: false,
      plafondAGEFICE: 1190,
    },
    {
      reference: "AGENTSRC",
      intitule: "L'IA pour optimiser la relation client",
      programme: "1. Introduction à l'IA et son impact sur la relation client\n2. Personnaliser l'expérience client grâce à l'IA\n3. Développer le selfcare pour renforcer l'engagement client\n4. Faciliter l'analyse des données pour des décisions éclairées\n5. Automatiser les processus de support client",
      objectifs: "Identifier les apports de l'IA à la relation client, maîtriser les outils d'IA au service de la personnalisation, l'engagement, la fidélisation, définir une stratégie d'automatisation.",
      publicCible: "Tout professionnel de la relation client, Responsable marketing, direction générale",
      prerequis: "Connaissance basique des IA",
      dureeHeures: 7,
      tarifInterHT: 595,
      tarifIntraHT: 545,
      modalite: "presentiel_distanciel",
      certifiant: false,
      eligibleCPF: false,
      plafondAGEFICE: 595,
    },
    {
      reference: "AGENTSMKG",
      intitule: "L'IA pour optimiser le marketing et la communication",
      programme: "1. Maîtriser les fondamentaux de l'IA appliquée à la communication\n2. Optimiser sa stratégie de communication avec l'IA\n3. Rédiger des prompts de qualité pour tirer le meilleur de l'IA\n4. Intégrer l'IA dans la stratégie de contenus de marque\n5. Améliorer la communication interne avec l'IA\n6. Renforcer les relations médias et gérer la communication de crise\n7. Exploiter l'IA pour les événements\n8. Maximiser l'impact des médias sociaux et blogs avec l'IA\n9. Préparer la transformation de la communication avec l'IA",
      objectifs: "Identifier les applications de l'Intelligence Artificielle dans la fonction communication, s'approprier les outils et les applications possibles dans son métier, rédiger des prompts efficaces, expérimenter différents outils IA.",
      publicCible: "Directeur et directrice de la communication, Responsable communication, Tout professionnel en communication",
      prerequis: "Connaissance basique des IA",
      dureeHeures: 14,
      tarifInterHT: 1190,
      tarifIntraHT: 1090,
      modalite: "presentiel_distanciel",
      certifiant: false,
      eligibleCPF: false,
      plafondAGEFICE: 1190,
    },
    {
      reference: "AGENTSPROSP",
      intitule: "L'IA pour optimiser la prospection commerciale",
      programme: "1 - Démystifier l'IA et ses applications commerciales\n2 - Qualifier des leads avec l'IA\n3 - Mieux engager les prospects avec l'IA générative\n4 - Organiser sa veille sur l'intelligence artificielle",
      objectifs: "Identifier le potentiel de l'IA au service de la prospection, s'approprier les cas d'usage, construire son plan d'utilisation de l'IA.",
      publicCible: "Commercial, manager commercial, responsable commercial, toute personne en charge de la stratégie de prospection commerciale.",
      prerequis: "Maîtrise basique des IA",
      dureeHeures: 7,
      tarifInterHT: 595,
      tarifIntraHT: 545,
      modalite: "presentiel_distanciel",
      certifiant: false,
      eligibleCPF: false,
      plafondAGEFICE: 595,
    },
    {
      reference: "AGENTSRH",
      intitule: "L'IA pour optimiser les ressources humaines",
      programme: "1. Comprendre les fondamentaux de l'IA appliquée aux RH\n2. Exploiter les données pour une gestion RH performante\n3. Attirer, recruter et fidéliser grâce à l'IA\n4. Développer les compétences et la formation avec l'IA\n5. Automatiser les processus RH avec l'IA\n6. Renforcer l'engagement et améliorer la qualité de vie au travail\n7. Préparer la transformation de la fonction RH\n8. Adopter une approche éthique dans l'utilisation de l'IA en RH",
      objectifs: "Découvrir les applications de l'Intelligence Artificielle dans les Ressources Humaines et exploiter les données de manière stratégique.",
      publicCible: "DRH, responsable RH, tout professionnel RH",
      prerequis: "INTROIA1",
      dureeHeures: 14,
      tarifInterHT: 1190,
      tarifIntraHT: 1090,
      modalite: "presentiel_distanciel",
      certifiant: false,
      eligibleCPF: false,
      plafondAGEFICE: 1190,
    },
    {
      reference: "AGENTSMGER",
      intitule: "L'IA au service du manager",
      programme: "1 - Identifier les bénéfices de l'intelligence artificielle pour le manager\n2 - Utiliser des outils d'IA pour manager des équipes : prise de décision, gestion des compétences\n3 - Accompagner son équipe dans la transformation liée à l'intelligence artificielle\n4 - Sensibiliser l'équipe aux enjeux d'éthique liés à l'IA",
      objectifs: "S'approprier les principes fondamentaux de l'IA générative, identifier les applications de l'IA générative pour le manager, apprendre à utiliser des outils d'IA générative pour améliorer le management de son équipe.",
      publicCible: "Manager d'équipe ou transversal.",
      prerequis: "Maîtrise basique des IA",
      dureeHeures: 7,
      tarifInterHT: 595,
      tarifIntraHT: 495,
      modalite: "presentiel_distanciel",
      certifiant: false,
      eligibleCPF: false,
      plafondAGEFICE: 595,
    },
    {
      reference: "MPBTP1",
      intitule: "Réponse aux Marchés Publics BTP : Dominez avec l'IA",
      programme: "MATINEE - Module 1 : Le cadre législatif et économique (1h)\nMATINEE - Module 2 : Décryptage du DCE (1h30)\nMATINEE - La méthodologie gagnante (45min)\nMATINEE - Etude de cas (45min)\nAPRES-MIDI - Module 3 : Rédaction assistée du Mémoire Technique par IA (1h)\nAPRES-MIDI - Module 4 : La suite logicielle Expert BTP (1h30)\nAPRES-MIDI - Module 5 : Validation Qualiopi (30min)",
      objectifs: "Réduire le temps de préparation de réponse par 3, décrypter un DCE et identifier les critères éliminatoires, rédiger un mémoire technique assisté par IA, créer un chatbot expert DCE.",
      publicCible: "Responsables d'études, Chargés d'affaires BTP, Assistants administratifs de TPE/PME du BTP",
      prerequis: "Connaissance de base des dossiers de chantier",
      dureeHeures: 7,
      tarifInterHT: 690,
      tarifIntraHT: 590,
      modalite: "presentiel_distanciel",
      certifiant: false,
      eligibleCPF: false,
      plafondAGEFICE: 690,
    },
  ];

  for (const formation of formations) {
    await prisma.formation.upsert({
      where: { reference: formation.reference },
      update: formation,
      create: formation,
    });
    console.log(`Formation créée/mise à jour : ${formation.reference} - ${formation.intitule.substring(0, 50)}...`);
  }

  // === PARAMÈTRES PAR DÉFAUT ===
  const parametres = [
    // Identité de l'organisme
    { cle: "org_nom", valeur: "AIssociate SARL", description: "Nom de l'organisme de formation", categorie: "organisme" },
    { cle: "org_siret", valeur: "99522040700010", description: "SIRET de l'organisme (14 chiffres)", categorie: "organisme" },
    { cle: "org_nda", valeur: "", description: "N° de Déclaration d'Activité (NDA) auprès de la DREETS", categorie: "organisme" },
    { cle: "org_qualiopi", valeur: "814211-1", description: "N° de certificat Qualiopi", categorie: "organisme" },
    { cle: "org_dreets", valeur: "La Réunion", description: "DREETS/DRIEETS/DEETS (région de déclaration)", categorie: "organisme" },
    { cle: "org_adresse", valeur: "", description: "Adresse de l'organisme", categorie: "organisme" },
    { cle: "org_code_postal", valeur: "97400", description: "Code postal", categorie: "organisme" },
    { cle: "org_ville", valeur: "Saint-Denis", description: "Ville", categorie: "organisme" },
    { cle: "org_email", valeur: "contact@aissociate.re", description: "Email de contact", categorie: "organisme" },
    { cle: "org_telephone", valeur: "0692246860", description: "Téléphone", categorie: "organisme" },
    { cle: "org_site", valeur: "www.aissociate.re", description: "Site web", categorie: "organisme" },
    { cle: "org_tva", valeur: "", description: "N° TVA intracommunautaire", categorie: "organisme" },
    // Responsable de l'organisme
    { cle: "org_responsable_civilite", valeur: "M.", description: "Civilité du responsable", categorie: "organisme" },
    { cle: "org_responsable_nom", valeur: "", description: "Nom du responsable", categorie: "organisme" },
    { cle: "org_responsable_prenom", valeur: "", description: "Prénom du responsable", categorie: "organisme" },
    { cle: "org_responsable_qualite", valeur: "Directeur pédagogique", description: "Qualité/fonction du responsable", categorie: "organisme" },
    { cle: "org_responsable_tel", valeur: "", description: "Téléphone du responsable", categorie: "organisme" },
    { cle: "org_responsable_mail", valeur: "", description: "Email du responsable", categorie: "organisme" },
    // Contact AGEFICE (point d'accueil)
    { cle: "org_point_accueil_nom", valeur: "AIssociate SARL", description: "Nom du point d'accueil AGEFICE", categorie: "organisme" },
    { cle: "org_point_accueil_numero", valeur: "", description: "N° du point d'accueil AGEFICE", categorie: "organisme" },
    // Règles AGEFICE
    { cle: "agefice_delai_depot_min_jours", valeur: "15", description: "Délai minimum de dépôt avant la formation (jours calendaires)", categorie: "agefice" },
    { cle: "agefice_delai_depot_max_mois", valeur: "4", description: "Délai maximum de dépôt avant la formation (mois)", categorie: "agefice" },
    { cle: "agefice_delai_remboursement_mois", valeur: "4", description: "Délai maximum de remboursement après la fin de formation (mois)", categorie: "agefice" },
    { cle: "agefice_plafond_annuel", valeur: "2000", description: "Plafond annuel de prise en charge AGEFICE (€)", categorie: "agefice" },
    // Alertes
    { cle: "alerte_delai_depot_jours", valeur: "7", description: "Seuil d'alerte avant date limite de dépôt (jours)", categorie: "alertes" },
    { cle: "alerte_delai_remboursement_jours", valeur: "14", description: "Seuil d'alerte avant date limite de remboursement (jours)", categorie: "alertes" },
    { cle: "alerte_email_actif", valeur: "true", description: "Activer les alertes par email", categorie: "alertes" },
  ];

  for (const param of parametres) {
    await prisma.parametre.upsert({
      where: { cle: param.cle },
      update: param,
      create: param,
    });
  }
  console.log(`${parametres.length} paramètres configurés.`);

  console.log("Seeding terminé !");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
