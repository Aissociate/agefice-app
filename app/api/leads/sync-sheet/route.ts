import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const SHEET_ID = process.env.GOOGLE_SHEET_ID ?? "";

// Colonne W (index 22, 0-based) = notes prospect
const NOTES_COL = 22;

// ─── Parser CSV minimal (RFC 4180) ─────────────────────────────────────────
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else { field += c; }
    } else {
      if (c === '"')      { inQuotes = true; }
      else if (c === ',') { row.push(field); field = ""; }
      else if (c === '\n' || c === '\r') {
        row.push(field); field = "";
        if (row.some((f) => f !== "")) rows.push(row);
        row = [];
        if (c === '\r' && text[i + 1] === '\n') i++;
      } else { field += c; }
    }
  }
  if (field || row.length > 0) {
    row.push(field);
    if (row.some((f) => f !== "")) rows.push(row);
  }
  return rows;
}

// ─── Cherche l'index d'une colonne par candidats (priorité dans l'ordre) ─────
// Essaie : exact → startsWith → mot isolé → contains
function findCol(headers: string[], ...candidates: string[]): number {
  const lowers = headers.map((h) => h.toLowerCase().trim());

  for (const c of candidates) {
    const i = lowers.findIndex((h) => h === c);
    if (i >= 0) return i;
  }
  for (const c of candidates) {
    const i = lowers.findIndex((h) => h.startsWith(c + "_") || h.startsWith(c + " "));
    if (i >= 0) return i;
  }
  for (const c of candidates) {
    const i = lowers.findIndex((h) =>
      h.split(/[_\s\-\/]+/).some((w) => w === c || w === c + "?")
    );
    if (i >= 0) return i;
  }
  for (const c of candidates) {
    const i = lowers.findIndex((h) => h.includes(c));
    if (i >= 0) return i;
  }
  return -1;
}

function str(v: string | undefined): string | undefined {
  const s = (v ?? "").trim();
  return s || undefined;
}

function numFromRange(v: string | undefined): number | undefined {
  if (!v) return undefined;
  // Gère "5", "5-10", "10 à 20" → prend le premier nombre
  const match = v.replace(/\s/g, "").match(/\d+/);
  if (!match) return undefined;
  return parseInt(match[0]);
}

function normalizeStatut(v: string | undefined): string {
  if (!v) return "nouveau";
  const s = v.toLowerCase();
  if (s.includes("qualif") || s.includes("won") || s.includes("converted")) return "qualifie";
  if (s.includes("disq") || s.includes("lost"))                              return "disqualifie";
  if (s.includes("répond") || s.includes("repond") || s.includes("replied")) return "repondu";
  if (s.includes("contact") || s.includes("open") || s.includes("pending"))  return "contacte";
  return "nouveau";
}

interface SheetRow { [key: number]: string }

function mapRow(headers: string[], row: SheetRow): Record<string, unknown> {
  // Index des colonnes — noms exact en premier (export Meta Lead Ads), puis fallbacks génériques
  const iCompany   = findCol(headers, "company_name", "company", "nom_entreprise", "entreprise", "société", "societe", "raison sociale", "nom commerc");
  const iFullName  = findCol(headers, "full_name", "fullname", "nom_complet", "nom_dirigeant", "nom dirigeant", "lastname", "nom");
  const iPrenom    = findCol(headers, "first_name", "prenom", "prénom", "firstname");
  const iNom       = findCol(headers, "last_name", "nom_de_famille");
  const iEmail     = findCol(headers, "email", "mail", "courriel");
  const iPhone     = findCol(headers, "phone", "telephone", "téléphone", "tel", "mobile", "portable");
  const iStatut    = findCol(headers, "lead_status", "statut", "status", "état", "etat");
  const iEffectif  = findCol(headers, "employ", "effectif", "salari", "nb_employ");
  const iDate      = findCol(headers, "created_time", "date_contact", "date contact", "datecontact");
  const iSite      = findCol(headers, "website", "site_web", "site", "web", "url", "inbox_url");
  const iLinkedin  = findCol(headers, "linkedin");
  const iSecteur   = findCol(headers, "secteur", "activit", "industry", "sector");
  const iSiret     = findCol(headers, "siret");
  const iVille     = findCol(headers, "ville", "city", "commune");
  const iAdresse   = findCol(headers, "adresse", "address", "rue");
  const iCp        = findCol(headers, "code_postal", "code postal", "cp", "zip");

  function get(i: number) { return i >= 0 ? row[i] : undefined; }

  // Nom : si full_name disponible, le splitter en prénom/nom
  let nomDirigeant = str(get(iFullName));
  let prenomDirigeant = str(get(iPrenom));
  let nomFamille = str(get(iNom));

  if (nomDirigeant && !prenomDirigeant && !nomFamille) {
    const parts = nomDirigeant.trim().split(/\s+/);
    if (parts.length >= 2) {
      prenomDirigeant = parts[0];
      nomFamille = parts.slice(1).join(" ");
    }
  }
  const nomDirigeantFinal = nomFamille ?? nomDirigeant;

  // Filtre les valeurs de test Meta (contiennent "<test lead:")
  function clean(v: string | undefined): string | undefined {
    if (!v) return undefined;
    if (v.includes("<test lead:") || v.includes("<test_lead:")) return undefined;
    return str(v);
  }

  // Date
  let dateContact: Date | undefined;
  const rawDate = clean(get(iDate));
  if (rawDate) { const d = new Date(rawDate); if (!isNaN(d.getTime())) dateContact = d; }

  return {
    nomEntreprise:    clean(get(iCompany)),
    nomDirigeant:     clean(nomDirigeantFinal),
    prenomDirigeant:  clean(prenomDirigeant),
    email:            clean(get(iEmail)),
    telephone:        clean(get(iPhone)),
    statut:           normalizeStatut(clean(get(iStatut))),
    effectif:         numFromRange(clean(get(iEffectif))),
    dateContact,
    siteWeb:          clean(get(iSite)),
    linkedinUrl:      clean(get(iLinkedin)),
    secteurActivite:  clean(get(iSecteur)),
    siret:            clean(get(iSiret)),
    ville:            clean(get(iVille)),
    adresse:          clean(get(iAdresse)),
    codePostal:       clean(get(iCp)),
    sourceDonnee:     "google_sheet",
    // Colonne W (index 22) toujours = notes
    feedbackHumain:   clean(row[NOTES_COL]),
  };
}

export async function GET() {
  if (!SHEET_ID) {
    return NextResponse.json(
      { error: "GOOGLE_SHEET_ID manquant dans .env" },
      { status: 400 }
    );
  }

  try {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv`;
    const res = await fetch(url, { headers: { Accept: "text/csv" }, redirect: "follow" });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        return NextResponse.json(
          { error: "Accès refusé. Ouvrez le Google Sheet → Partager → Tout le monde avec le lien → Lecteur." },
          { status: 403 }
        );
      }
      return NextResponse.json({ error: `Erreur Google Sheets (${res.status})` }, { status: 502 });
    }

    const text = await res.text();
    if (text.trimStart().startsWith("<!")) {
      return NextResponse.json(
        { error: "Le sheet n'est pas public. Allez dans Partager → Tout le monde avec le lien → Lecteur." },
        { status: 403 }
      );
    }

    const rows = parseCSV(text);
    if (rows.length < 2) {
      return NextResponse.json({ synced: 0, created: 0, updated: 0, skipped: 0 });
    }

    const headers = rows[0];
    const dataRows = rows.slice(1);

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const rawRow of dataRows) {
      const row: SheetRow = {};
      rawRow.forEach((v, i) => { row[i] = v; });

      const fields = mapRow(headers, row);

      // Ignore les lignes sans nom ni email
      if (!fields.nomEntreprise && !fields.nomDirigeant && !fields.email) {
        skipped++;
        continue;
      }

      // Déduplication : email > company_name (pas de SIRET dans ce format)
      let existing = null;
      if (fields.email) {
        existing = await prisma.lead.findFirst({ where: { email: fields.email as string } });
      }
      if (!existing && fields.nomEntreprise) {
        existing = await prisma.lead.findFirst({
          where: {
            nomEntreprise: fields.nomEntreprise as string,
            ...(fields.ville ? { ville: fields.ville as string } : {}),
          },
        });
      }

      if (existing) {
        const newFeedback = (fields.feedbackHumain as string | undefined) ?? existing.feedbackHumain ?? undefined;
        const feedbackChanged = !!newFeedback && newFeedback !== existing.feedbackHumain;

        // Met à jour notes + enrichit les champs vides seulement
        await prisma.lead.update({
          where: { id: existing.id },
          data: {
            feedbackHumain: newFeedback,
            ...((!existing.telephone && fields.telephone) ? { telephone: fields.telephone as string } : {}),
            ...((!existing.siteWeb   && fields.siteWeb)   ? { siteWeb:   fields.siteWeb   as string } : {}),
            ...((!existing.statut || existing.statut === "nouveau") && fields.statut !== "nouveau"
              ? { statut: fields.statut as string } : {}),
          },
        });

        // Propage les notes vers la fiche client si le lead est converti
        if (existing.clientId && feedbackChanged && newFeedback) {
          const existingNote = await prisma.noteClient.findFirst({
            where: { clientId: existing.clientId, contenu: { startsWith: "[Google Sheet]" } },
          });
          if (existingNote) {
            await prisma.noteClient.update({
              where: { id: existingNote.id },
              data: { contenu: `[Google Sheet]\n${newFeedback}` },
            });
          } else {
            await prisma.noteClient.create({
              data: { clientId: existing.clientId, contenu: `[Google Sheet]\n${newFeedback}` },
            });
          }
        }

        updated++;
      } else {
        const nomDirigeant = (fields.nomDirigeant as string | undefined) ??
          (fields.nomEntreprise as string | undefined) ?? "—";

        await prisma.lead.create({
          data: {
            nomEntreprise:    (fields.nomEntreprise  as string | undefined) ?? nomDirigeant,
            nomDirigeant,
            prenomDirigeant:  fields.prenomDirigeant  as string | undefined,
            email:            fields.email             as string | undefined,
            telephone:        fields.telephone         as string | undefined,
            secteurActivite:  fields.secteurActivite   as string | undefined,
            siret:            fields.siret             as string | undefined,
            ville:            fields.ville             as string | undefined,
            adresse:          fields.adresse           as string | undefined,
            codePostal:       fields.codePostal        as string | undefined,
            effectif:         fields.effectif          as number | undefined,
            statut:           (fields.statut as string | undefined) ?? "nouveau",
            dateContact:      fields.dateContact       as Date   | undefined,
            siteWeb:          fields.siteWeb           as string | undefined,
            linkedinUrl:      fields.linkedinUrl       as string | undefined,
            sourceDonnee:     "google_sheet",
            feedbackHumain:   fields.feedbackHumain    as string | undefined,
          },
        });
        created++;
      }
    }

    await prisma.parametre.upsert({
      where:  { cle: "leads_sheet_last_sync" },
      update: { valeur: new Date().toISOString() },
      create: { cle: "leads_sheet_last_sync", valeur: new Date().toISOString(), categorie: "leads" },
    });

    return NextResponse.json({ synced: created + updated, created, updated, skipped });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
