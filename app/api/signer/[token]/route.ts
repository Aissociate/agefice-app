import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

async function resolveDoc(token: string) {
  const byEleve = await prisma.document.findUnique({
    where: { tokenEleve: token },
    include: { dossier: { include: { client: true, formation: true } } },
  });
  if (byEleve) return { doc: byEleve, role: "eleve" as const };

  const byOF = await prisma.document.findUnique({
    where: { tokenOF: token },
    include: { dossier: { include: { client: true, formation: true } } },
  });
  if (byOF) return { doc: byOF, role: "of" as const };

  return null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const result = await resolveDoc(token);

    if (!result) {
      return NextResponse.json({ error: "Lien invalide ou expiré" }, { status: 404 });
    }

    const { doc, role } = result;
    const alreadySigned = role === "eleve" ? !!doc.signatureEleve : !!doc.signatureOF;
    const otherSigned = role === "eleve" ? !!doc.signatureOF : !!doc.signatureEleve;

    return NextResponse.json({
      role,
      alreadySigned,
      otherSigned,
      bothSigned: doc.signe,
      docType: doc.type,
      dossierNumero: doc.dossier.numero,
      formation: doc.dossier.formation.intitule,
      client: `${doc.dossier.client.prenom} ${doc.dossier.client.nom}`,
      dateDebut: doc.dossier.dateDebut,
      dateFin: doc.dossier.dateFin,
    });
  } catch (error) {
    console.error("GET /api/signer/[token] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const result = await resolveDoc(token);

    if (!result) {
      return NextResponse.json({ error: "Lien invalide ou expiré" }, { status: 404 });
    }

    const { doc, role } = result;

    if (role === "eleve" && doc.signatureEleve) {
      return NextResponse.json({ error: "Déjà signé" }, { status: 409 });
    }
    if (role === "of" && doc.signatureOF) {
      return NextResponse.json({ error: "Déjà signé" }, { status: 409 });
    }

    const body = await request.json() as { image: string; timestamp: string; userAgent: string };

    const payload = JSON.stringify({
      image: body.image,
      timestamp: body.timestamp,
      userAgent: body.userAgent,
      ip: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "unknown",
    });

    const otherSigned = role === "eleve" ? !!doc.signatureOF : !!doc.signatureEleve;

    await prisma.document.update({
      where: { id: doc.id },
      data: {
        ...(role === "eleve" ? { signatureEleve: payload } : { signatureOF: payload }),
        ...(otherSigned ? { signe: true } : {}),
      },
    });

    return NextResponse.json({ ok: true, bothSigned: otherSigned });
  } catch (error) {
    console.error("POST /api/signer/[token] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
