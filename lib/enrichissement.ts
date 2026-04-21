// ─────────────────────────────────────────────────────────────────────────────
// Enrichissement des leads : Google Places + Pappers détaillé
// Stratégie en cascade : Pappers (dirigeant) → Google Places (tél + site)
// ─────────────────────────────────────────────────────────────────────────────

export interface EnrichissementResultat {
  nomDirigeant?: string;
  prenomDirigeant?: string;
  telephone?: string;
  siteWeb?: string;
  sources: string[];       // traces de ce qui a été trouvé
  erreurs: string[];       // erreurs non bloquantes
}

// ─── 1. Pappers détaillé ─────────────────────────────────────────────────────
// Récupère les dirigeants complets depuis /entreprise?siren= (endpoint dédié)
export async function enrichirPappers(siren: string): Promise<{
  nomDirigeant?: string;
  prenomDirigeant?: string;
} | null> {
  const token = process.env.PAPPERS_API_TOKEN;
  if (!token || !siren) return null;

  try {
    const res = await fetch(
      `https://api.pappers.fr/v2/entreprise?siren=${siren}&api_token=${token}`
    );
    if (!res.ok) return null;

    const data = await res.json();
    const dirigeants: Array<{ nom?: string; prenom?: string; qualite?: string }> =
      data.dirigeants || [];

    if (!dirigeants.length) return null;

    // Préférer Président, Gérant, Directeur général — sinon premier disponible
    const priorite = ["PRESIDENT", "GERANT", "DIRECTEUR GENERAL", "PDG", "DG"];
    const principal =
      dirigeants.find((d) =>
        priorite.some((p) => (d.qualite || "").toUpperCase().includes(p))
      ) || dirigeants[0];

    if (!principal.nom) return null;

    return {
      nomDirigeant:    principal.nom.toUpperCase(),
      prenomDirigeant: principal.prenom
        ? principal.prenom.charAt(0).toUpperCase() + principal.prenom.slice(1).toLowerCase()
        : undefined,
    };
  } catch {
    return null;
  }
}

// ─── 2. Google Places (Text Search + Details) ────────────────────────────────
// 2 appels API : TextSearch pour le place_id → Details pour tél + site
export async function enrichirGooglePlaces(
  nomEntreprise: string,
  ville: string | null,
  codePostal: string | null
): Promise<{ telephone?: string; siteWeb?: string } | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return null;

  // Construire la requête de recherche la plus précise possible
  const localisation = codePostal || ville || "La Réunion";
  const query = `${nomEntreprise} ${localisation}`;

  try {
    // ── Étape 1 : Text Search → place_id ────────────────────────────────────
    const searchUrl =
      `https://maps.googleapis.com/maps/api/place/textsearch/json` +
      `?query=${encodeURIComponent(query)}` +
      `&region=re` +
      `&key=${apiKey}`;

    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) return null;

    const searchData = await searchRes.json();

    if (searchData.status !== "OK" || !searchData.results?.length) {
      // Deuxième tentative avec requête simplifiée (sans code postal)
      if (codePostal) {
        return enrichirGooglePlaces(nomEntreprise, "La Réunion", null);
      }
      return null;
    }

    const placeId = searchData.results[0].place_id;

    // ── Étape 2 : Place Details → tél + site ────────────────────────────────
    const detailsUrl =
      `https://maps.googleapis.com/maps/api/place/details/json` +
      `?place_id=${placeId}` +
      `&fields=name,formatted_phone_number,international_phone_number,website` +
      `&key=${apiKey}`;

    const detailsRes = await fetch(detailsUrl);
    if (!detailsRes.ok) return null;

    const detailsData = await detailsRes.json();
    if (detailsData.status !== "OK") return null;

    const result = detailsData.result;

    // Normaliser le numéro : préférer le format international
    let telephone = result.international_phone_number || result.formatted_phone_number || null;
    if (telephone) {
      telephone = telephone.replace(/\s/g, " ").trim();
    }

    return {
      telephone:  telephone  || undefined,
      siteWeb:    result.website || undefined,
    };
  } catch {
    return null;
  }
}

// ─── Orchestrateur principal ─────────────────────────────────────────────────
export async function enrichirLead(lead: {
  siren?: string | null;
  nomDirigeant: string;
  prenomDirigeant?: string | null;
  telephone?: string | null;
  siteWeb?: string | null;
  nomEntreprise: string;
  ville?: string | null;
  codePostal?: string | null;
}): Promise<EnrichissementResultat> {
  const resultats: EnrichissementResultat = { sources: [], erreurs: [] };
  const mises: Record<string, string> = {};

  // ── Étape 1 : Pappers dirigeant (si SIREN dispo + dirigeant inconnu) ───────
  const dirigeantManquant =
    !lead.prenomDirigeant || lead.nomDirigeant === "Dirigeant";

  if (lead.siren && dirigeantManquant) {
    const pappersResult = await enrichirPappers(lead.siren);
    if (pappersResult) {
      if (pappersResult.nomDirigeant) {
        resultats.nomDirigeant    = pappersResult.nomDirigeant;
        mises["dirigeant"] = `${pappersResult.prenomDirigeant || ""} ${pappersResult.nomDirigeant}`.trim();
      }
      if (pappersResult.prenomDirigeant) {
        resultats.prenomDirigeant = pappersResult.prenomDirigeant;
      }
      if (pappersResult.nomDirigeant) resultats.sources.push("Pappers (dirigeant)");
    }
  }

  // ── Étape 2 : Google Places (téléphone + site web) ───────────────────────
  // Lancer même si on a déjà un tél pour récupérer le site web
  const placesResult = await enrichirGooglePlaces(
    lead.nomEntreprise,
    lead.ville || null,
    lead.codePostal || null
  );

  if (placesResult) {
    if (placesResult.telephone && !lead.telephone) {
      resultats.telephone = placesResult.telephone;
      resultats.sources.push("Google Places (téléphone)");
    }
    if (placesResult.siteWeb && !lead.siteWeb) {
      resultats.siteWeb = placesResult.siteWeb;
      resultats.sources.push("Google Places (site web)");
    }
  }

  return resultats;
}
