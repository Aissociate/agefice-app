import Link from "next/link";
import { AlertTriangle, TrendingUp, FolderOpen, CheckCircle, Clock } from "lucide-react";
import { formatDate, formatMontant, joursRestants, getUrgenceColor, STATUTS_DOSSIER } from "@/lib/utils";
import { prisma } from "@/lib/db";
import { addDays } from "date-fns";

async function getDashboardData() {
  const now = new Date();
  const in15Days = addDays(now, 15);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const [totalDossiers, allDossiers, urgentDossiers, recentDossiers, remboursesDossiers] =
    await Promise.all([
      prisma.dossier.count(),
      prisma.dossier.groupBy({ by: ["statut"], _count: true }),
      prisma.dossier.findMany({
        where: {
          statut: { notIn: ["rembourse", "refuse"] },
          OR: [
            { dateLimiteDepot: { gte: now, lte: in15Days } },
            { dateLimiteRemboursement: { gte: now, lte: in15Days } },
          ],
        },
        include: { client: true, formation: { select: { intitule: true } } },
        orderBy: [{ dateLimiteDepot: "asc" }],
      }),
      prisma.dossier.findMany({
        take: 5,
        orderBy: { dateCreation: "desc" },
        include: { client: true, formation: { select: { intitule: true } } },
      }),
      prisma.dossier.aggregate({
        where: { statut: "rembourse", dateMAJ: { gte: startOfYear } },
        _sum: { montantTTC: true },
        _count: true,
      }),
    ]);

  const dossiersByStatut = Object.fromEntries(
    allDossiers.map((d) => [d.statut, d._count])
  );

  return {
    totalDossiers,
    dossiersByStatut,
    dossierUrgents: urgentDossiers,
    chiffreAffaires: remboursesDossiers._sum.montantTTC ?? 0,
    rembourseCount: remboursesDossiers._count,
    recentDossiers,
  };
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
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

function DossierRow({ dossier }: { dossier: any }) {
  const dateLimite = dossier.dateLimiteDepot
    ? new Date(dossier.dateLimiteDepot)
    : dossier.dateLimiteRemboursement
    ? new Date(dossier.dateLimiteRemboursement)
    : null;

  const jours = dateLimite ? joursRestants(dateLimite) : null;

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3 text-sm font-mono text-blue-700">
        <Link href={`/dossiers/${dossier.id}`} className="hover:underline">
          {dossier.numero}
        </Link>
      </td>
      <td className="px-4 py-3 text-sm text-gray-900">
        {dossier.client?.prenom} {dossier.client?.nom}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
        {dossier.formation?.intitule}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {dateLimite ? formatDate(dateLimite) : "—"}
      </td>
      <td className="px-4 py-3 text-sm font-medium">
        {jours !== null ? (
          <span className={getUrgenceColor(jours)}>
            {jours < 0 ? `Expiré (${Math.abs(jours)}j)` : `${jours}j`}
          </span>
        ) : (
          "—"
        )}
      </td>
      <td className="px-4 py-3">
        <StatutBadge statut={dossier.statut} />
      </td>
    </tr>
  );
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  const enCours =
    (data.dossiersByStatut?.depose ?? 0) +
    (data.dossiersByStatut?.accord ?? 0) +
    (data.dossiersByStatut?.en_cours ?? 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-sm text-gray-500 mt-1">Vue d&apos;ensemble de l&apos;activité AGEFICE</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total dossiers" value={data.totalDossiers} icon={FolderOpen} color="bg-[#1F4E79]" />
        <StatCard title="En cours" value={enCours} icon={Clock} color="bg-[#2E75B6]" />
        <StatCard title="Remboursés (année)" value={data.rembourseCount} icon={CheckCircle} color="bg-green-600" />
        <StatCard title="CA remboursé" value={formatMontant(data.chiffreAffaires)} icon={TrendingUp} color="bg-[#E4620D]" />
      </div>

      {data.dossierUrgents?.length > 0 && (
        <div className="bg-white rounded-xl border border-orange-200">
          <div className="px-5 py-4 border-b border-orange-100 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <h2 className="font-semibold text-gray-900">Dossiers urgents</h2>
            <span className="ml-auto bg-orange-100 text-orange-700 text-xs font-medium px-2 py-0.5 rounded-full">
              {data.dossierUrgents.length} dossier{data.dossierUrgents.length > 1 ? "s" : ""}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                  <th className="px-4 py-3">N° Dossier</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Formation</th>
                  <th className="px-4 py-3">Date limite</th>
                  <th className="px-4 py-3">Jours restants</th>
                  <th className="px-4 py-3">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.dossierUrgents.map((dossier: any) => (
                  <DossierRow key={dossier.id} dossier={dossier} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Dossiers récents</h2>
          <Link href="/dossiers" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            Voir tous →
          </Link>
        </div>
        <div className="overflow-x-auto">
          {data.recentDossiers?.length === 0 ? (
            <div className="px-5 py-10 text-center text-gray-400 text-sm">
              Aucun dossier créé pour le moment.{" "}
              <Link href="/dossiers/nouveau" className="text-blue-600 hover:underline">
                Créer un premier dossier
              </Link>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                  <th className="px-4 py-3">N° Dossier</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Formation</th>
                  <th className="px-4 py-3">Date limite dépôt</th>
                  <th className="px-4 py-3">Jours restants</th>
                  <th className="px-4 py-3">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.recentDossiers?.map((dossier: any) => (
                  <DossierRow key={dossier.id} dossier={dossier} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
