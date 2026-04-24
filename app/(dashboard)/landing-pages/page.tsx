"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Globe, Trash2, Users, BarChart2, CheckCircle2 } from "lucide-react";

interface Variant { id: string; nom: string; actif: boolean; vues: number; conversions: number }
interface LandingPage {
  id: string;
  nom: string;
  sujet: string;
  template: string;
  statut: string;
  dateCreation: string;
  variants: Variant[];
}

const TEMPLATE_LABELS: Record<string, string> = {
  formation:   "Formation",
  lead_magnet: "Lead Magnet",
  service:     "Service B2B",
  evenement:   "Événement",
};

const TEMPLATE_COLORS: Record<string, string> = {
  formation:   "bg-blue-100 text-blue-700",
  lead_magnet: "bg-violet-100 text-violet-700",
  service:     "bg-emerald-100 text-emerald-700",
  evenement:   "bg-orange-100 text-orange-700",
};

export default function LandingPagesPage() {
  const [pages, setPages] = useState<LandingPage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/landing-pages")
      .then((r) => r.json())
      .then((d) => { setPages(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette landing page et toutes ses variantes ?")) return;
    await fetch(`/api/landing-pages/${id}`, { method: "DELETE" });
    setPages((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Landing Pages</h1>
          <p className="text-sm text-gray-500 mt-0.5">Générez et testez vos pages de conversion A/B</p>
        </div>
        <Link
          href="/landing-pages/nouveau"
          className="inline-flex items-center gap-2 bg-[#1F4E79] hover:bg-[#163a5a] text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouvelle page
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mr-3" />
          Chargement…
        </div>
      ) : pages.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-20 text-center">
          <Globe className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Aucune landing page créée</p>
          <p className="text-gray-400 text-sm mt-1 mb-6">
            Créez des pages optimisées avec A/B testing intégré
          </p>
          <Link
            href="/landing-pages/nouveau"
            className="inline-flex items-center gap-2 bg-[#1F4E79] hover:bg-[#163a5a] text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Créer une landing page
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {pages.map((page) => {
            const totalVues = page.variants.reduce((s, v) => s + v.vues, 0);
            const totalConversions = page.variants.reduce((s, v) => s + v.conversions, 0);
            const tauxConversion = totalVues > 0 ? ((totalConversions / totalVues) * 100).toFixed(1) : "—";
            const activeVariant = page.variants.find((v) => v.actif);
            return (
              <div key={page.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow flex flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${TEMPLATE_COLORS[page.template] ?? "bg-gray-100 text-gray-600"}`}>
                        {TEMPLATE_LABELS[page.template] ?? page.template}
                      </span>
                      {activeVariant && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          Variante {activeVariant.nom} active
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900 text-sm truncate">{page.nom}</h3>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{page.sujet}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(page.id)}
                    className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500">Variantes</p>
                    <p className="text-xl font-bold text-gray-900 mt-0.5">{page.variants.length}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500 flex items-center justify-center gap-1"><Users className="w-3 h-3" />Vues</p>
                    <p className="text-xl font-bold text-gray-900 mt-0.5">{totalVues}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500 flex items-center justify-center gap-1"><BarChart2 className="w-3 h-3" />Taux</p>
                    <p className="text-xl font-bold text-gray-900 mt-0.5">{tauxConversion}{totalVues > 0 ? "%" : ""}</p>
                  </div>
                </div>

                {/* Variant pills */}
                {page.variants.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap">
                    {page.variants.map((v) => (
                      <span key={v.id} className={`text-xs px-2.5 py-1 rounded-full font-medium ${v.actif ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}>
                        {v.nom}
                        {v.vues > 0 && <span className="ml-1 opacity-70">{v.vues}v</span>}
                      </span>
                    ))}
                  </div>
                )}

                <Link
                  href={`/landing-pages/${page.id}`}
                  className="mt-auto text-center text-xs font-medium text-blue-700 hover:text-blue-900 py-2 rounded-lg hover:bg-blue-50 transition-colors border border-blue-100"
                >
                  Gérer les variantes →
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
