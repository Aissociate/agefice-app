-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "statutJuridique" TEXT NOT NULL,
    "siret" TEXT NOT NULL,
    "codeApe" TEXT NOT NULL,
    "adresse" TEXT,
    "codePostal" TEXT,
    "ville" TEXT,
    "email" TEXT NOT NULL,
    "telephone" TEXT,
    "dateCreation" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateMAJ" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "formations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reference" TEXT NOT NULL,
    "intitule" TEXT NOT NULL,
    "programme" TEXT NOT NULL,
    "objectifs" TEXT,
    "publicCible" TEXT,
    "prerequis" TEXT,
    "dureeHeures" REAL NOT NULL,
    "tarifInterHT" REAL NOT NULL,
    "tarifIntraHT" REAL NOT NULL,
    "modalite" TEXT NOT NULL DEFAULT 'presentiel',
    "certifiant" BOOLEAN NOT NULL DEFAULT false,
    "eligibleCPF" BOOLEAN NOT NULL DEFAULT false,
    "referenceRS" TEXT,
    "plafondAGEFICE" REAL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "dateCreation" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateMAJ" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "dossiers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numero" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "formationId" TEXT NOT NULL,
    "dateDebut" DATETIME NOT NULL,
    "dateFin" DATETIME NOT NULL,
    "montantHT" REAL NOT NULL,
    "tauxTVA" REAL NOT NULL DEFAULT 0,
    "montantTTC" REAL NOT NULL,
    "modalite" TEXT NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'en_preparation',
    "dateLimiteDepot" DATETIME NOT NULL,
    "dateLimiteRemboursement" DATETIME NOT NULL,
    "notes" TEXT,
    "dateCreation" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateMAJ" DATETIME NOT NULL,
    CONSTRAINT "dossiers_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "dossiers_formationId_fkey" FOREIGN KEY ("formationId") REFERENCES "formations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dossierId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "nomFichier" TEXT,
    "urlStockage" TEXT,
    "dateGeneration" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "signe" BOOLEAN NOT NULL DEFAULT false,
    "valide" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "documents_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "dossiers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pieces_client" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dossierId" TEXT NOT NULL,
    "typePiece" TEXT NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'manquante',
    "url" TEXT,
    "dateDepot" DATETIME,
    "commentaire" TEXT,
    CONSTRAINT "pieces_client_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "dossiers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "alertes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dossierId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "dateEcheance" DATETIME NOT NULL,
    "envoyee" BOOLEAN NOT NULL DEFAULT false,
    "dateEnvoi" DATETIME,
    "canal" TEXT NOT NULL DEFAULT 'email',
    CONSTRAINT "alertes_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "dossiers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "parametres" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cle" TEXT NOT NULL,
    "valeur" TEXT NOT NULL,
    "description" TEXT,
    "categorie" TEXT NOT NULL DEFAULT 'general'
);

-- CreateIndex
CREATE UNIQUE INDEX "clients_siret_key" ON "clients"("siret");

-- CreateIndex
CREATE UNIQUE INDEX "formations_reference_key" ON "formations"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "dossiers_numero_key" ON "dossiers"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "parametres_cle_key" ON "parametres"("cle");
