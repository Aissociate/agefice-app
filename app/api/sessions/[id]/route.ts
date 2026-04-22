import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const session = await prisma.sessionFormation.update({
    where: { id },
    data: {
      ...(body.titre     !== undefined && { titre:     body.titre }),
      ...(body.dateDebut !== undefined && { dateDebut: new Date(body.dateDebut) }),
      ...(body.dateFin   !== undefined && { dateFin:   new Date(body.dateFin) }),
      ...(body.lieu      !== undefined && { lieu:      body.lieu || null }),
      ...(body.notes     !== undefined && { notes:     body.notes || null }),
      ...(body.statut    !== undefined && { statut:    body.statut }),
    },
    include: {
      lead: { select: { id: true, nomEntreprise: true, nomDirigeant: true, prenomDirigeant: true } },
    },
  });
  return NextResponse.json(session);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.sessionFormation.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
