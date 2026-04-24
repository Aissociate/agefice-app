import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  try {
    const { id: landingId, variantId } = await params;
    const data = await request.json();

    if (data.actif === true) {
      await prisma.landingVariant.updateMany({
        where: { landingId, actif: true },
        data: { actif: false },
      });
    }

    const variant = await prisma.landingVariant.update({
      where: { id: variantId },
      data: {
        ...data,
        contenu: data.contenu
          ? typeof data.contenu === "string"
            ? data.contenu
            : JSON.stringify(data.contenu)
          : undefined,
      },
    });

    return NextResponse.json(variant);
  } catch (error) {
    console.error("PUT variant error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  try {
    const { variantId } = await params;
    await prisma.landingVariant.delete({ where: { id: variantId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE variant error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
