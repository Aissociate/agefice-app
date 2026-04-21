"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, FolderOpen } from "lucide-react";
import { formatDate, formatMontant, joursRestants, getUrgenceColor, STATUTS_DOSSIER } from "@/lib/utils";

interface Dossier {
  id: string;
  numero: string;
  statut: string;
  dateDebut?: string;
  dateLimiteDepot?: string;
  dateLimiteRemboursement?: string;
  montantTTC?: number;
  client?: { nom: string; prenom: string };
  formation?: { intitule: string };
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

export default function DossiersPage() {
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [loading, setLoading] = useState(true);
  const [statutFilter, setStatutFilter] = useState("tous");

  useEffect(() => {
    fetch("/api/dossiers")
      .then((r) => r.json())
      .then((data) => {
        setDossiers(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered =
    statutFilter === "tous"
      ? dossiers
      : dossiers.filter((d) => d.statut === statutFilter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dossiers AGEFICE</h1>
          <p className="text-sm text-gray-500 mt-1">
            {dossiers.length} dossier{dossiers.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/dossiers/nouveau"
          className="inline-flex items-center gap-2 bg-[#1F4E79] hover:bg-[#163a5a] text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouveau dossier
        </Link>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700">Filtrer par statut :</label>
        <select
          value={statutFilter}
          onChange={(e) => setStatutFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="tous">Tous ({dossiers.length})</option>
          {Object.entries(STATUTS_DOSSIER).map(([key, s]) => {
            const count = dossiers.filter((d) => d.statut === key).length;
            return (
              <option key={key} value={key}>
                {s.label} ({count})
              </option>
            );
          })}
        </select>
        {statutFilter !== "tous" && (
          <button
            onClick={() => setStatutFilter("tous")}
            className="text-sm text-blue-600 hover:underline"
          >
            Réinitialiser
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="px-5 py-16 text-center text-gray-400 text-sm">
            Chargement des dossiers...
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <FolderOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">
              {statutFilter !== "tous"
                ? "Aucun dossier avec ce statut"
                : "Aucun dossier créé pour le moment"}
            </p>
            {statutFilter === "tous" && (
              <Link
                href="/dossiers/nouveau"
                className="inline-block mt-2 text-sm text-blue-600 hover:underline"
              >
                Créer le premier dossier
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3">N° Dossier</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Formation</th>
                  <th className="px-4 py-3">Date début</th>
                  <th className="px-4 py-3">Date limite dépôt</th>
                  <th className="px-4 py-3">Jours restants</th>
                  <th className="px-4 py-3">Montant TTC</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((dossier) => {
                  const jours = dossier.dateLimiteDepot
                    ? joursRestants(new Date(dossier.dateLimiteDepot))
                    : null;
                  return (
                    <tr
                      key={dossier.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm font-mono text-blue-700">
                        <Link href={`/dossiers/${dossier.id}`} className="hover:underline">
                          {dossier.numero}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {dossier.client
                          ? `${dossier.client.prenom} ${dossier.client.nom}`
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
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
                            {jours < 0
                              ? `Expiré (${Math.abs(jours)}j)`
                              : `${jours}j`}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                        {dossier.montantTTC != null ? formatMontant(dossier.montantTTC) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <StatutBadge statut={dossier.statut} />
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/dossiers/${dossier.id}`}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Voir
                        </Link>
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
