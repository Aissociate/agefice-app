"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Search, RefreshCw, Plus, Star, Phone, Mail,
  CheckCircle, AlertCircle, Sheet, ChevronLeft, ChevronRight,
  ExternalLink, MessageSquare, Trash2, Users, FolderOpen, GraduationCap,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Lead {
  id: string;
  nomEntreprise: string;
  nomDirigeant: string;
  prenomDirigeant?: string | null;
  telephone?: string | null;
  email?: string | null;
  linkedinUrl?: string | null;
  secteurActivite?: string | null;
  effectif?: number | null;
  statut: string;
  scoreLead?: number | null;
  feedbackHumain?: string | null;
  ville?: string | null;
  clientId?: string | null;
}

// ─── Pipeline columns ─────────────────────────────────────────────────────────
const COLUMNS = [
  {
    statut: "nouveau",
    label: "Prospects",
    description: "Leads Google Sheet",
    headerBg: "bg-blue-600",
    cardBorder: "border-blue-200",
    countBg: "bg-blue-500",
  },
  {
    statut: "contacte",
    label: "Contactés",
    description: "Premier contact établi",
    headerBg: "bg-amber-500",
    cardBorder: "border-amber-200",
    countBg: "bg-amber-400",
  },
  {
    statut: "repondu",
    label: "En discussion",
    description: "En attente de réponse",
    headerBg: "bg-purple-600",
    cardBorder: "border-purple-200",
    countBg: "bg-purple-500",
  },
  {
    statut: "qualifie",
    label: "Dossier AGEFICE",
    description: "Dossier en cours",
    headerBg: "bg-green-600",
    cardBorder: "border-green-200",
    countBg: "bg-green-500",
  },
  {
    statut: "inscrit",
    label: "Inscrit formation",
    description: "Formation confirmée",
    headerBg: "bg-indigo-600",
    cardBorder: "border-indigo-200",
    countBg: "bg-indigo-500",
  },
  {
    statut: "disqualifie",
    label: "Non retenu",
    description: "Sans suite",
    headerBg: "bg-gray-500",
    cardBorder: "border-gray-200",
    countBg: "bg-gray-400",
  },
] as const;

type Statut = (typeof COLUMNS)[number]["statut"];

const STATUT_ORDER = COLUMNS.map((c) => c.statut);

// ─── StarRating ───────────────────────────────────────────────────────────────
function StarRating({ score, onChange }: { score: number | null | undefined; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onChange(i); }}
          className={`w-3.5 h-3.5 transition-colors ${(score || 0) >= i ? "text-amber-400" : "text-gray-300"} hover:text-amber-400`}
        >
          <Star className="w-full h-full fill-current" />
        </button>
      ))}
    </div>
  );
}

// ─── LeadCard ─────────────────────────────────────────────────────────────────
function LeadCard({
  lead,
  colIndex,
  onMove,
  onScore,
  onDelete,
}: {
  lead: Lead;
  colIndex: number;
  onMove: (id: string, statut: string) => void;
  onScore: (id: string, score: number) => void;
  onDelete: (id: string) => void;
}) {
  const isFirst = colIndex === 0;
  const isLast  = colIndex === STATUT_ORDER.length - 1;

  return (
    <div className={`bg-white rounded-lg border ${COLUMNS[colIndex].cardBorder} shadow-sm p-3 space-y-2 group`}>
      {/* Company + name */}
      <div>
        <Link
          href={lead.clientId ? `/clients/${lead.clientId}` : `/leads/${lead.id}`}
          className="block hover:text-blue-700 transition-colors"
        >
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-gray-900 text-sm leading-tight">
              {lead.nomEntreprise}
            </span>
            {lead.clientId && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-100 text-green-700">
                Client
              </span>
            )}
          </div>
          <p className="text-xs text-blue-600 font-medium mt-0.5">
            {[lead.prenomDirigeant, lead.nomDirigeant].filter(Boolean).join(" ")}
          </p>
          {lead.ville && <p className="text-xs text-gray-400">{lead.ville}</p>}
        </Link>
      </div>

      {/* Contact */}
      <div className="space-y-0.5">
        {lead.telephone && (
          <a
            href={`tel:${lead.telephone}`}
            className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            <Phone className="w-3 h-3 shrink-0" />
            <span className="truncate">{lead.telephone}</span>
          </a>
        )}
        {lead.email && (
          <a
            href={`mailto:${lead.email}`}
            className="flex items-center gap-1 text-xs text-blue-600 hover:underline truncate"
            onClick={(e) => e.stopPropagation()}
            title={lead.email}
          >
            <Mail className="w-3 h-3 shrink-0" />
            <span className="truncate">{lead.email}</span>
          </a>
        )}
      </div>

      {/* Notes snippet */}
      {lead.feedbackHumain && (
        <div className="flex items-start gap-1 text-xs text-gray-500 italic">
          <MessageSquare className="w-3 h-3 shrink-0 mt-0.5 text-gray-400" />
          <span className="line-clamp-2">{lead.feedbackHumain}</span>
        </div>
      )}

      {/* Footer: score + move + links */}
      <div className="flex items-center justify-between pt-1 border-t border-gray-100">
        <StarRating score={lead.scoreLead} onChange={(v) => onScore(lead.id, v)} />
        <div className="flex items-center gap-1">
          {lead.linkedinUrl && (
            <a
              href={lead.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-1 text-blue-400 hover:text-blue-600"
              title="LinkedIn"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
          <button
            onClick={() => onDelete(lead.id)}
            className="p-1 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
            title="Supprimer"
          >
            <Trash2 className="w-3 h-3" />
          </button>
          {!isFirst && (
            <button
              onClick={() => onMove(lead.id, STATUT_ORDER[colIndex - 1])}
              className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
              title="Reculer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          {!isLast && (
            <button
              onClick={() => onMove(lead.id, STATUT_ORDER[colIndex + 1])}
              className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
              title="Avancer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function LeadsPage() {
  const [leads, setLeads]           = useState<Lead[]>([]);
  const [loading, setLoading]       = useState(true);
  const [syncing, setSyncing]       = useState(false);
  const [syncResult, setSyncResult] = useState<{
    created: number; updated: number; skipped: number; synced: number;
  } | null>(null);
  const [syncError, setSyncError]   = useState<string | null>(null);
  const [lastSync, setLastSync]     = useState<string | null>(null);
  const [filterQ, setFilterQ]       = useState("");

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/leads");
    setLeads(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  useEffect(() => {
    fetch("/api/parametres")
      .then((r) => r.json())
      .then((data: Record<string, string>) => {
        if (data.leads_sheet_last_sync) setLastSync(data.leads_sheet_last_sync);
      })
      .catch(() => {});
  }, []);

  async function lancerSyncSheet() {
    setSyncing(true);
    setSyncResult(null);
    setSyncError(null);
    try {
      const res  = await fetch("/api/leads/sync-sheet");
      const data = await res.json().catch(() => ({})) as Record<string, unknown>;
      if (!res.ok) {
        setSyncError((data.error as string) || `Erreur HTTP ${res.status}`);
      } else {
        setSyncResult({
          created: (data.created as number) ?? 0,
          updated: (data.updated as number) ?? 0,
          skipped: (data.skipped as number) ?? 0,
          synced:  (data.synced  as number) ?? 0,
        });
        setLastSync(new Date().toISOString());
        fetchLeads();
      }
    } catch (e: unknown) {
      setSyncError(`Erreur réseau : ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSyncing(false);
    }
  }

  async function moveCard(id: string, statut: string) {
    await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut }),
    });
    setLeads((prev) => prev.map((l) => l.id === id ? { ...l, statut } : l));
  }

  async function updateScore(id: string, score: number) {
    await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scoreLead: score }),
    });
    setLeads((prev) => prev.map((l) => l.id === id ? { ...l, scoreLead: score } : l));
  }

  async function deleteLead(id: string) {
    if (!confirm("Supprimer ce lead définitivement ?")) return;
    await fetch("/api/leads", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id] }),
    });
    setLeads((prev) => prev.filter((l) => l.id !== id));
  }

  const q = filterQ.toLowerCase();
  const filtered = q
    ? leads.filter(
        (l) =>
          l.nomEntreprise?.toLowerCase().includes(q) ||
          l.nomDirigeant?.toLowerCase().includes(q) ||
          l.email?.toLowerCase().includes(q) ||
          l.telephone?.includes(q) ||
          l.ville?.toLowerCase().includes(q)
      )
    : leads;

  const grouped = COLUMNS.map((col, idx) => ({
    ...col,
    idx,
    leads: filtered.filter((l) => l.statut === col.statut),
  }));

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 space-y-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pipeline de prospection</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Synchronisation Google Sheet · auto toutes les 10 min (7h–20h)
            </p>
            {lastSync && (
              <p className="text-xs text-gray-400 mt-0.5">
                Dernière synchro :{" "}
                {new Date(lastSync).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
              </p>
            )}
          </div>
          <div className="flex gap-2 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher…"
                value={filterQ}
                onChange={(e) => setFilterQ(e.target.value)}
                className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm w-52 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <Link
              href="/leads/nouveau"
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Plus className="w-4 h-4" />
              Manuel
            </Link>
            <button
              onClick={lancerSyncSheet}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2 bg-[#1F4E79] text-white rounded-lg text-sm font-medium hover:bg-[#2E75B6] disabled:opacity-60 transition-colors"
            >
              {syncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sheet className="w-4 h-4" />}
              {syncing ? "Synchronisation…" : "Synchroniser le sheet"}
            </button>
          </div>
        </div>

        {/* Feedback sync */}
        {syncResult && (
          <div className={`flex items-start gap-3 p-3 border rounded-lg text-sm ${
            syncResult.synced > 0
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-yellow-50 border-yellow-200 text-yellow-800"
          }`}>
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-medium">{syncResult.synced} prospect{syncResult.synced > 1 ? "s" : ""}</span>
              {" "}synchronisé{syncResult.synced > 1 ? "s" : ""}
              <span className="text-xs opacity-70 ml-3">
                {syncResult.created > 0 && `+${syncResult.created} nouveau${syncResult.created > 1 ? "x" : ""} `}
                {syncResult.updated > 0 && `↻${syncResult.updated} mis à jour `}
                {syncResult.skipped > 0 && `⊘${syncResult.skipped} ignoré${syncResult.skipped > 1 ? "s" : ""}`}
              </span>
            </div>
          </div>
        )}
        {syncError && (
          <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{syncError}</span>
          </div>
        )}
      </div>

      {/* KPIs */}
      {!loading && (
        <div className="px-6 pb-2 grid grid-cols-3 gap-4 flex-shrink-0">
          {[
            {
              label: "Nouveaux leads",
              value: grouped.find((c) => c.statut === "nouveau")?.leads.length ?? 0,
              icon: Users,
              bg: "bg-blue-50", text: "text-blue-700", iconBg: "bg-blue-100",
            },
            {
              label: "Dossiers en cours",
              value: grouped.find((c) => c.statut === "qualifie")?.leads.length ?? 0,
              icon: FolderOpen,
              bg: "bg-green-50", text: "text-green-700", iconBg: "bg-green-100",
            },
            {
              label: "Formations confirmées",
              value: grouped.find((c) => c.statut === "inscrit")?.leads.length ?? 0,
              icon: GraduationCap,
              bg: "bg-indigo-50", text: "text-indigo-700", iconBg: "bg-indigo-100",
            },
          ].map(({ label, value, icon: Icon, bg, text, iconBg }) => (
            <div key={label} className={`${bg} rounded-xl border border-gray-200 p-4 flex items-center gap-3`}>
              <div className={`${iconBg} rounded-lg p-2`}>
                <Icon className={`w-5 h-5 ${text}`} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${text}`}>{value}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Kanban board */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
          Chargement…
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto px-6 pb-6">
          <div className="flex gap-4 h-full min-w-max">
            {grouped.map((col) => (
              <div key={col.statut} className="flex flex-col w-72 min-w-[288px]">
                {/* Column header */}
                <div className={`${col.headerBg} text-white rounded-t-xl px-4 py-3 flex items-center justify-between`}>
                  <div>
                    <p className="font-semibold text-sm">{col.label}</p>
                    <p className="text-xs opacity-75">{col.description}</p>
                  </div>
                  <span className={`${col.countBg} text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center`}>
                    {col.leads.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex-1 bg-gray-50 rounded-b-xl border border-t-0 border-gray-200 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-240px)]">
                  {col.leads.length === 0 ? (
                    <div className="text-center text-xs text-gray-400 italic py-8">
                      Aucun lead
                    </div>
                  ) : (
                    col.leads.map((lead) => (
                      <LeadCard
                        key={lead.id}
                        lead={lead}
                        colIndex={col.idx}
                        onMove={moveCard}
                        onScore={updateScore}
                        onDelete={deleteLead}
                      />
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
