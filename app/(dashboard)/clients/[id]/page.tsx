import { prisma } from "@/lib/db";
import ClientDetail from "./ClientDetail";

async function getClient(id: string) {
  try {
    return await prisma.client.findUnique({
      where: { id },
      include: {
        dossiers: {
          include: { formation: true },
          orderBy: { dateCreation: "desc" },
        },
        lead: { select: { id: true } },
      },
    });
  } catch {
    return null;
  }
}

async function getOrgEmail(): Promise<string> {
  try {
    const p = await prisma.parametre.findFirst({ where: { cle: "org_email" } });
    return p?.valeur ?? "";
  } catch {
    return "";
  }
}

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [client, orgEmail] = await Promise.all([getClient(id), getOrgEmail()]);

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-red-500 font-medium">Client introuvable</p>
        <a href="/clients" className="text-sm text-blue-600 hover:underline">Retour aux clients</a>
      </div>
    );
  }

  return <ClientDetail client={client as any} orgEmail={orgEmail} />;
}
