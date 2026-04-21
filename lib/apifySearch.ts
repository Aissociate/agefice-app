// ─────────────────────────────────────────────────────────────────────────────
// Recherche leads B2B via Apify (actor VYRyEF4ygTTkaIghe)
// Workflow : Start run → Poll → Fetch dataset items
// Renvoie des leads avec email vérifié, nom réel et poste
// ─────────────────────────────────────────────────────────────────────────────

export interface ApifyLead {
  firstName:           string;
  lastName:            string;
  fullName:            string;
  title:               string;   // poste ("Owner", "Directeur Général"…)
  seniority:           string;   // "owner" | "director" | "c_suite"…
  email:               string;
  emailStatus:         string;   // "deliverable" | "pattern_match" | "risky" | "invalid"
  phone:               string;
  linkedinUrl:         string;
  companyName:         string;
  companyDomain:       string;
  companyIndustry:     string[];
  companySize:         number | null;
  companyCity:         string;
  companyState:        string;
  companyDescription:  string;
  technologies:        string[];
  foundedYear:         number | null;
}

// ─── Mapping secteurs → industries Apify (valeurs exactes de l'enum) ──────────
// Liste complète des 93 valeurs autorisées récupérée depuis l'inputSchema de l'actor
const SECTEUR_TO_INDUSTRIES: Record<string, string[]> = {
  restauration:    ["Restaurants", "Food & Beverages", "Hospitality"],
  btp:             ["Construction", "Civil Engineering", "Building Materials"],
  commerce:        ["Retail", "Consumer Goods", "Wholesale"],
  transport:       ["Transportation/Trucking/Railroad", "Logistics & Supply Chain", "Warehousing"],
  automobile:      ["Automotive"],
  sante:           ["Hospital & Health Care", "Medical Practice", "Health, Wellness & Fitness", "Mental Health Care"],
  agroalimentaire: ["Food Production", "Food & Beverages", "Wine & Spirits"],
  services:        ["Consumer Services", "Staffing & Recruiting", "Outsourcing/Offshoring", "Security & Investigations"],
  reparation:      ["Consumer Electronics", "Consumer Services", "Electrical/Electronic Manufacturing"],
  immobilier:      ["Real Estate", "Commercial Real Estate"],
};

export function getIndustriesForSecteurs(secteurs: string[]): string[] {
  if (!secteurs.length) return [];
  const industries = secteurs.flatMap((s) => SECTEUR_TO_INDUSTRIES[s] ?? []);
  return [...new Set(industries)];
}

// ─── Start Apify run ───────────────────────────────────────────────────────────
async function startRun(
  actorId: string,
  apiToken: string,
  input: Record<string, unknown>
): Promise<{ runId: string; datasetId: string }> {
  const res = await fetch(
    `https://api.apify.com/v2/acts/${actorId}/runs?token=${apiToken}`,
    {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(input),
    }
  );
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Apify démarrage échoué (${res.status}): ${txt.slice(0, 300)}`);
  }
  const data = await res.json();
  return {
    runId:     data.data.id,
    datasetId: data.data.defaultDatasetId,
  };
}

// ─── Poll run until SUCCEEDED (max timeoutMs) ─────────────────────────────────
async function waitForRun(
  runId: string,
  apiToken: string,
  timeoutMs = 55_000
): Promise<string> {
  const deadline = Date.now() + timeoutMs;
  let status = "RUNNING";

  while (["RUNNING", "READY"].includes(status)) {
    if (Date.now() > deadline) break;
    await new Promise((r) => setTimeout(r, 2500));

    try {
      const res  = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${apiToken}`);
      const data = await res.json();
      status     = data?.data?.status ?? status;
    } catch { /* ignore réseau temporaire */ }
  }

  return status;
}

// ─── Fetch dataset items ───────────────────────────────────────────────────────
async function fetchDataset(
  datasetId: string,
  apiToken: string,
  limit: number
): Promise<ApifyLead[]> {
  const res = await fetch(
    `https://api.apify.com/v2/datasets/${datasetId}/items?token=${apiToken}&limit=${limit}&clean=true`
  );
  if (!res.ok) throw new Error(`Apify dataset fetch échoué (${res.status})`);
  return (await res.json()) as ApifyLead[];
}

// ─── Orchestrateur principal ───────────────────────────────────────────────────
export async function searchLeadsViaApify(params: {
  secteurs: string[];
  nombre:   number;
  page:     number;  // utilisé pour resetProgress toutes les N pages
}): Promise<{
  leads:         ApifyLead[];
  total:         number;
  withEmail:     number;
  filteredCount: number;
  runId:         string;
  datasetId:     string;
  runStatus:     string;
}> {
  const apiToken = process.env.APIFY_API_TOKEN;
  const actorId  = process.env.APIFY_ACTOR_ID ?? "VYRyEF4ygTTkaIghe";

  if (!apiToken) throw new Error("APIFY_API_TOKEN manquant dans .env");

  const industries = getIndustriesForSecteurs(params.secteurs);

  // Ne jamais reset automatiquement : Apify mémorise sa progression et
  // renvoie de nouveaux contacts à chaque run (sauf si on reset manuellement).
  // Reset uniquement si page === 1 ET il n'y a plus de nouveaux contacts.
  const resetProgress = false;
  // Demander beaucoup pour avoir de la marge après dédoublonnage
  const totalResults  = Math.min(params.nombre * 4, 200);

  const input: Record<string, unknown> = {
    companyLocationCountryIncludes: ["Reunion"],
    seniorityIncludes:              ["owner", "director", "vp", "partner", "c_suite", "senior", "manager"],
    totalResults,
    hasEmail:                       false,  // laisser l'actor retourner tout, on filtre côté code
    hasPhone:                       false,
    dontSaveProgress:               false,
    resetProgress,
    includeTitleVariants:           true,
    roleMatchMode:                  "any",
    companyMatchMode:               "any",
    companyKeywordMode:             "broad",
    companyDomainMatchMode:         "strict",
  };

  // Filtre secteur si sélectionné
  if (industries.length > 0) {
    input.companyIndustryIncludes = industries;
  }

  console.log("[apify] Démarrage run — input:", JSON.stringify(input));

  const { runId, datasetId } = await startRun(actorId, apiToken, input);
  console.log(`[apify] Run ${runId} démarré, dataset ${datasetId}`);

  const runStatus = await waitForRun(runId, apiToken, 55_000);
  console.log(`[apify] Run terminé avec status: ${runStatus}`);

  if (!["SUCCEEDED", "RUNNING"].includes(runStatus)) {
    throw new Error(`Apify run échoué avec status: ${runStatus}`);
  }

  const allItems = await fetchDataset(datasetId, apiToken, params.nombre * 4);
  console.log(`[apify] ${allItems.length} items récupérés depuis le dataset`);

  // Stats de diagnostic
  const withEmail    = allItems.filter((i) => i.email && i.email.includes("@")).length;
  const statusCounts = allItems.reduce<Record<string, number>>((acc, i) => {
    const s = i.emailStatus || "null";
    acc[s] = (acc[s] ?? 0) + 1;
    return acc;
  }, {});
  console.log(`[apify] avec email: ${withEmail}/${allItems.length} — statuts:`, statusCounts);

  // Filtrer : garder tout lead ayant un email ET un nom d'entreprise
  // On exclut seulement "invalid" (email clairement invalide)
  const EXCLUDED_STATUSES = new Set(["invalid"]);
  const filtered = allItems.filter(
    (item) =>
      item.email &&
      item.email.includes("@") &&
      !EXCLUDED_STATUSES.has((item.emailStatus ?? "").toLowerCase()) &&
      item.companyName
  );
  console.log(`[apify] ${filtered.length} leads après filtre email`);

  return {
    leads:         filtered.slice(0, params.nombre),
    total:         allItems.length,
    withEmail,
    filteredCount: filtered.length,
    runId,
    datasetId,
    runStatus,
  };
}
