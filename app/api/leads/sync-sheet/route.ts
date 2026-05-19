import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const SHEET_ID = process.env.GOOGLE_SHEET_ID ?? "";
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

// ─── Détection format transposé Meta Lead Ads ───────────────────────────────
// Format : row[0][0] = "id l:123 l:456 ..." (toutes les valeurs dans une cellule)
function isMetaTransposedFormat(row0: string[]): boolean {
  return row0.length > 0 && /^id\s+l:\d+/.test(row0[0]);
}

// ─── Parse le format transposé : extrait chaque lead depuis la ligne d'en-tête
interface TransposedLead {
  email?: string;
  telephone?: string;
  nomDirigeant: string;
  prenomDirigeant?: string;
  nomEntreprise?: string;
  statut: string;
  dateContact?: Date;
  feedbackHumain?: string;
  siteWeb?: string;
}

function parseMetaTransposedRow(row0: string[]): TransposedLead[] {
  // Construit un dict: nom_colonne → chaîne de toutes les valeurs
  const cols: Record<string, string> = {};
  for (const cell of row0) {
    const ws = cell.search(/\s/);
    if (ws < 0) continue;
    const name = cell.substring(0, ws).toLowerCase().trim();
    const vals = cell.substring(ws + 1).trim();
    if (name) cols[name] = vals;
  }

  // ── Emails (fiables : jamais d'espaces dans un email) ──
  const allEmails = (cols["email"] ?? "").match(/[\w.+%-]+@[\w.-]+\.[a-z]{2,}/gi) ?? [];
  const emails = allEmails.filter(
    (e) => !e.toLowerCase().startsWith("test@") && !e.toLowerCase().includes("@test.")
  );
  if (emails.length === 0) return [];

  // ── Phones (fiables : format p:+DIGITS) ──
  const rawPhoneStr = cols["phone"] ?? "";
  const phoneParts = rawPhoneStr.split(/(?=p:[<+])/).filter(Boolean);
  // Le premier token contient le lead de test (<test lead...>), on l'ignore
  const phones = phoneParts
    .filter((p) => /p:\+?\d/.test(p))
    .map((p) => {
      const m = p.match(/\d{6,}/);
      return m ? "+" + m[0] : undefined;
    });

  // ── Timestamps (fiables : format ISO 8601) ──
  const rawTimes =
    (cols["created_time"] ?? "").match(/\d{4}-\d{2}-\d{2}T[\d:+\-]+/g)?.slice(1) ?? [];

  // ── Statuts ──
  const rawStatuts = (cols["lead_status"] ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(1); // skip 'ok' (test lead)

  // ── URLs inbox (format https://...) ──
  const inboxUrls =
    (cols["inbox_url"] ?? "").match(/https:\/\/[^\s]+/g)?.slice(1) ?? [];

  // ── Company name : on essaie de matcher via l'email ──
  const companyRaw = (cols["company_name"] ?? "").replace(/<[^>]+>/g, "").trim();
  // Nettoyage des données brutes du nom complet
  const nameRaw = (cols["full_name"] ?? "").replace(/<[^>]+>/g, "").trim();

  return emails.map((email, i) => {
    let dateContact: Date | undefined;
    if (rawTimes[i]) {
      const d = new Date(rawTimes[i]);
      if (!isNaN(d.getTime())) dateContact = d;
    }

    const company = extractMatchingValue(email, companyRaw, 1) ?? undefined;
    const fullName = extractMatchingValue(email, nameRaw, 2) ?? undefined;

    let nomDirigeant: string;
    let prenomDirigeant: string | undefined;
    if (fullName) {
      const parts = fullName.trim().split(/\s+/);
      if (parts.length >= 2) {
        prenomDirigeant = parts[0];
        nomDirigeant = parts.slice(1).join(" ");
      } else {
        nomDirigeant = fullName;
      }
    } else {
      nomDirigeant = deriveNameFromEmail(email);
    }

    return {
      email,
      telephone: phones[i],
      nomDirigeant,
      prenomDirigeant,
      nomEntreprise: company || nomDirigeant,
      statut: normalizeStatut(rawStatuts[i] ?? "CREATED"),
      dateContact,
      siteWeb: inboxUrls[i] || undefined,
    };
  });
}

// Cherche la valeur correspondant à cet email dans une chaîne plate.
// maxWords : 2 pour full_name (prénom nom), 5 pour company_name (raison sociale).
function extractMatchingValue(email: string, flat: string, maxWords = 2): string | null {
  if (!flat) return null;

  const [user, host] = email.split("@");
  const domain = (host ?? "").split(".")[0].toLowerCase();
  const personalDomains = new Set([
    "gmail", "hotmail", "yahoo", "orange", "sfr", "laposte",
    "wanadoo", "icloud", "free", "outlook", "live", "msn",
  ]);

  const candidates: string[] = [];
  // Parties du username sans chiffres/ponctuations
  const userParts = user
    .replace(/[._-]/g, " ")
    .replace(/\d+/g, " ")
    .trim()
    .split(/\s+/)
    .filter((w) => w.length >= 4);
  candidates.push(...userParts);

  if (!personalDomains.has(domain) && domain.length >= 4) {
    candidates.push(domain);
    // Essayer sans préfixes courants (byneopale → neopale, myapp → app…)
    const stripped = domain.replace(/^(my|by|go|get|be|the|un|une|le|la|les|mon|ma)/, "");
    if (stripped.length >= 4 && stripped !== domain) candidates.push(stripped);
  }

  for (const part of candidates) {
    const re = new RegExp(`\\b${part}`, "i");
    const idx = flat.search(re);
    if (idx < 0) continue;

    // Remonter au début du token — et inclure le mot précédent s'il existe
    // (pour capturer "Dominique Hamoir" quand on cherche "hamoir")
    const before = flat.substring(0, idx).trim();
    const wordsBefore = before.split(/\s+/).filter(Boolean);
    const preceedingWord = wordsBefore[wordsBefore.length - 1] ?? "";

    // Pour full_name (maxWords=2) : on prend le mot précédent + le mot matché
    // Pour company (maxWords>2) : on part du mot matché et on avance
    let start: number;
    let extraWords = maxWords;
    if (maxWords === 2 && preceedingWord && /^[A-ZÀ-Ÿ]/.test(preceedingWord)) {
      // Reculer jusqu'au début du mot précédent
      start = idx - preceedingWord.length - 1;
      if (start < 0) start = 0;
      extraWords = maxWords + 1; // on prend un mot de plus car on part d'avant
    } else {
      // Pour company : partir exactement du mot matché (pas du mot précédent)
      start = idx;
    }

    const after = flat.substring(start);
    const words = after.split(/\s+/).slice(0, extraWords);
    const taken: string[] = [];
    for (const w of words) {
      if (taken.length >= maxWords) break;
      if (taken.length > 0 && maxWords > 2 && /^[a-z]/.test(w) && !/^(de|du|la|le|les|et|des|l)$/i.test(w)) break;
      taken.push(w);
    }
    return taken.join(" ").trim();
  }

  return null;
}

function deriveNameFromEmail(email: string): string {
  const username = email.split("@")[0]
    .replace(/[._-]/g, " ")
    .replace(/\d+/g, "")
    .trim();
  return (
    username
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ") || "—"
  );
}

// ─── Cherche l'index d'une colonne par candidats ────────────────────────────
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

  function clean(v: string | undefined): string | undefined {
    if (!v) return undefined;
    if (v.includes("<test lead:") || v.includes("<test_lead:")) return undefined;
    return str(v);
  }

  let dateContact: Date | undefined;
  const rawDate = clean(get(iDate));
  if (rawDate) { const d = new Date(rawDate); if (!isNaN(d.getTime())) dateContact = d; }

  // Nettoyer le téléphone : retirer le préfixe "p:" si présent
  const rawPhone = clean(get(iPhone));
  const telephone = rawPhone?.replace(/^p:/, "") || undefined;

  return {
    nomEntreprise:    clean(get(iCompany)),
    nomDirigeant:     clean(nomDirigeantFinal),
    prenomDirigeant:  clean(prenomDirigeant),
    email:            clean(get(iEmail)),
    telephone,
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
    feedbackHumain:   clean(row[NOTES_COL]),
  };
}

// ─── Upsert générique (utilisé par les deux chemins de parsing) ──────────────
async function upsertLead(fields: Record<string, unknown>): Promise<"created" | "updated" | "skipped"> {
  if (!fields.nomEntreprise && !fields.nomDirigeant && !fields.email) return "skipped";

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
    return "updated";
  }

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
  return "created";
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
    if (rows.length < 1) {
      return NextResponse.json({ synced: 0, created: 0, updated: 0, skipped: 0 });
    }

    let created = 0;
    let updated = 0;
    let skipped = 0;

    const row0 = rows[0];

    if (isMetaTransposedFormat(row0)) {
      // ── Format Meta Lead Ads transposé ──────────────────────────────────
      // row0 = toutes les valeurs historiques (une cellule par colonne)
      // rows[1..] = derniers leads en format CSV classique (delta récent)

      // 1. Parser le header transposé pour les leads historiques
      const historicalLeads = parseMetaTransposedRow(row0);

      // 2. Résoudre les notes (colonne W) pour les leads qui n'en ont pas encore.
      //    Stratégie : trouver la fin de la dernière note connue dans la chaîne
      //    brute, puis découper le reste pour les nouveaux leads.
      const notesCell = row0[NOTES_COL] ?? "";
      if (notesCell && historicalLeads.length > 0) {
        const emailsInOrder = historicalLeads
          .map((l) => l.email)
          .filter((e): e is string => !!e);

        // Chercher les notes existantes en DB pour établir l'ancre de fin
        const existingInDB = await prisma.lead.findMany({
          where: { email: { in: emailsInOrder } },
          select: { email: true, feedbackHumain: true },
        });
        const existingNoteMap = new Map(
          existingInDB
            .filter((l) => l.email && l.feedbackHumain)
            .map((l) => [l.email!.toLowerCase(), l.feedbackHumain!])
        );

        // Parcourir les emails dans l'ordre pour trouver où finit la dernière note connue
        let endOfLastKnown = 0;
        for (const email of emailsInOrder) {
          const note = existingNoteMap.get(email.toLowerCase());
          if (!note || note.length < 4) continue;
          // Ancre = 30 premiers caractères de la note (suffisamment unique)
          const anchor = note.trim().substring(0, 30);
          const pos = notesCell.indexOf(anchor, endOfLastKnown);
          if (pos >= 0) {
            endOfLastKnown = pos + note.trim().length;
          }
        }

        // Leads sans note en DB = les nouveaux à renseigner
        const newLeads = historicalLeads.filter(
          (l) => l.email && !existingNoteMap.has(l.email.toLowerCase())
        );

        if (endOfLastKnown > 0 && newLeads.length > 0) {
          const remaining = notesCell.substring(endOfLastKnown).trim();
          if (remaining) {
            // Découper par double-espace (séparateur le plus fiable disponible)
            const chunks = remaining
              .split(/\s{2,}/)
              .map((s) => s.trim())
              .filter(Boolean);
            newLeads.forEach((lead, i) => {
              if (chunks[i]) lead.feedbackHumain = chunks[i];
            });
          }
        }
      }

      // 3. Upsert tous les leads (notes incluses)
      for (const lead of historicalLeads) {
        const result = await upsertLead(lead as unknown as Record<string, unknown>);
        if (result === "created") created++;
        else if (result === "updated") updated++;
        else skipped++;
      }

      // 2. Parser les lignes de données normales (format CSV standard)
      // Dans ce format, les colonnes sont définies par l'ordre des cellules de row0
      // On reconstruit les en-têtes depuis le premier mot de chaque cellule de row0
      const syntheticHeaders = row0.map((cell) => cell.split(/\s/)[0]);

      for (const rawRow of rows.slice(1)) {
        const row: SheetRow = {};
        rawRow.forEach((v, i) => { row[i] = v; });
        const fields = mapRow(syntheticHeaders, row);
        const result = await upsertLead(fields);
        if (result === "created") created++;
        else if (result === "updated") updated++;
        else skipped++;
      }
    } else {
      // ── Format CSV classique (une ligne = un lead) ───────────────────────
      if (rows.length < 2) {
        return NextResponse.json({ synced: 0, created: 0, updated: 0, skipped: 0 });
      }

      const headers = row0;
      for (const rawRow of rows.slice(1)) {
        const row: SheetRow = {};
        rawRow.forEach((v, i) => { row[i] = v; });
        const fields = mapRow(headers, row);
        const result = await upsertLead(fields);
        if (result === "created") created++;
        else if (result === "updated") updated++;
        else skipped++;
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
