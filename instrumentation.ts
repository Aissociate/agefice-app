export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  // Démarrer le cron de sync IMAP seulement côté serveur
  const { default: cron } = await import("node-cron");

  const BASE_URL = process.env.APP_URL ?? "http://localhost:3000";

  async function syncEmails() {
    try {
      const res = await fetch(`${BASE_URL}/api/conversations/sync`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        console.log(`[IMAP sync] Erreur : ${data.error}`);
      } else if (data.imported > 0) {
        console.log(`[IMAP sync] ${data.imported} nouvelle(s) réponse(s) importée(s) pour ${data.clients} client(s)`);
      } else {
        console.log(`[IMAP sync] Aucune nouvelle réponse (${data.messages ?? 0} messages vérifiés)`);
      }
    } catch (e) {
      console.log(`[IMAP sync] Erreur réseau : ${e}`);
    }
  }

  // Toutes les 30 minutes
  cron.schedule("*/30 * * * *", syncEmails);

  console.log("[IMAP sync] Scheduler démarré — vérification toutes les 30 minutes");
}
