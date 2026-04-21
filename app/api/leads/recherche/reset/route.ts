import { NextResponse } from "next/server";

/**
 * Réinitialise le tracker de progression Apify pour l'actor donné.
 * Cela permet de retrouver les contacts déjà vus lors d'un prochain run.
 * Utile quand le pool de nouveaux contacts est épuisé.
 */
export async function POST() {
  const apiToken = process.env.APIFY_API_TOKEN;
  const actorId  = process.env.APIFY_ACTOR_ID ?? "VYRyEF4ygTTkaIghe";

  if (!apiToken) {
    return NextResponse.json({ error: "APIFY_API_TOKEN manquant" }, { status: 400 });
  }

  try {
    // Lancer un mini-run avec resetProgress: true et totalResults: 1 pour juste reset l'état
    const res = await fetch(
      `https://api.apify.com/v2/acts/${actorId}/runs?token=${apiToken}`,
      {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyLocationCountryIncludes: ["Reunion"],
          seniorityIncludes:              ["owner"],
          totalResults:                   1,
          hasEmail:                       false,
          hasPhone:                       false,
          resetProgress:                  true,
          dontSaveProgress:               true, // ne pas sauver ce "faux" run
          includeTitleVariants:           false,
          roleMatchMode:                  "any",
          companyMatchMode:               "any",
          companyKeywordMode:             "broad",
          companyDomainMatchMode:         "strict",
        }),
      }
    );

    if (!res.ok) {
      const txt = await res.text();
      return NextResponse.json({ error: `Apify reset échoué: ${txt.slice(0, 200)}` }, { status: 500 });
    }

    const data = await res.json();
    console.log("[reset] Pool Apify réinitialisé, run:", data?.data?.id);

    return NextResponse.json({ ok: true, runId: data?.data?.id });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
