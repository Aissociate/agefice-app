import Link from "next/link";
import { ArrowLeft, Plus, User, Mail, Phone, MapPin, Building2 } from "lucide-react";
import { formatDate, formatMontant, joursRestants, getUrgenceColor, STATUTS_DOSSIER } from "@/lib/utils";
import { prisma } from "@/lib/db";

async function getClient(id: string) {
  try {
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        dossiers: {
          include: { formation: true },
          orderBy: { dateCreation: "desc" },
        },
      },
    });
    return client;
  } catch {
    return null;
  }
}

function StatutBadge({ statut }: { statut: string }) {
  const s = STATUTS_DOSSIER[statut as keyof typeof STATUTS_DOSSIER];
  if (!s) return <span className="text-gray-500 text-xs">{statut}</span>;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${s.color}`}>
      {s.label}
    </span>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-blue-700" />
      </div>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-900">{value || "—"}</p>
      </div>
    </div>
  );
}

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await getClient(id);

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-red-500 font-medium">Client introuvable</p>
        <Link href="/clients" className="text-sm text-blue-600 hover:underline">
          Retour aux clients
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/clients"
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            {client.prenom} {client.nom}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {client.statutJuridique} &middot; SIRET {client.siret}
          </p>
        </div>
        <Link
          href={`/dossiers/nouveau?clientId=${client.id}`}
          className="inline-flex items-center gap-2 bg-[#1F4E79] hover:bg-[#163a5a] text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouveau dossier
        </Link>
      </div>

      {/* Client info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Identity */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Identité</h2>
          <InfoItem icon={User} label="Nom complet" value={`${client.prenom} ${client.nom}`} />
          <InfoItem icon={Building2} label="Statut juridique" value={client.statutJuridique} />
        </div>

        {/* Business info */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Entreprise</h2>
          <InfoItem icon={Building2} label="SIRET" value={client.siret} />
          <InfoItem icon={Building2} label="Code APE" value={client.codeApe} />
        </div>

        {/* Contact */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Contact</h2>
          <InfoItem icon={Mail} label="Email" value={client.email} />
          <InfoItem icon={Phone} label="Téléphone" value={client.telephone} />
          <InfoItem
            icon={MapPin}
            label="Adresse"
            value={
              [client.adresse, client.codePostal, client.ville].filter(Boolean).join(", ") || undefined
            }
          />
        </div>
      </div>

      {/* Dossiers */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Dossiers AGEFICE</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {client.dossiers?.length ?? 0} dossier{(client.dossiers?.length ?? 0) !== 1 ? "s" : ""}
            </p>
          </div>
          <Link
            href={`/dossiers/nouveau?clientId=${client.id}`}
            className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            <Plus className="w-4 h-4" />
            Nouveau dossier
          </Link>
        </div>

        {!client.dossiers || client.dossiers.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-gray-400 text-sm">Aucun dossier pour ce client</p>
            <Link
              href={`/dossiers/nouveau?clientId=${client.id}`}
              className="inline-block mt-2 text-sm text-blue-600 hover:underline"
            >
              Créer un dossier
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-3">N° Dossier</th>
                  <th className="px-4 py-3">Formation</th>
                  <th className="px-4 py-3">Date début</th>
                  <th className="px-4 py-3">Date limite dépôt</th>
                  <th className="px-4 py-3">Jours restants</th>
                  <th className="px-4 py-3">Montant TTC</th>
                  <th className="px-4 py-3">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {client.dossiers.map((dossier: any) => {
                  const jours = dossier.dateLimiteDepot
                    ? joursRestants(new Date(dossier.dateLimiteDepot))
                    : null;
                  return (
                    <tr
                      key={dossier.id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3 text-sm font-mono text-blue-700">
                        <Link href={`/dossiers/${dossier.id}`} className="hover:underline">
                          {dossier.numero}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800 max-w-xs truncate">
                        {dossier.formation?.intitule ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {dossier.dateDebut ? formatDate(dossier.dateDebut) : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {dossier.dateLimiteDepot ? formatDate(dossier.dateLimiteDepot) : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {jours !== null ? (
                          <span className={getUrgenceColor(jours)}>
                            {jours < 0 ? `Expiré (${Math.abs(jours)}j)` : `${jours}j`}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                        {dossier.montantTTC != null ? formatMontant(dossier.montantTTC) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <StatutBadge statut={dossier.statut} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
