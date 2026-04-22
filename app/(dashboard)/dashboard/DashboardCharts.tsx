"use client";

import { useEffect, useState } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Clock } from "lucide-react";

interface StatsData {
  leadsParStatut: Record<string, number>;
  activiteMensuelle: { label: string; dossiers: number; leads: number; montant: number }[];
  dureesPipeline: { etape: string; jours: number | null; n: number }[];
  dossiersStatut: { statut: string; count: number }[];
}

const STATUT_LABELS: Record<string, string> = {
  nouveau:        "Prospects",
  contacte:       "Contactés",
  repondu:        "En discussion",
  qualifie:       "Dossier AGEFICE",
  inscrit:        "Inscrits",
  disqualifie:    "Non retenus",
};

const LEAD_COLORS = ["#1F4E79","#F59E0B","#8B5CF6","#10B981","#06B6D4","#EF4444"];

const DOSSIER_LABELS: Record<string, { label: string; color: string }> = {
  en_preparation: { label: "En préparation", color: "#94A3B8" },
  depose:         { label: "Déposé",          color: "#3B82F6" },
  en_cours:       { label: "En cours",        color: "#F59E0B" },
  accord:         { label: "Accordé",         color: "#10B981" },
  rembourse:      { label: "Remboursé",       color: "#1F4E79" },
  refuse:         { label: "Refusé",          color: "#EF4444" },
};

const PIPELINE_BAR_COLOR = "#2E75B6";

export default function DashboardCharts() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => { setStats(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 h-72 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  // Pie data pour leads
  const leadsPieData = Object.entries(stats.leadsParStatut)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ name: STATUT_LABELS[k] ?? k, value: v }));

  // Pie data pour dossiers
  const dossiersPieData = stats.dossiersStatut
    .filter((d) => d.count > 0)
    .map((d) => ({
      name: DOSSIER_LABELS[d.statut]?.label ?? d.statut,
      value: d.count,
      color: DOSSIER_LABELS[d.statut]?.color ?? "#94A3B8",
    }));

  return (
    <div className="space-y-6">
      {/* Ligne 1 : courbe activité + camembert leads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Courbe activité mensuelle */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Activité mensuelle</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={stats.activiteMensuelle} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0" }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                type="monotone" dataKey="dossiers" name="Dossiers"
                stroke="#1F4E79" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }}
              />
              <Line
                type="monotone" dataKey="leads" name="Leads"
                stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} strokeDasharray="4 2"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Camembert leads par statut */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Pipeline prospects</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={leadsPieData} cx="50%" cy="50%"
                innerRadius={60} outerRadius={95}
                paddingAngle={2} dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {leadsPieData.map((_, i) => (
                  <Cell key={i} fill={LEAD_COLORS[i % LEAD_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Ligne 2 : camembert dossiers + durées pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Camembert dossiers par statut */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Dossiers par statut</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={dossiersPieData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0" }} />
              <Bar dataKey="value" name="Dossiers" radius={[4, 4, 0, 0]}>
                {dossiersPieData.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Durées pipeline */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#1F4E79]" />
            Temps de traitement par étape
          </h3>
          {stats.dureesPipeline.every((d) => d.jours === null) ? (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
              Données insuffisantes — les durées se calculent au fil des changements de statut
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={stats.dureesPipeline.filter((d) => d.jours !== null)}
                layout="vertical"
                margin={{ top: 5, right: 40, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} unit=" j" />
                <YAxis dataKey="etape" type="category" width={160} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0" }}
                  formatter={(v: number, _: string, p) => [
                    `${v} jour${v > 1 ? "s" : ""} (n=${p.payload.n})`,
                    "Durée moy.",
                  ]}
                />
                <Bar dataKey="jours" name="Durée moy." fill={PIPELINE_BAR_COLOR} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
