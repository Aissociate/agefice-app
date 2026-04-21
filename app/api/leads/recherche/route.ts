import { NextRequest, NextResponse } from "next/server";

// Run Apify peut prendre 10-60s
export const maxDuration = 90;

import { prisma as db } from "@/lib/db";
import { searchLeadsViaApify }   from "@/lib/apifySearch";
import { genererDescriptionEnjeux } from "@/lib/leads";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    if (!process.env.APIFY_API_TOKEN) {
      return NextResponse.json(
        { error: "APIFY_API_TOKEN non configuré dans .env" },
        { status: 400 }
      );
    }

    const secteurs: string[] = body.secteurs ?? [];
    const nombre:   number   = body.nombre   ?? 30;
    const page:     number   = body.page     ?? 1;

    console.log("[recherche] Démarrage Apify — secteurs:", secteurs, "nombre:", nombre, "page:", page);

    // ── 1. Appel Apify ────────────────────────────────────────────────────────
    let apifyResult;
    try {
      apifyResult = await searchLeadsViaApify({ secteurs, nombre, page });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[recherche] Erreur Apify:", msg);
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    console.log(
      `[recherche] Apify: total=${apifyResult.total} withEmail=${apifyResult.withEmail}` +
      ` filtered=${apifyResult.filteredCount} leads_traités=${apifyResult.leads.length}`
    );

    if (!apifyResult.leads.length) {
      // Pool épuisé ou aucun email disponible
      const msg = apifyResult.total === 0
        ? "Apify n'a trouvé aucun contact pour ces critères."
        : apifyResult.filteredCount === 0
        ? `Apify a trouvé ${apifyResult.total} contacts mais aucun avec un email valide. Essayez sans filtre secteur.`
        : `${apifyResult.filteredCount} contacts filtrés mais tous déjà en base (doublons).`;
      return NextResponse.json({
        ajouts: 0, doublons: 0,
        total:         apifyResult.total,
        withEmail:     apifyResult.withEmail,
        filteredCount: apifyResult.filteredCount,
        leads: [],
        runId:     apifyResult.runId,
        datasetId: apifyResult.datasetId,
        info:      msg,
      });
    }

    // ── 2. Dédoublonnage + sauvegarde ─────────────────────────────────────────
    let ajouts   = 0;
    let doublons = 0;
    const leadsAjoutes = [];

    for (const item of apifyResult.leads) {
      try {
        // Dédoublonnage par email OU (prénom + nom + entreprise)
        const existing = await db.lead.findFirst({
          where: {
            OR: [
              { email: item.email },
              {
                nomDirigeant:    item.lastName,
                prenomDirigeant: item.firstName,
                nomEntreprise:   item.companyName,
              },
            ],
          },
        });
        if (existing) { doublons++; continue; }

        // Description : utiliser la description Apify, sinon template Claude
        let descriptionEnjeux: string | null = null;
        if (item.companyDescription && item.companyDescription.length > 30) {
          // Tronquer à 1000 chars pour ne pas saturer la DB
          descriptionEnjeux = item.companyDescription.slice(0, 1000);
        } else {
          try {
            const secteurLabel =
              Array.isArray(item.companyIndustry) && item.companyIndustry.length > 0
                ? item.companyIndustry[0]
                : "PME";
            descriptionEnjeux = await genererDescriptionEnjeux(
              item.companyName,
              secteurLabel,
              null,
              item.companySize,
              null
            );
          } catch (aiErr) {
            console.warn("[recherche] genererDescriptionEnjeux échoué:", aiErr);
          }
        }

        const lead = await db.lead.create({
          data: {
            // Entreprise
            nomEntreprise:    item.companyName,
            secteurActivite:  Array.isArray(item.companyIndustry) && item.companyIndustry.length
                              ? item.companyIndustry[0]
                              : null,
            effectif:         item.companySize ?? null,
            ville:            item.companyCity  || item.companyState || null,
            siteWeb:          item.companyDomain
                              ? `https://${item.companyDomain.replace(/^https?:\/\//, "")}`
                              : null,
            // Décideur
            nomDirigeant:     item.lastName  || item.fullName || "Dirigeant",
            prenomDirigeant:  item.firstName || null,
            titrePoste:       item.title     || null,
            email:            item.email,
            emailStatus:      item.emailStatus || null,
            telephone:        item.phone      || null,
            linkedinUrl:      item.linkedinUrl ? `https://${item.linkedinUrl.replace(/^https?:\/\//, "")}` : null,
            // Contenu
            descriptionEnjeux,
            // Metadata
            statut:           "nouveau",
            sourceDonnee:     item.emailStatus === "deliverable"
                              ? "apify_verified"
                              : item.emailStatus === "pattern_match"
                              ? "apify_pattern"
                              : "apify",
          },
        });

        leadsAjoutes.push(lead);
        ajouts++;
      } catch (saveErr) {
        console.error("[recherche] Erreur sauvegarde:", item.companyName, saveErr);
      }
    }

    console.log(`[recherche] Terminé — ${ajouts} ajoutés, ${doublons} doublons`);

    return NextResponse.json({
      ajouts,
      doublons,
      total:         apifyResult.total,
      withEmail:     apifyResult.withEmail,
      filteredCount: apifyResult.filteredCount,
      runId:         apifyResult.runId,
      datasetId:     apifyResult.datasetId,
      leads:         leadsAjoutes,
    });

  } catch (fatalErr: unknown) {
    const msg = fatalErr instanceof Error ? fatalErr.message : String(fatalErr);
    console.error("[recherche] ERREUR FATALE:", msg, fatalErr);
    return NextResponse.json({ error: `Erreur serveur : ${msg}` }, { status: 500 });
  }
}
