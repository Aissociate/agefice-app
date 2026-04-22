"use client";

import { useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, Plus, X, MapPin, StickyNote, Trash2, Check } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Lead { id: string; nomEntreprise: string; nomDirigeant: string; prenomDirigeant?: string | null }
interface Session {
  id: string;
  leadId: string;
  titre: string;
  dateDebut: string;
  dateFin: string;
  lieu?: string | null;
  notes?: string | null;
  statut: string;
  lead: Lead;
}

const STATUTS = {
  planifie:  { label: "Planifiée",  bg: "bg-blue-100",  text: "text-blue-800",  dot: "bg-blue-500"  },
  confirme:  { label: "Confirmée", bg: "bg-green-100", text: "text-green-800", dot: "bg-green-500" },
  annule:    { label: "Annulée",   bg: "bg-red-100",   text: "text-red-800",   dot: "bg-red-500"   },
  realise:   { label: "Réalisée",  bg: "bg-gray-100",  text: "text-gray-700",  dot: "bg-gray-400"  },
};

const JOURS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MOIS  = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

// Couleurs distinctes par lead (hash)
function leadColor(id: string): { bg: string; text: string; border: string } {
  const COLORS = [
    { bg: "bg-blue-500",   text: "text-white", border: "border-blue-600"   },
    { bg: "bg-purple-500", text: "text-white", border: "border-purple-600" },
    { bg: "bg-green-500",  text: "text-white", border: "border-green-600"  },
    { bg: "bg-amber-500",  text: "text-white", border: "border-amber-600"  },
    { bg: "bg-rose-500",   text: "text-white", border: "border-rose-600"   },
    { bg: "bg-indigo-500", text: "text-white", border: "border-indigo-600" },
    { bg: "bg-teal-500",   text: "text-white", border: "border-teal-600"   },
    { bg: "bg-orange-500", text: "text-white", border: "border-orange-600" },
  ];
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % COLORS.length;
  return COLORS[Math.abs(h) % COLORS.length];
}

function fmt(d: string) {
  return new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function toLocalISO(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ─── Formulaire session ───────────────────────────────────────────────────────
function SessionModal({
  session,
  leads,
  defaultDate,
  onSave,
  onDelete,
  onClose,
}: {
  session?: Session;
  leads: Lead[];
  defaultDate?: string;
  onSave: (data: Partial<Session>) => Promise<void>;
  onDelete?: () => Promise<void>;
  onClose: () => void;
}) {
  const now = defaultDate ? new Date(defaultDate) : new Date();
  const end = new Date(now); end.setHours(end.getHours() + 2);

  const [leadId,   setLeadId]   = useState(session?.leadId   ?? leads[0]?.id ?? "");
  const [titre,    setTitre]    = useState(session?.titre    ?? "");
  const [debut,    setDebut]    = useState(session ? toLocalISO(new Date(session.dateDebut)) : toLocalISO(now));
  const [fin,      setFin]      = useState(session ? toLocalISO(new Date(session.dateFin))   : toLocalISO(end));
  const [lieu,     setLieu]     = useState(session?.lieu     ?? "");
  const [notes,    setNotes]    = useState(session?.notes    ?? "");
  const [statut,   setStatut]   = useState(session?.statut   ?? "planifie");
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!leadId || !titre || !debut || !fin) return;
    setSaving(true);
    await onSave({ leadId, titre, dateDebut: debut, dateFin: fin, lieu: lieu || null, notes: notes || null, statut });
    setSaving(false);
  }

  async function handleDelete() {
    if (!onDelete || !confirm("Supprimer cette session ?")) return;
    setDeleting(true);
    await onDelete();
    setDeleting(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">{session ? "Modifier la session" : "Nouvelle session"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={submit} className="px-6 py-5 space-y-4">
          {/* Lead */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Client inscrit
            </label>
            <select
              value={leadId} onChange={(e) => setLeadId(e.target.value)} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {leads.length === 0 && <option value="">— Aucun inscrit —</option>}
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nomEntreprise} — {[l.prenomDirigeant, l.nomDirigeant].filter(Boolean).join(" ")}
                </option>
              ))}
            </select>
          </div>

          {/* Titre */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Intitulé de la session
            </label>
            <input
              type="text" value={titre} onChange={(e) => setTitre(e.target.value)} required
              placeholder="Ex : Formation IA — Journée 1"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Début</label>
              <input
                type="datetime-local" value={debut} onChange={(e) => setDebut(e.target.value)} required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Fin</label>
              <input
                type="datetime-local" value={fin} onChange={(e) => setFin(e.target.value)} required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Lieu */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              <MapPin className="inline w-3 h-3 mr-1" />Lieu
            </label>
            <input
              type="text" value={lieu} onChange={(e) => setLieu(e.target.value)}
              placeholder="Adresse ou visio"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Statut */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Statut</label>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(STATUTS).map(([k, v]) => (
                <button
                  key={k} type="button"
                  onClick={() => setStatut(k)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    statut === k ? `${v.bg} ${v.text} border-transparent` : "bg-white text-gray-500 border-gray-300 hover:border-gray-400"
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              <StickyNote className="inline w-3 h-3 mr-1" />Notes
            </label>
            <textarea
              value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              placeholder="Informations complémentaires…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-1">
            {session && onDelete && (
              <button
                type="button" onClick={handleDelete} disabled={deleting}
                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Supprimer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
              Annuler
            </button>
            <button
              type="submit" disabled={saving || !leadId}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#1F4E79] text-white rounded-lg text-sm font-medium hover:bg-[#2E75B6] disabled:opacity-60 transition-colors"
            >
              <Check className="w-4 h-4" />
              {saving ? "Enregistrement…" : session ? "Modifier" : "Créer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function CalendrierPage() {
  const today = new Date();
  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1); // 1-12
  const [sessions, setSessions] = useState<Session[]>([]);
  const [leads,    setLeads]    = useState<Lead[]>([]);
  const [loading,  setLoading]  = useState(true);

  // Modal state
  const [modal, setModal] = useState<
    | { mode: "create"; date: string }
    | { mode: "edit";   session: Session }
    | null
  >(null);

  // Chargement sessions du mois
  const fetchSessions = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/sessions?year=${year}&month=${month}`);
    setSessions(await res.json());
    setLoading(false);
  }, [year, month]);

  // Chargement leads inscrits
  useEffect(() => {
    fetch("/api/leads?statut=inscrit")
      .then((r) => r.json())
      .then((data: Lead[]) => setLeads(Array.isArray(data) ? data : []));
  }, []);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  // Navigation mois
  function prevMonth() {
    if (month === 1) { setYear((y) => y - 1); setMonth(12); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setYear((y) => y + 1); setMonth(1); }
    else setMonth((m) => m + 1);
  }

  // Grille calendrier
  const firstDay = new Date(year, month - 1, 1);
  // lundi=0 en base ISO
  const startDow = (firstDay.getDay() + 6) % 7; // 0=lun
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Complète pour avoir des rangées complètes
  while (cells.length % 7 !== 0) cells.push(null);

  // Groupe sessions par jour
  const byDay: Record<number, Session[]> = {};
  for (const s of sessions) {
    const d = new Date(s.dateDebut).getDate();
    byDay[d] = [...(byDay[d] ?? []), s];
  }

  const todayKey = `${today.getFullYear()}-${today.getMonth()+1}-${today.getDate()}`;

  // Crée / modifie une session
  async function handleSave(data: Partial<Session>) {
    if (modal?.mode === "edit") {
      const res = await fetch(`/api/sessions/${modal.session.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
      });
      const updated = await res.json();
      setSessions((prev) => prev.map((s) => s.id === updated.id ? updated : s));
    } else {
      const res = await fetch("/api/sessions", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
      });
      const created = await res.json();
      const d = new Date(created.dateDebut);
      if (d.getFullYear() === year && d.getMonth() + 1 === month) {
        setSessions((prev) => [...prev, created].sort((a, b) => a.dateDebut.localeCompare(b.dateDebut)));
      }
    }
    setModal(null);
  }

  async function handleDelete() {
    if (modal?.mode !== "edit") return;
    await fetch(`/api/sessions/${modal.session.id}`, { method: "DELETE" });
    setSessions((prev) => prev.filter((s) => s.id !== modal.session.id));
    setModal(null);
  }

  function openCreate(day: number) {
    const d = new Date(year, month - 1, day, 9, 0);
    const pad = (n: number) => String(n).padStart(2, "0");
    setModal({ mode: "create", date: `${year}-${pad(month)}-${pad(day)}T09:00` });
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendrier formations</h1>
          <p className="text-sm text-gray-500 mt-0.5">Sessions planifiées pour les clients inscrits</p>
        </div>
        <button
          onClick={() => setModal({ mode: "create", date: "" })}
          className="flex items-center gap-2 px-4 py-2 bg-[#1F4E79] text-white rounded-lg text-sm font-medium hover:bg-[#2E75B6] transition-colors"
        >
          <Plus className="w-4 h-4" /> Nouvelle session
        </button>
      </div>

      {/* Calendrier */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Navigation mois */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-bold text-gray-900">
            {MOIS[month - 1]} {year}
          </h2>
          <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* En-têtes jours */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {JOURS.map((j) => (
            <div key={j} className="py-2 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {j}
            </div>
          ))}
        </div>

        {/* Grille */}
        {loading ? (
          <div className="py-20 text-center text-gray-400 text-sm">Chargement…</div>
        ) : (
          <div className="grid grid-cols-7 divide-x divide-y divide-gray-100">
            {cells.map((day, i) => {
              if (!day) return <div key={`empty-${i}`} className="min-h-[110px] bg-gray-50/50" />;

              const isToday = `${year}-${month}-${day}` === todayKey;
              const daySessions = byDay[day] ?? [];

              return (
                <div
                  key={day}
                  onClick={() => openCreate(day)}
                  className="min-h-[110px] p-2 cursor-pointer hover:bg-blue-50/40 transition-colors group"
                >
                  <div className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium mb-1.5 ${
                    isToday ? "bg-[#1F4E79] text-white" : "text-gray-700 group-hover:bg-blue-100"
                  }`}>
                    {day}
                  </div>
                  <div className="space-y-1">
                    {daySessions.map((s) => {
                      const c = leadColor(s.leadId);
                      const st = STATUTS[s.statut as keyof typeof STATUTS];
                      return (
                        <button
                          key={s.id}
                          onClick={(e) => { e.stopPropagation(); setModal({ mode: "edit", session: s }); }}
                          className={`w-full text-left px-2 py-1 rounded-md text-[11px] font-medium ${c.bg} ${c.text} leading-tight truncate hover:opacity-80 transition-opacity border ${c.border}`}
                          title={`${s.titre} — ${s.lead.nomEntreprise}\n${fmt(s.dateDebut)} → ${fmt(s.dateFin)}${s.lieu ? `\n${s.lieu}` : ""}`}
                        >
                          <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${st?.dot ?? "bg-white"} opacity-70`} />
                          {fmt(s.dateDebut)} {s.titre}
                        </button>
                      );
                    })}
                    {daySessions.length > 2 && (
                      <p className="text-[10px] text-gray-400 pl-1">+{daySessions.length - 2} de plus</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Liste sessions du mois */}
      {sessions.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 text-sm">{sessions.length} session{sessions.length > 1 ? "s" : ""} ce mois</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {sessions.map((s) => {
              const c  = leadColor(s.leadId);
              const st = STATUTS[s.statut as keyof typeof STATUTS];
              return (
                <div
                  key={s.id}
                  onClick={() => setModal({ mode: "edit", session: s })}
                  className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className={`w-3 h-3 rounded-full shrink-0 ${c.bg}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{s.titre}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {s.lead.nomEntreprise} · {[s.lead.prenomDirigeant, s.lead.nomDirigeant].filter(Boolean).join(" ")}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-medium text-gray-700">
                      {new Date(s.dateDebut).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                    </p>
                    <p className="text-xs text-gray-400">{fmt(s.dateDebut)} → {fmt(s.dateFin)}</p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${st?.bg} ${st?.text}`}>
                    {st?.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <SessionModal
          session={modal.mode === "edit" ? modal.session : undefined}
          leads={leads}
          defaultDate={modal.mode === "create" ? modal.date : undefined}
          onSave={handleSave}
          onDelete={modal.mode === "edit" ? handleDelete : undefined}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
