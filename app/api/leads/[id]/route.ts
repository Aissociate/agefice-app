import { NextRequest, NextResponse } from "next/server";
import { prisma as db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const lead = await db.lead.findUnique({ where: { id } });
  if (!lead) return NextResponse.json({ error: "Lead introuvable" }, { status: 404 });
  return NextResponse.json(lead);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const lead = await db.lead.update({
    where: { id },
    data: {
      ...(body.statut !== undefined && {
        statut: body.statut,
        ...(body.statut === "qualifie" && { dateQualification: new Date() }),
        ...(body.statut === "inscrit"  && { dateInscription: new Date() }),
      }),
      ...(body.canalContact !== undefined && { canalContact: body.canalContact }),
      ...(body.dateContact !== undefined && {
        dateContact: body.dateContact ? new Date(body.dateContact) : null,
      }),
      ...(body.scoreLead !== undefined && {
        scoreLead: body.scoreLead !== null ? parseInt(body.scoreLead) : null,
      }),
      ...(body.feedbackHumain !== undefined && { feedbackHumain: body.feedbackHumain }),
      ...(body.telephone !== undefined && { telephone: body.telephone }),
      ...(body.email !== undefined && { email: body.email }),
      ...(body.messagePrepare !== undefined && { messagePrepare: body.messagePrepare }),
      ...(body.descriptionEnjeux !== undefined && { descriptionEnjeux: body.descriptionEnjeux }),
      ...(body.notes !== undefined && { notes: body.notes }),
    },
  });

  return NextResponse.json(lead);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.lead.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
