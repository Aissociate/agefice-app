"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Clock, BookOpen, CheckCircle } from "lucide-react";
import { formatMontant, MODALITES } from "@/lib/utils";

interface Formation {
  id: string;
  reference: string;
  intitule: string;
  dureeHeures: number;
  tarifInterHT: number;
  tarifIntraHT: number;
  plafondAGEFICE?: number | null;
  modalite: string;
  eligibleCPF: boolean;
  actif: boolean;
  _count?: { dossiers: number };
}

type Tab = "toutes" | "actives";

export default function FormationsPage() {
  const [formations, setFormations] = useState<Formation[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("toutes");

  useEffect(() => {
    fetch("/api/formations")
      .then((r) => r.json())
      .then((data) => {
        setFormations(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = tab === "actives" ? formations.filter((f) => f.actif) : formations;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Formations</h1>
          <p className="text-sm text-gray-500 mt-1">
            {formations.length} formation{formations.length !== 1 ? "s" : ""} au catalogue
          </p>
        </div>
        <Link
          href="/formations/nouveau"
          className="inline-flex items-center gap-2 bg-[#1F4E79] hover:bg-[#163a5a] text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouvelle formation
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {(["toutes", "actives"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === t
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "toutes" ? "Toutes" : "Actives"}
            <span className="ml-2 text-xs text-gray-400">
              {t === "toutes" ? formations.length : formations.filter((f) => f.actif).length}
            </span>
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 h-48 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-4" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 px-5 py-16 text-center">
          <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Aucune formation disponible</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((f) => (
            <Link
              key={f.id}
              href={`/formations/${f.id}`}
              className="group bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all p-5 flex flex-col gap-3"
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-2">
                <span className="inline-block bg-blue-50 text-blue-700 text-xs font-mono font-medium px-2.5 py-1 rounded-full">
                  {f.reference}
                </span>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {f.eligibleCPF && (
                    <span className="inline-block bg-green-50 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full">
                      CPF
                    </span>
                  )}
                  <span
                    className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${
                      f.actif
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {f.actif ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>

              {/* Title */}
              <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-800 leading-snug line-clamp-2">
                {f.intitule}
              </h3>

              {/* Details */}
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {f.dureeHeures}h
                </span>
                <span className="flex items-center gap-1">
                  {MODALITES[f.modalite as keyof typeof MODALITES] ?? f.modalite}
                </span>
              </div>

              {/* Pricing */}
              <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">Tarif inter HT</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatMontant(f.tarifInterHT)}
                  </p>
                </div>
                {f.plafondAGEFICE != null && (
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Plafond AGEFICE</p>
                    <p className="text-sm font-semibold text-[#E4620D]">
                      {formatMontant(f.plafondAGEFICE)}
                    </p>
                  </div>
                )}
              </div>

              {/* Nb dossiers */}
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <CheckCircle className="w-3.5 h-3.5" />
                {f._count?.dossiers ?? 0} dossier{(f._count?.dossiers ?? 0) !== 1 ? "s" : ""}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
