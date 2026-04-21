import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateDocument, DocType, type OrganismeData } from "@/lib/documents";

const VALID_TYPES: DocType[] = [
  "proposition_commerciale",
  "devis",
  "formulaire",
  "convention",
  "convocation",
  "programme",
  "feuille_emargement",
  "evaluation",
  "attestation",
  "facture",
  "plan_developpement_competences",
];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { type } = body as { type: string };

    if (!type || !VALID_TYPES.includes(type as DocType)) {
      return NextResponse.json(
        { error: "Type de document invalide" },
        { status: 400 }
      );
    }

    const dossier = await prisma.dossier.findUnique({
      where: { id },
      include: {
        client: true,
        formation: true,
      },
    });

    if (!dossier) {
      return NextResponse.json({ error: "Dossier non trouvé" }, { status: 404 });
    }

    // Load organisme parameters
    const parametres = await prisma.parametre.findMany({
      where: {
        cle: {
          in: [
            "org_nom", "org_siret", "org_adresse", "org_email", "org_telephone",
            "org_qualiopi", "org_tva", "org_site", "org_nda", "org_dreets",
            "org_code_postal", "org_ville", "org_iban",
            "org_responsable_civilite", "org_responsable_nom", "org_responsable_prenom",
            "org_responsable_qualite", "org_responsable_tel", "org_responsable_mail",
            "org_point_accueil_nom", "org_point_accueil_numero",
            "org_point_accueil_interlocuteur", "org_point_accueil_adresse",
            "org_point_accueil_code_postal", "org_point_accueil_ville",
            "org_point_accueil_tel", "org_point_accueil_mail",
          ],
        },
      },
    });
    const pm = Object.fromEntries(parametres.map((p) => [p.cle, p.valeur]));

    const organisme = {
      nom: pm.org_nom || "AIssociate SARL",
      siret: pm.org_siret || "N/C",
      nda: pm.org_nda || "",
      qualiopi: pm.org_qualiopi || "",
      dreets: pm.org_dreets || "La Réunion",
      adresse: pm.org_adresse || "",
      codePostal: pm.org_code_postal || "",
      ville: pm.org_ville || "Saint-Denis",
      email: pm.org_email || "",
      telephone: pm.org_telephone || "",
      tva: pm.org_tva || "",
      site: pm.org_site || "",
      responsableCivilite: pm.org_responsable_civilite || "",
      responsableNom: pm.org_responsable_nom || "",
      responsablePrenom: pm.org_responsable_prenom || "",
      responsableQualite: pm.org_responsable_qualite || "Gérant",
      responsableTel: pm.org_responsable_tel || "",
      responsableMail: pm.org_responsable_mail || "",
      pointAccueilNom: pm.org_point_accueil_nom || "",
      pointAccueilNumero: pm.org_point_accueil_numero || "",
      pointAccueilInterlocuteur: pm.org_point_accueil_interlocuteur || "",
      pointAccueilAdresse: pm.org_point_accueil_adresse || "",
      pointAccueilCodePostal: pm.org_point_accueil_code_postal || "",
      pointAccueilVille: pm.org_point_accueil_ville || "",
      pointAccueilTel: pm.org_point_accueil_tel || "",
      pointAccueilMail: pm.org_point_accueil_mail || "",
      iban: pm.org_iban || "",
    };

    // Generate HTML content
    let html: string;
    if (type === "proposition_commerciale") {
      const { generateProposalContent } = await import("@/lib/generateProposal");
      const { generatePropositionCommerciale } = await import("@/lib/documents");
      const content = await generateProposalContent(dossier as any, organisme as OrganismeData);
      html = generatePropositionCommerciale(dossier as any, organisme as OrganismeData, content);
    } else if (type === "plan_developpement_competences") {
      const { generatePDCAsync } = await import("@/lib/generatePDC");
      html = await generatePDCAsync(dossier as any, organisme as OrganismeData);
    } else if (type === "formulaire") {
      // Auto-generate modalitesDeroulement from formation description if not set
      const dossierData = dossier as any;
      if (!dossierData.modalitesDeroulement) {
        const { generateModalitesDeroulement } = await import("@/lib/generatePDC");
        dossierData.modalitesDeroulement = await generateModalitesDeroulement(dossierData);
      }
      html = generateDocument(type as DocType, dossierData, organisme);
    } else {
      html = generateDocument(type as DocType, dossier as any, organisme);
    }

    // Record the document in DB (upsert: regenerate replaces old record)
    const existingDoc = await prisma.document.findFirst({
      where: { dossierId: id, type },
    });

    let docRecord;
    if (existingDoc) {
      docRecord = await prisma.document.update({
        where: { id: existingDoc.id },
        data: { dateGeneration: new Date(), contenu: html },
      });
    } else {
      docRecord = await prisma.document.create({
        data: {
          dossierId: id,
          type,
          nomFichier: `${type}-${dossier.numero}.html`,
          dateGeneration: new Date(),
          contenu: html,
        },
      });
    }

    // Return HTML content as base64 for client-side download
    const base64 = Buffer.from(html, "utf-8").toString("base64");

    return NextResponse.json({
      document: docRecord,
      html: base64,
      filename: `${type}-${dossier.numero}.html`,
    });
  } catch (error) {
    console.error("POST /api/dossiers/[id]/documents error:", error);
    return NextResponse.json({ error: "Erreur lors de la génération" }, { status: 500 });
  }
}
