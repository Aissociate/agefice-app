"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Search, Target, RefreshCw, Plus, Star, Phone, Mail,
  MessageSquare, ChevronRight, Users, TrendingUp, CheckCircle,
  AlertCircle, Settings2, ChevronDown, ChevronUp, RotateCcw,
  Trash2, ExternalLink,
} from "lucide-react";
import { SECTEURS_LABELS } from "@/lib/leads";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Lead {
  id: string;
  nomEntreprise: string;
  nomDirigeant: string;
  prenomDirigeant?: string | null;
  titrePoste?: string | null;
  telephone?: string | null;
  email?: string | null;
  emailStatus?: string | null;
  linkedinUrl?: string | null;
  secteurActivite?: string | null;
  chiffreAffaires?: number | null;
  effectif?: number | null;
  statut: string;
  scoreLead?: number | null;
  feedbackHumain?: string | null;
  dateDecouverte: string;
  codeApe?: string | null;
  ville?: string | null;
  sourceDonnee?: string | null;
}

interface RechercheParams {
  secteurs: string[];
  effectifMin: number;
  effectifMax: number;
  caMin: number;   // K€
  caMax: number;   // K€
  nombre: number;
  page: number;
}

const PARAMS_DEFAULT: RechercheParams = {
  secteurs: [],
  effectifMin: 4,
  effectifMax: 30,
  caMin: 500,
  caMax: 10000,
  nombre: 30,
  page: 1,
};

const LS_KEY = "leads_recherche_params";

// ─── Statuts ──────────────────────────────────────────────────────────────────
const STATUTS: Record<string, { label: string; bg: string; text: string }> = {
  nouveau:     { label: "Nouveau",      bg: "bg-blue-100",   text: "text-blue-800"   },
  contacte:    { label: "Contacté",     bg: "bg-yellow-100", text: "text-yellow-800" },
  repondu:     { label: "A répondu",    bg: "bg-purple-100", text: "text-purple-800" },
  qualifie:    { label: "Qualifié ✓",   bg: "bg-green-100",  text: "text-green-800"  },
  disqualifie: { label: "Disqualifié",  bg: "bg-red-100",    text: "text-red-800"    },
};

// ─── Sous-composants ──────────────────────────────────────────────────────────
function StarRating({ score, onChange }: { score: number | null | undefined; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <button key={i}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onChange(i); }}
          className={`w-4 h-4 transition-colors ${(score || 0) >= i ? "text-amber-400" : "text-gray-300"} hover:text-amber-400`}
        >
          <Star className="w-full h-full fill-current" />
        </button>
      ))}
    </div>
  );
}

// ─── Panneau paramètres ───────────────────────────────────────────────────────
function PanneauParametres({
  params, onChange, onReset,
}: {
  params: RechercheParams;
  onChange: (p: RechercheParams) => void;
  onReset: () => void;
}) {
  const secteurKeys = Object.keys(SECTEURS_LABELS);

  function toggleSecteur(key: string) {
    const s = params.secteurs.includes(key)
      ? params.secteurs.filter((x) => x !== key)
      : [...params.secteurs, key];
    onChange({ ...params, secteurs: s });
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-5">
      {/* Secteurs */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
            Secteurs ciblés
          </label>
          <span className="text-xs text-gray-400">
            {params.secteurs.length === 0
              ? "Tous les secteurs"
              : `${params.secteurs.length} sélectionné${params.secteurs.length > 1 ? "s" : ""}`}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {secteurKeys.map((key) => {
            const actif = params.secteurs.includes(key);
            return (
              <button
                key={key}
                onClick={() => toggleSecteur(key)}
                className={`text-left px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                  actif
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "bg-white border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-700"
                }`}
              >
                {SECTEURS_LABELS[key]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Effectif */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
            Effectif
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <p className="text-xs text-gray-400 mb-1">Min</p>
              <input type="number" min={1} max={params.effectifMax}
                value={params.effectifMin}
                onChange={(e) => onChange({ ...params, effectifMin: Math.max(1, parseInt(e.target.value) || 1) })}
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <span className="text-gray-400 text-sm mt-4">–</span>
            <div className="flex-1">
              <p className="text-xs text-gray-400 mb-1">Max</p>
              <input type="number" min={params.effectifMin} max={500}
                value={params.effectifMax}
                onChange={(e) => onChange({ ...params, effectifMax: Math.max(params.effectifMin, parseInt(e.target.value) || 30) })}
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-1 text-center">employés</p>
        </div>

        {/* CA */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
            Chiffre d'affaires
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <p className="text-xs text-gray-400 mb-1">Min</p>
              <input type="number" min={0} step={100}
                value={params.caMin}
                onChange={(e) => onChange({ ...params, caMin: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <span className="text-gray-400 text-sm mt-4">–</span>
            <div className="flex-1">
              <p className="text-xs text-gray-400 mb-1">Max</p>
              <input type="number" min={params.caMin} step={100}
                value={params.caMax}
                onChange={(e) => onChange({ ...params, caMax: Math.max(params.caMin, parseInt(e.target.value) || 10000) })}
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-1 text-center">en K€ (filtre estimatif)</p>
        </div>

        {/* Quota + Page */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              Leads par recherche
            </label>
            <div className="flex items-center gap-2">
              <input type="range" min={5} max={50} step={5}
                value={params.nombre}
                onChange={(e) => onChange({ ...params, nombre: parseInt(e.target.value) })}
                className="flex-1 accent-blue-600"
              />
              <span className="text-sm font-bold text-blue-700 w-8 text-right">{params.nombre}</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              Page Pappers
            </label>
            <div className="flex items-center gap-2">
              <button onClick={() => onChange({ ...params, page: Math.max(1, params.page - 1) })}
                className="w-7 h-7 border border-gray-300 rounded flex items-center justify-center text-gray-500 hover:bg-gray-50">−</button>
              <span className="flex-1 text-center text-sm font-medium">{params.page}</span>
              <button onClick={() => onChange({ ...params, page: params.page + 1 })}
                className="w-7 h-7 border border-gray-300 rounded flex items-center justify-center text-gray-500 hover:bg-gray-50">+</button>
            </div>
            <p className="text-xs text-gray-400 mt-1 text-center">pour paginer les résultats</p>
          </div>
        </div>
      </div>

      {/* Reset */}
      <div className="flex justify-end pt-1 border-t border-gray-100">
        <button onClick={onReset}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-600 transition-colors">
          <RotateCcw className="w-3 h-3" />
          Remettre les valeurs par défaut
        </button>
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function LeadsPage() {
  const [leads, setLeads]               = useState<Lead[]>([]);
  const [loading, setLoading]           = useState(true);
  const [searching, setSearching]       = useState(false);
  const [searchResult, setSearchResult] = useState<{
    ajouts: number; doublons: number; total: number;
    withEmail?: number; filteredCount?: number;
    runId?: string; info?: string;
  } | null>(null);
  const [resetting, setResetting] = useState(false);
  const [searchError, setSearchError]   = useState<string | null>(null);
  const [filterStatut, setFilterStatut] = useState("");
  const [filterQ, setFilterQ]           = useState("");
  const [panneauOuvert, setPanneauOuvert] = useState(false);
  const [rechParams, setRechParams]     = useState<RechercheParams>(PARAMS_DEFAULT);
  const [feedbackEditing, setFeedbackEditing] = useState<string | null>(null);
  const [feedbackValues, setFeedbackValues]   = useState<Record<string, string>>({});
  const [selection, setSelection]             = useState<Set<string>>(new Set());
  const [supprimant, setSupprimant]           = useState(false);

  // Chargement localStorage au montage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) setRechParams(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  // Sauvegarde localStorage à chaque changement
  function updateParams(p: RechercheParams) {
    setRechParams(p);
    try { localStorage.setItem(LS_KEY, JSON.stringify(p)); } catch { /* ignore */ }
  }

  function resetParams() {
    updateParams(PARAMS_DEFAULT);
  }

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams();
    if (filterStatut) p.set("statut", filterStatut);
    if (filterQ) p.set("q", filterQ);
    const res = await fetch(`/api/leads?${p}`);
    setLeads(await res.json());
    setLoading(false);
  }, [filterStatut, filterQ]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  async function lancerRecherche() {
    setSearching(true);
    setSearchResult(null);
    setSearchError(null);
    try {
      const res = await fetch("/api/leads/recherche", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rechParams),
      });

      // Lire le body comme texte d'abord pour éviter un crash si ce n'est pas du JSON
      const text = await res.text();
      let data: Record<string, unknown> = {};
      try {
        data = JSON.parse(text);
      } catch {
        // Le serveur a renvoyé du HTML ou autre chose — afficher les 200 premiers caractères
        setSearchError(`Erreur serveur (réponse inattendue) : ${text.slice(0, 200)}`);
        return;
      }

      if (!res.ok) {
        setSearchError((data.error as string) || `Erreur HTTP ${res.status}`);
      } else {
        setSearchResult({
          ajouts:        (data.ajouts        as number) ?? 0,
          doublons:      (data.doublons      as number) ?? 0,
          total:         (data.total         as number) ?? 0,
          withEmail:     data.withEmail      as number | undefined,
          filteredCount: data.filteredCount  as number | undefined,
          runId:         data.runId          as string | undefined,
          info:          data.info           as string | undefined,
        });
        // Incrémenter la page automatiquement pour le prochain appel
        updateParams({ ...rechParams, page: rechParams.page + 1 });
        fetchLeads();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setSearchError(`Erreur réseau : ${msg}`);
    } finally {
      setSearching(false);
    }
  }

  async function resetApifyPool() {
    setResetting(true);
    setSearchError(null);
    try {
      const res  = await fetch("/api/leads/recherche/reset", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setSearchError((data.error as string) || "Erreur reset");
      else setSearchResult(null);
    } catch (e: unknown) {
      setSearchError(`Erreur réseau : ${e instanceof Error ? e.message : String(e)}`);
    } finally { setResetting(false); }
  }

  async function updateScore(id: string, score: number) {
    await fetch(`/api/leads/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scoreLead: score }) });
    setLeads((prev) => prev.map((l) => l.id === id ? { ...l, scoreLead: score } : l));
  }

  async function saveFeedback(id: string) {
    const feedback = feedbackValues[id] ?? "";
    await fetch(`/api/leads/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ feedbackHumain: feedback }) });
    setLeads((prev) => prev.map((l) => l.id === id ? { ...l, feedbackHumain: feedback } : l));
    setFeedbackEditing(null);
  }

  async function updateStatut(id: string, statut: string) {
    await fetch(`/api/leads/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ statut }) });
    setLeads((prev) => prev.map((l) => l.id === id ? { ...l, statut } : l));
  }

  function toggleSelect(id: string) {
    setSelection((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selection.size === leads.length) {
      setSelection(new Set());
    } else {
      setSelection(new Set(leads.map((l) => l.id)));
    }
  }

  async function supprimerSelection() {
    if (!selection.size) return;
    if (!confirm(`Supprimer définitivement ${selection.size} lead${selection.size > 1 ? "s" : ""} ?`)) return;
    setSupprimant(true);
    await fetch("/api/leads", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [...selection] }),
    });
    setLeads((prev) => prev.filter((l) => !selection.has(l.id)));
    setSelection(new Set());
    setSupprimant(false);
  }

  const stats = {
    total:     leads.length,
    contactes: leads.filter((l) => l.statut === "contacte" || l.statut === "repondu").length,
    qualifies: leads.filter((l) => l.statut === "qualifie").length,
  };
  const today = new Date().toDateString();
  const leadsAujourdhui = leads.filter((l) => new Date(l.dateDecouverte).toDateString() === today).length;

  const secteurLabel = rechParams.secteurs.length === 0
    ? "Tous secteurs"
    : rechParams.secteurs.length === 1
      ? SECTEURS_LABELS[rechParams.secteurs[0]]
      : `${rechParams.secteurs.length} secteurs`;

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prospection</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {secteurLabel} · {rechParams.effectifMin}–{rechParams.effectifMax} emp. · {rechParams.caMin}K–{rechParams.caMax}K€ CA · La Réunion
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/leads/nouveau"
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Plus className="w-4 h-4" />
            Manuel
          </Link>
          <button onClick={() => setPanneauOuvert((o) => !o)}
            className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
              panneauOuvert ? "bg-blue-50 border-blue-300 text-blue-700" : "border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}>
            <Settings2 className="w-4 h-4" />
            Paramètres
            {panneauOuvert ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <button onClick={lancerRecherche} disabled={searching}
            className="flex items-center gap-2 px-4 py-2 bg-[#1F4E79] text-white rounded-lg text-sm font-medium hover:bg-[#2E75B6] disabled:opacity-60 transition-colors">
            {searching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
            {searching ? "Recherche…" : `Trouver ${rechParams.nombre} leads`}
          </button>
        </div>
      </div>

      {/* Panneau paramètres (collapsible) */}
      {panneauOuvert && (
        <PanneauParametres
          params={rechParams}
          onChange={updateParams}
          onReset={resetParams}
        />
      )}

      {/* Feedback recherche */}
      {searchResult && (
        <div className={`flex items-start gap-3 p-3.5 border rounded-lg text-sm ${
          searchResult.ajouts > 0 ? "bg-green-50 border-green-200 text-green-800"
          : "bg-yellow-50 border-yellow-200 text-yellow-800"
        }`}>
          <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <p>
              <strong>{searchResult.ajouts} nouveau{searchResult.ajouts > 1 ? "x" : ""} lead{searchResult.ajouts > 1 ? "s" : ""}</strong> enregistré{searchResult.ajouts > 1 ? "s" : ""} depuis Apify
            </p>
            <div className="text-xs flex flex-wrap gap-3 opacity-70">
              {searchResult.total > 0      && <span>📦 {searchResult.total} dans le dataset</span>}
              {(searchResult.withEmail ?? 0) > 0 && <span>✉️ {searchResult.withEmail} avec email</span>}
              {(searchResult.filteredCount ?? 0) > 0 && <span>🔍 {searchResult.filteredCount} éligibles</span>}
              {searchResult.doublons > 0   && <span>⊘ {searchResult.doublons} doublon{searchResult.doublons > 1 ? "s" : ""}</span>}
            </div>
            {searchResult.info && (
              <p className="text-xs mt-1 italic opacity-80">{searchResult.info}</p>
            )}
            {/* Pool épuisé → proposer reset */}
            {searchResult.ajouts === 0 && searchResult.total > 0 && (
              <button onClick={resetApifyPool} disabled={resetting}
                className="mt-1 text-xs underline opacity-70 hover:opacity-100 flex items-center gap-1">
                {resetting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                Réinitialiser le pool Apify pour retrouver les mêmes contacts
              </button>
            )}
          </div>
        </div>
      )}
      {searchError && (
        <div className="flex items-center gap-3 p-3.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{searchError}</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { icon: Users,        bg: "bg-blue-100",   ic: "text-blue-700",  val: stats.total,          label: "Total leads"         },
          { icon: Target,       bg: "bg-orange-100", ic: "text-orange-700",val: leadsAujourdhui,       label: "Trouvés aujourd'hui" },
          { icon: MessageSquare,bg: "bg-yellow-100", ic: "text-yellow-700",val: stats.contactes,       label: "Contactés"           },
          { icon: TrendingUp,   bg: "bg-green-100",  ic: "text-green-700", val: stats.qualifies,       label: "Qualifiés"           },
        ].map(({ icon: Icon, bg, ic, val, label }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center`}>
              <Icon className={`w-5 h-5 ${ic}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{val}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filtres + barre de sélection */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Rechercher…" value={filterQ}
              onChange={(e) => setFilterQ(e.target.value)}
              className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm w-56 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Tous les statuts</option>
            {Object.entries(STATUTS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>

        {/* Barre d'actions en masse */}
        {selection.size > 0 && (
          <div className="flex items-center gap-3 px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
            <span className="text-sm font-medium text-red-700">
              {selection.size} sélectionné{selection.size > 1 ? "s" : ""}
            </span>
            <button
              onClick={supprimerSelection}
              disabled={supprimant}
              className="flex items-center gap-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 px-3 py-1.5 rounded-lg transition-colors"
            >
              {supprimant
                ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                : <Trash2 className="w-3.5 h-3.5" />}
              Supprimer
            </button>
            <button onClick={() => setSelection(new Set())} className="text-xs text-red-500 hover:text-red-700">
              Annuler
            </button>
          </div>
        )}
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400 text-sm">Chargement…</div>
        ) : leads.length === 0 ? (
          <div className="p-12 text-center">
            <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Aucun lead trouvé.</p>
            <p className="text-gray-400 text-xs mt-1">
              Configurez les paramètres puis cliquez sur &ldquo;Trouver {rechParams.nombre} leads&rdquo;.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 w-8">
                    <input
                      type="checkbox"
                      checked={leads.length > 0 && selection.size === leads.length}
                      ref={(el) => { if (el) el.indeterminate = selection.size > 0 && selection.size < leads.length; }}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 accent-blue-600 cursor-pointer"
                    />
                  </th>
                  {["Entreprise / Dirigeant","Contact","Secteur","Taille","Statut","Score","Feedback",""].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leads.map((lead) => (
                  <tr key={lead.id}
                    className={`hover:bg-gray-50 transition-colors ${selection.has(lead.id) ? "bg-red-50 hover:bg-red-50" : ""}`}>
                    <td className="px-4 py-3 w-8">
                      <input
                        type="checkbox"
                        checked={selection.has(lead.id)}
                        onChange={() => toggleSelect(lead.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 accent-blue-600 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{lead.nomEntreprise}</p>
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs text-gray-500">{[lead.prenomDirigeant, lead.nomDirigeant].filter(Boolean).join(" ")}</p>
                        {lead.linkedinUrl && (
                          <a href={lead.linkedinUrl} target="_blank" rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-blue-400 hover:text-blue-600" title="Profil LinkedIn">
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      {lead.titrePoste && <p className="text-xs text-blue-600 font-medium">{lead.titrePoste}</p>}
                      {lead.ville && <p className="text-xs text-gray-400">{lead.ville}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        {lead.telephone ? (
                          <a href={`tel:${lead.telephone}`} onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline">
                            <Phone className="w-3 h-3" />{lead.telephone}
                          </a>
                        ) : null}
                        {lead.email ? (
                          <a href={`mailto:${lead.email}`} onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline truncate max-w-[160px]"
                            title={
                              lead.emailStatus === "deliverable"    ? "✅ Email vérifié (deliverable)"
                              : lead.emailStatus === "pattern_match" ? "🔮 Email probable (pattern)"
                              : lead.emailStatus === "unavailable"  ? "⚠️ Délivrabilité non vérifiée"
                              : "Email"
                            }>
                            <Mail className={`w-3 h-3 shrink-0 ${
                              lead.emailStatus === "deliverable"   ? "text-green-600"
                              : lead.emailStatus === "pattern_match" ? "text-amber-500"
                              : "text-blue-400"
                            }`} />
                            <span className="truncate">{lead.email}</span>
                            {lead.emailStatus === "deliverable"    && <span className="shrink-0 text-[10px] bg-green-100 text-green-700 px-1 rounded font-medium">✓</span>}
                            {lead.emailStatus === "pattern_match"  && <span className="shrink-0 text-[10px] bg-amber-100 text-amber-700 px-1 rounded font-medium">~</span>}
                          </a>
                        ) : null}
                        {!lead.telephone && !lead.email && (
                          <span className="text-xs text-gray-400 italic">À compléter</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-gray-700">{lead.secteurActivite || "—"}</p>
                      {lead.codeApe && <p className="text-xs text-gray-400">APE {lead.codeApe}</p>}
                    </td>
                    <td className="px-4 py-3">
                      {lead.effectif && <p className="text-xs text-gray-700">{lead.effectif} emp.</p>}
                      {lead.chiffreAffaires && <p className="text-xs text-gray-500">{(lead.chiffreAffaires/1000).toFixed(0)}K€</p>}
                    </td>
                    <td className="px-4 py-3">
                      <select value={lead.statut}
                        onChange={(e) => { e.stopPropagation(); updateStatut(lead.id, e.target.value); }}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs border border-gray-200 rounded px-2 py-1 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-400">
                        {Object.entries(STATUTS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <StarRating score={lead.scoreLead} onChange={(v) => updateScore(lead.id, v)} />
                    </td>
                    <td className="px-4 py-3 max-w-[200px]">
                      {feedbackEditing === lead.id ? (
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <input autoFocus type="text"
                            value={feedbackValues[lead.id] ?? lead.feedbackHumain ?? ""}
                            onChange={(e) => setFeedbackValues((p) => ({ ...p, [lead.id]: e.target.value }))}
                            onKeyDown={(e) => { if (e.key === "Enter") saveFeedback(lead.id); if (e.key === "Escape") setFeedbackEditing(null); }}
                            className="flex-1 text-xs border border-blue-400 rounded px-2 py-1 focus:outline-none"
                            placeholder="Notes…"
                          />
                          <button onClick={() => saveFeedback(lead.id)} className="text-xs text-blue-600 font-medium hover:underline">OK</button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); setFeedbackEditing(lead.id); setFeedbackValues((p) => ({ ...p, [lead.id]: lead.feedbackHumain ?? "" })); }}
                          className="text-xs text-left text-gray-500 hover:text-blue-600 italic truncate w-full"
                          title={lead.feedbackHumain || "Ajouter un feedback"}>
                          {lead.feedbackHumain || "Ajouter…"}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/leads/${lead.id}`}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium">
                        Voir <ChevronRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 text-center">
        ★ pour noter · clic sur Feedback pour noter · les paramètres sont sauvegardés automatiquement
      </p>
    </div>
  );
}
