"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, Eye, Users } from "lucide-react";

interface Client {
  id: string;
  nom: string;
  prenom: string;
  siret: string;
  codeApe: string;
  email: string;
  telephone?: string;
  statutJuridique: string;
  _count?: { dossiers: number };
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then((data) => {
        setClients(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.nom.toLowerCase().includes(q) ||
      c.prenom.toLowerCase().includes(q) ||
      c.siret.includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-sm text-gray-500 mt-1">
            {clients.length} client{clients.length !== 1 ? "s" : ""} enregistré{clients.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/clients/nouveau"
          className="inline-flex items-center gap-2 bg-[#1F4E79] hover:bg-[#163a5a] text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouveau client
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher par nom, prénom ou SIRET..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="px-5 py-16 text-center text-gray-400 text-sm">
            Chargement des clients...
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">
              {search ? "Aucun client ne correspond à la recherche" : "Aucun client enregistré"}
            </p>
            {!search && (
              <Link
                href="/clients/nouveau"
                className="inline-block mt-3 text-sm text-blue-600 hover:underline"
              >
                Créer le premier client
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3">Nom</th>
                  <th className="px-4 py-3">Statut juridique</th>
                  <th className="px-4 py-3">SIRET</th>
                  <th className="px-4 py-3">Code APE</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3 text-center">Nb dossiers</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((client) => (
                  <tr
                    key={client.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => (window.location.href = `/clients/${client.id}`)}
                  >
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">
                        {client.prenom} {client.nom}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                        {client.statutJuridique}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-600">{client.siret}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{client.codeApe}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{client.email}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
                        {client._count?.dossiers ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <Link
                        href={`/clients/${client.id}`}
                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        <Eye className="w-4 h-4" />
                        Voir
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
