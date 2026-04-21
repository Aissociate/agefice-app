// ─────────────────────────────────────────────────────────────────────────────
// Recherche leads via Google Places — traitement PARALLÈLE
// Workflow : Text Search → Place Details (tél+site) → scraping email
// ─────────────────────────────────────────────────────────────────────────────

export interface PlaceLead {
  nomEntreprise: string;
  telephone: string;
  email: string;
  emailSource: "scrape" | "guess"; // "scrape" = trouvé sur le site, "guess" = deviné depuis le domaine
  siteWeb: string;
  adresse: string | null;
  codePostal: string | null;
  ville: string | null;
  secteurActivite: string;
  placesId: string;
}

// ─── Pool de requêtes par secteur ─────────────────────────────────────────────
const QUERIES_POOL: Array<{ query: string; secteur: string }> = [
  { query: "restaurant Saint-Denis La Réunion",        secteur: "Restauration / Hôtellerie" },
  { query: "restaurant Saint-Pierre La Réunion",       secteur: "Restauration / Hôtellerie" },
  { query: "boulangerie La Réunion",                   secteur: "Agro-alimentaire / Artisanat" },
  { query: "snack bar Le Tampon La Réunion",            secteur: "Restauration / Hôtellerie" },
  { query: "traiteur La Réunion",                      secteur: "Restauration / Hôtellerie" },
  { query: "hôtel La Réunion",                         secteur: "Restauration / Hôtellerie" },
  { query: "entreprise BTP Saint-Denis Réunion",       secteur: "BTP / Construction" },
  { query: "électricien La Réunion",                   secteur: "BTP / Construction" },
  { query: "plombier La Réunion",                      secteur: "BTP / Construction" },
  { query: "menuiserie La Réunion",                    secteur: "BTP / Construction" },
  { query: "peintre bâtiment La Réunion",              secteur: "BTP / Construction" },
  { query: "carreleur La Réunion",                     secteur: "BTP / Construction" },
  { query: "garage automobile La Réunion",             secteur: "Automobile" },
  { query: "carrosserie La Réunion",                   secteur: "Automobile" },
  { query: "magasin La Réunion",                       secteur: "Commerce de détail" },
  { query: "boutique habillement La Réunion",          secteur: "Commerce de détail" },
  { query: "artisan boucher La Réunion",               secteur: "Agro-alimentaire / Artisanat" },
  { query: "société transport La Réunion",             secteur: "Transport / Logistique" },
  { query: "déménagement La Réunion",                  secteur: "Transport / Logistique" },
  { query: "cabinet médical La Réunion",               secteur: "Santé / Médico-social" },
  { query: "dentiste La Réunion",                      secteur: "Santé / Médico-social" },
  { query: "société nettoyage La Réunion",             secteur: "Services aux entreprises" },
  { query: "sécurité gardiennage La Réunion",          secteur: "Services aux entreprises" },
  { query: "réparation informatique La Réunion",       secteur: "Réparation" },
  { query: "agence immobilière La Réunion",            secteur: "Immobilier" },
  { query: "restaurant Saint-André La Réunion",        secteur: "Restauration / Hôtellerie" },
  { query: "entreprise maçonnerie La Réunion",         secteur: "BTP / Construction" },
  { query: "couverture toiture La Réunion",            secteur: "BTP / Construction" },
  { query: "fleuriste La Réunion",                     secteur: "Commerce de détail" },
  { query: "pâtisserie La Réunion",                    secteur: "Agro-alimentaire / Artisanat" },
];

export function selectQueries(secteurs: string[], page: number): Array<{ query: string; secteur: string }> {
  const filtered = secteurs.length
    ? QUERIES_POOL.filter((q) =>
        secteurs.some((s) =>
          q.secteur.toLowerCase().includes(
            s === "agroalimentaire" ? "agro"       :
            s === "sante"          ? "sant"        :
            s === "btp"            ? "btp"         :
            s === "restauration"   ? "restauration":
            s === "automobile"     ? "automobile"  :
            s === "commerce"       ? "commerce"    :
            s === "transport"      ? "transport"   :
            s === "services"       ? "services"    :
            s === "reparation"     ? "réparation"  :
            s === "immobilier"     ? "immobilier"  : s
          )
        )
      )
    : QUERIES_POOL;

  const pool = filtered.length ? filtered : QUERIES_POOL;
  // 3 requêtes par appel, rotation via la page
  const offset = ((page - 1) * 3) % pool.length;
  return [
    ...pool.slice(offset, offset + 3),
    ...pool.slice(0, Math.max(0, offset + 3 - pool.length)),
  ];
}

// ─── Google Places Text Search ────────────────────────────────────────────────
interface PlacesTextResult { place_id: string; name: string; formatted_address?: string }

async function textSearch(query: string, apiKey: string): Promise<PlacesTextResult[]> {
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&region=re&key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  if (data.status === "REQUEST_DENIED") {
    throw new Error(`Google Places accès refusé — activez la facturation : https://console.cloud.google.com/billing. Détail : ${data.error_message || ""}`);
  }
  return data.results || [];
}

// ─── Google Places Details ────────────────────────────────────────────────────
interface PlaceDetails { telephone?: string; siteWeb?: string; adresseLigne?: string; codePostal?: string; ville?: string }

async function placeDetails(placeId: string, apiKey: string): Promise<PlaceDetails | null> {
  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,international_phone_number,formatted_phone_number,website,address_components,formatted_address&key=${apiKey}`;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== "OK") return null;
    const r = data.result;
    let codePostal: string | undefined, ville: string | undefined;
    for (const c of (r.address_components || [])) {
      if (c.types.includes("postal_code")) codePostal = c.long_name;
      if (c.types.includes("locality"))    ville      = c.long_name;
    }
    return {
      telephone:    r.international_phone_number || r.formatted_phone_number || undefined,
      siteWeb:      r.website || undefined,
      adresseLigne: r.formatted_address || undefined,
      codePostal,
      ville,
    };
  } catch {
    return null;
  }
}

// ─── Scraping email ────────────────────────────────────────────────────────────
const EMAIL_REGEX = /\b([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.(re|fr|com|net|org|biz|info|eu))\b/gi;
const EXCLUDED    = /noreply|no-reply|donotreply|mailer|bounce|spam|exemple|example|test@|@sentry|@facebook|@google|@apple|@microsoft|wordpress|jquery|woocommerce|@schema|@w3|privacy|support@wix|@mailchimp/i;

// Pages de contact classiques sur les sites français / réunionnais
const CONTACT_PATHS = [
  "/contact",
  "/nous-contacter",
  "/contactez-nous",
  "/contact.html",
  "/contact.php",
  "/mentions-legales",
  "/mentions-légales",
  "/a-propos",
  "/about",
  "/qui-sommes-nous",
];

// Préfixes email les plus courants pour les PME françaises
const EMAIL_PREFIXES = ["contact", "info", "accueil", "bonjour", "hello", "reservation", "devis", "administration", "admin", "pro"];

async function fetchWithTimeout(url: string, ms = 4000): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), ms);
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36" },
      redirect: "follow",
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    // Lire max 200 Ko
    const reader = res.body?.getReader();
    if (!reader) return await res.text();
    let bytes = 0;
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done || !value) break;
      chunks.push(value);
      bytes += value.length;
      if (bytes > 200_000) {
        reader.cancel().catch(() => { /* ignore */ });
        break;
      }
    }
    const totalLen = chunks.reduce((acc, c) => acc + c.length, 0);
    const merged = new Uint8Array(totalLen);
    let off = 0;
    for (const chunk of chunks) { merged.set(chunk, off); off += chunk.length; }
    return new TextDecoder().decode(merged);
  } catch { return null; }
}

function firstEmail(html: string): string | null {
  // 1. mailto: en priorité (lien explicite = le plus fiable)
  const mailtoMatches = [...html.matchAll(/mailto:([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/gi)];
  // 2. Regex général dans le HTML
  const regexMatches  = [...html.matchAll(EMAIL_REGEX)];
  // 3. Données structurées JSON-LD (schema.org)
  const jsonldMatches = [...html.matchAll(/"email"\s*:\s*"([^"]+@[^"]+)"/gi)];

  const all = [
    ...mailtoMatches.map((m) => m[1].toLowerCase()),
    ...jsonldMatches.map((m) => m[1].toLowerCase()),
    ...regexMatches.map((m)  => m[1].toLowerCase()),
  ];
  const unique = [...new Set(all)].filter((e) => !EXCLUDED.test(e));
  // Priorité : domaines .re, puis .fr, puis autre
  return (
    unique.find((e) => e.endsWith(".re")) ||
    unique.find((e) => e.endsWith(".fr")) ||
    unique[0] ||
    null
  );
}

/** Extrait le domaine propre (sans www.) depuis une URL */
function extractDomain(siteUrl: string): string | null {
  try {
    return new URL(siteUrl).hostname.replace(/^www\./, "");
  } catch { return null; }
}

/** Construit une URL de page de contact de façon sécurisée */
function buildUrl(base: string, path: string): string | null {
  try {
    return new URL(path, base).href;
  } catch { return null; }
}

export async function scrapeEmail(siteUrl: string): Promise<string | null> {
  const base = siteUrl.replace(/\/$/, "");

  // ── Étape 1 : Homepage + 2 premières pages de contact EN PARALLÈLE ───────
  const firstBatch = [base, "/contact", "/nous-contacter"].map((p, i) =>
    i === 0 ? fetchWithTimeout(base, 4000) : fetchWithTimeout(buildUrl(base, p) ?? "", 3000)
  );
  const firstResults = await Promise.allSettled(firstBatch);
  for (const r of firstResults) {
    if (r.status === "fulfilled" && r.value) {
      const e = firstEmail(r.value);
      if (e) return e;
    }
  }

  // ── Étape 2 : Autres pages de contact EN PARALLÈLE ───────────────────────
  const morePaths = CONTACT_PATHS.slice(2); // on a déjà testé /contact et /nous-contacter
  const moreResults = await Promise.allSettled(
    morePaths.map((path) => {
      const url = buildUrl(base, path);
      return url ? fetchWithTimeout(url, 3000) : Promise.resolve(null);
    })
  );
  for (const r of moreResults) {
    if (r.status === "fulfilled" && r.value) {
      const e = firstEmail(r.value);
      if (e) return e;
    }
  }

  // ── Étape 3 : Fallback — devinette email depuis le domaine ───────────────
  // La grande majorité des PME françaises utilisent contact@domaine ou info@domaine
  const domain = extractDomain(base);
  if (domain) {
    return `${EMAIL_PREFIXES[0]}@${domain}`; // → contact@domaine.re
  }

  return null;
}

// ─── Orchestrateur PARALLÈLE ──────────────────────────────────────────────────
export async function searchLeadsViaPlaces(params: {
  secteurs: string[];
  nombre: number;
  page: number;
}): Promise<{
  leads: PlaceLead[];
  testes: number;
  sansPhone: number;
  sansEmail: number;
  emailGuesses: number;
}> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_PLACES_API_KEY manquant");

  const { secteurs, nombre, page } = params;
  const queries = selectQueries(secteurs, page);

  // ── Étape 1 : récupérer tous les place_ids en parallèle ──────────────────
  const searchResults = await Promise.all(
    queries.map((q) =>
      textSearch(q.query, apiKey).then((r) => r.map((p) => ({ ...p, secteur: q.secteur })))
    )
  );
  const allPlaces = searchResults.flat();

  // Dédoublonner par place_id
  const seen = new Set<string>();
  const unique = allPlaces.filter((p) => {
    if (seen.has(p.place_id)) return false;
    seen.add(p.place_id);
    return true;
  });

  // ── Étape 2 : Place Details + scraping email en parallèle (par lots de 8) ─
  const BATCH = 8;
  const leads: PlaceLead[] = [];
  let testes = 0, sansPhone = 0, sansEmail = 0, emailGuesses = 0;

  for (let i = 0; i < unique.length && leads.length < nombre; i += BATCH) {
    const batch = unique.slice(i, i + BATCH);

    const results = await Promise.allSettled(
      batch.map(async (place) => {
        testes++;
        const details = await placeDetails(place.place_id, apiKey);
        if (!details?.telephone) { sansPhone++; return null; }

        // ── Email : scraping amélioré + fallback domaine ──────────────────
        let email: string | null = null;
        let emailSource: "scrape" | "guess" = "scrape";

        if (details.siteWeb) {
          const domain = extractDomain(details.siteWeb);
          email = await scrapeEmail(details.siteWeb);

          // Si le résultat est la devinette (contact@domain), marquer comme guess
          if (email && domain && email === `contact@${domain}`) {
            emailSource = "guess";
          }
        }

        if (!email) { sansEmail++; return null; }
        if (emailSource === "guess") emailGuesses++;

        return {
          nomEntreprise:   place.name,
          telephone:       details.telephone,
          email,
          emailSource,
          siteWeb:         details.siteWeb || "",
          adresse:         details.adresseLigne || null,
          codePostal:      details.codePostal  || null,
          ville:           details.ville        || null,
          secteurActivite: place.secteur,
          placesId:        place.place_id,
        } satisfies PlaceLead;
      })
    );

    for (const r of results) {
      if (r.status === "fulfilled" && r.value) {
        leads.push(r.value);
        if (leads.length >= nombre) break;
      }
    }
  }

  return { leads, testes, sansPhone, sansEmail, emailGuesses };
}
