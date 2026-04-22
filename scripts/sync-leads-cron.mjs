/**
 * Synchronise les leads depuis le Google Sheet toutes les 10 minutes
 * entre 7h00 et 20h00, 7j/7.
 *
 * Lancement : node scripts/sync-leads-cron.mjs
 * (dans un terminal séparé pendant que Next.js tourne)
 *
 * Variables d'environnement requises (lues depuis .env via dotenv) :
 *   GOOGLE_SHEET_ID, GOOGLE_SHEETS_API_KEY
 */

import { createRequire } from "module";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// Charge .env manuellement (sans dépendance à dotenv)
try {
  const env = readFileSync(join(ROOT, ".env"), "utf8");
  for (const line of env.split("\n")) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"#\r\n]*)"?\s*$/);
    if (match) process.env[match[1]] = match[2];
  }
} catch { /* .env absent */ }

const require = createRequire(import.meta.url);
const cron = require("node-cron");

const APP_URL = process.env.APP_URL ?? "http://localhost:3000";
const SYNC_ENDPOINT = `${APP_URL}/api/leads/sync-sheet`;

function isBusinessHour() {
  const h = new Date().getHours();
  return h >= 7 && h < 20;
}

async function syncSheet() {
  if (!isBusinessHour()) return;

  const now = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  process.stdout.write(`[${now}] Synchronisation Google Sheet…`);

  try {
    const res = await fetch(SYNC_ENDPOINT);
    const data = await res.json();

    if (!res.ok) {
      console.error(` ERREUR: ${data.error ?? res.status}`);
      return;
    }

    console.log(` OK — ${data.created} créés, ${data.updated} mis à jour, ${data.skipped} ignorés`);
  } catch (e) {
    console.error(` ERREUR réseau: ${e.message}`);
  }
}

// Toutes les 10 minutes, toute la journée — la fonction vérifie elle-même l'heure
cron.schedule("*/10 * * * *", syncSheet);

console.log("=== Cron leads Google Sheet démarré ===");
console.log(`Endpoint : ${SYNC_ENDPOINT}`);
console.log("Fréquence : toutes les 10 min entre 7h00 et 20h00");
console.log("Ctrl+C pour arrêter\n");

// Première synchro immédiate au démarrage si dans les heures ouvrées
syncSheet();
