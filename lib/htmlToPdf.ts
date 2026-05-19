/**
 * Stub WebContainer-compatible.
 *
 * Le module original utilise Puppeteer (Chromium natif), incompatible avec
 * l'environnement Bolt.new / WebContainer. La génération de PDF est désactivée
 * sur Bolt — déployer sur un host Node classique (Vercel + @sparticuz/chromium,
 * VPS Docker, etc.) pour réactiver la fonctionnalité.
 */
export async function htmlToPdf(_html: string): Promise<Buffer> {
  throw new Error(
    "Génération PDF désactivée sur Bolt.new (puppeteer non supporté en WebContainer). " +
      "Déployer sur un environnement Node complet pour réactiver."
  );
}
