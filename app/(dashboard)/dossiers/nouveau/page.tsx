"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, ArrowRight, Check, AlertTriangle, Clock, BookOpen,
  User, CreditCard, FileCheck, Calendar, Star, Plus, Trash2, SkipForward,
} from "lucide-react";
import {
  formatDate, formatMontant, joursRestants,
  calculerDateLimiteDepot, calculerDateLimiteRemboursement,
  MODALITES, TYPES_ACTION, TYPES_CERTIFICATION, MODALITES_EVALUATION,
  TYPES_FINANCEMENT, MODES_REGLEMENT,
} from "@/lib/utils";

/* ─── Interfaces ─────────────────────────────────────────────────────────── */
interface Client {
  id: string; nom: string; prenom: string; siret: string;
  statutJuridique: string; email: string; civilite?: string | null;
  nomCommercial?: string | null;
}

interface Formation {
  id: string; reference: string; intitule: string; dureeHeures: number;
  tarifInterHT: number; tarifIntraHT: number; plafondAGEFICE?: number | null;
  modalite: string; eligibleCPF: boolean; certifiant: boolean;
  objectifs?: string | null; nomFormateur?: string | null;
  dureePresIndividuel?: number | null; dureePresCollectif?: number | null;
  dureeDistSynchrone?: number | null; dureeDistAsynchrone?: number | null;
}

interface SessionJour {
  id: string; date: string; heureDebut: string; heureFin: string; lieu: string;
}

interface ObjEval { texte: string; score: string; commentaire: string; }

/* ─── Constantes ─────────────────────────────────────────────────────────── */
const NOTATION_GLOBALE = {
  favorable:    { label: "Favorable",       color: "bg-green-100 text-green-700"  },
  a_ameliorer:  { label: "À améliorer",     color: "bg-orange-100 text-orange-700" },
  insuffisant:  { label: "Insuffisant",     color: "bg-red-100 text-red-700"      },
};
const SCORE_OPTIONS = [
  { v: "",  label: "—"                    },
  { v: "0", label: "Non atteint"          },
  { v: "1", label: "Partiellement atteint" },
  { v: "2", label: "Atteint"              },
];

const STEPS = [
  { num: 1, label: "Client",       icon: "user"      },
  { num: 2, label: "Formation",    icon: "book"      },
  { num: 3, label: "Financement",  icon: "credit"    },
  { num: 4, label: "Qualiopi",     icon: "check"     },
  { num: 5, label: "Sessions",     icon: "calendar"  },
  { num: 6, label: "Évaluation",   icon: "star"      },
];

function uid() { return Math.random().toString(36).slice(2); }

function heuresEntre(debut: string, fin: string): number {
  if (!debut || !fin) return 0;
  const [dh, dm] = debut.split(":").map(Number);
  const [fh, fm] = fin.split(":").map(Number);
  return Math.max(0, (fh * 60 + fm - dh * 60 - dm) / 60);
}

/* ─── Composant stepper ─────────────────────────────────────────────────── */
function Stepper({ step, max }: { step: number; max: number }) {
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((s, i) => (
        <div key={s.num} className="flex items-center flex-1 min-w-0">
          <div className="flex flex-col items-center flex-shrink-0">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              step > s.num ? "bg-green-500 text-white" :
              step === s.num ? "bg-[#1F4E79] text-white ring-2 ring-offset-2 ring-blue-300" :
              "bg-gray-100 text-gray-400"
            }`}>
              {step > s.num ? <Check className="w-3.5 h-3.5" /> : s.num}
            </div>
            <span className={`mt-1 text-xs text-center leading-tight hidden sm:block ${
              step === s.num ? "text-gray-900 font-semibold" : "text-gray-400"
            }`}>{s.label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`flex-1 h-px mx-1 mb-4 sm:mb-5 ${step > s.num ? "bg-green-400" : "bg-gray-200"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── Summary bar ────────────────────────────────────────────────────────── */
function SummaryBar({ client, formation, step }: { client: Client | null; formation: Formation | null; step: number }) {
  if (!client && !formation) return null;
  return (
    <div className="bg-blue-50 rounded-xl border border-blue-100 px-4 py-3 flex flex-wrap gap-4 text-sm">
      {client && (
        <div>
          <span className="text-xs text-blue-500 font-medium uppercase tracking-wide block">Client</span>
          <span className="font-semibold text-blue-900">{client.prenom} {client.nom}</span>
          <span className="text-blue-600 ml-1 text-xs">{client.siret}</span>
        </div>
      )}
      {formation && step >= 3 && (
        <div>
          <span className="text-xs text-blue-500 font-medium uppercase tracking-wide block">Formation</span>
          <span className="font-semibold text-blue-900">{formation.intitule}</span>
          <span className="text-blue-600 ml-1 text-xs">{formation.reference} · {formation.dureeHeures}h</span>
        </div>
      )}
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────── */
function NouveauDossierContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedClientId = searchParams.get("clientId");

  const [step, setStep] = useState(1);
  const [clients, setClients] = useState<Client[]>([]);
  const [formations, setFormations] = useState<Formation[]>([]);
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedFormation, setSelectedFormation] = useState<Formation | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  /* Inline client creation */
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClient, setNewClient] = useState({
    civilite: "M.", nom: "", prenom: "", siret: "", statutJuridique: "EI",
    email: "", telephone: "", codeApe: "7490B",
  });
  const [creatingClient, setCreatingClient] = useState(false);

  /* Step 3 — Financement */
  const [fin, setFin] = useState({
    typeFinancement: "agefice",
    nomFinanceur: "",
    montantPriseEnCharge: "",
    remisePourcent: "",
    remiseMontant: "",
  });

  /* Step 4 — Administratif */
  const [admin, setAdmin] = useState({
    dateDebut: "", dateFin: "", modalite: "presentiel",
    montantHT: "", tauxTVA: "0",
    typeAction: "formation", nomFormateur: "", nombreParticipants: "1",
    lieuFormationAdresse: "", lieuFormationCodePostal: "", lieuFormationVille: "",
    dureePresIndividuel: "", dureePresCollectif: "",
    dureeDistSynchrone: "", dureeDistAsynchrone: "",
    modalitesDeroulement: "", modalitesEvaluation: [] as string[],
    typeCertification: "attestation",
    formationObligatoire: false, reconversion: false, formationEnEntreprise: false,
    notes: "",
  });

  /* Step 5 — Sessions */
  const [sessions, setSessions] = useState<SessionJour[]>([]);

  /* Step 6 — Évaluation */
  const [evalState, setEvalState] = useState({
    objectifs: [] as ObjEval[],
    notationGlobale: "",
    commentaireGlobal: "",
    dureePresIndividuelRealisee: "",
    dureePresCollectifRealisee: "",
    dureeDistSynchroneRealisee: "",
    dureeDistAsynchroneRealisee: "",
    modeReglement: "",
    dateReglement: "",
  });

  /* Load data */
  useEffect(() => {
    fetch("/api/clients").then(r => r.json()).then((data: Client[]) => {
      setClients(data);
      if (preselectedClientId) {
        const found = data.find(c => c.id === preselectedClientId);
        if (found) { setSelectedClient(found); setStep(2); }
      }
    });
    fetch("/api/formations?actif=true").then(r => r.json()).then(setFormations);
  }, [preselectedClientId]);

  /* Pre-fill admin when formation selected */
  useEffect(() => {
    if (selectedFormation) {
      setAdmin(p => ({
        ...p,
        montantHT: String(selectedFormation.tarifInterHT),
        modalite: selectedFormation.modalite,
        nomFormateur: selectedFormation.nomFormateur || "",
        dureePresIndividuel: selectedFormation.dureePresIndividuel != null ? String(selectedFormation.dureePresIndividuel) : "",
        dureePresCollectif:  selectedFormation.dureePresCollectif  != null ? String(selectedFormation.dureePresCollectif)  : "",
        dureeDistSynchrone:  selectedFormation.dureeDistSynchrone  != null ? String(selectedFormation.dureeDistSynchrone)  : "",
        dureeDistAsynchrone: selectedFormation.dureeDistAsynchrone != null ? String(selectedFormation.dureeDistAsynchrone) : "",
        typeCertification: selectedFormation.certifiant ? "rncp" : "attestation",
      }));
      /* Pre-fill evaluation objectifs */
      const objs = selectedFormation.objectifs
        ? selectedFormation.objectifs.split(/\n|;/).map(l => l.replace(/^[-•*]\s*/, "").trim()).filter(l => l.length > 3)
        : [];
      setEvalState(p => ({
        ...p,
        objectifs: objs.map(texte => ({ texte, score: "", commentaire: "" })),
        dureePresIndividuelRealisee: selectedFormation.dureePresIndividuel != null ? String(selectedFormation.dureePresIndividuel) : "",
        dureePresCollectifRealisee:  selectedFormation.dureePresCollectif  != null ? String(selectedFormation.dureePresCollectif)  : "",
        dureeDistSynchroneRealisee:  selectedFormation.dureeDistSynchrone  != null ? String(selectedFormation.dureeDistSynchrone)  : "",
        dureeDistAsynchroneRealisee: selectedFormation.dureeDistAsynchrone != null ? String(selectedFormation.dureeDistAsynchrone) : "",
      }));
      /* Pre-fill financement */
      if (selectedFormation.plafondAGEFICE) {
        setFin(p => ({ ...p, montantPriseEnCharge: String(Math.min(selectedFormation.tarifInterHT, selectedFormation.plafondAGEFICE!)) }));
      }
    }
  }, [selectedFormation]);

  /* Derived */
  const montantHT = Number(admin.montantHT) || 0;
  const remiseMt = fin.remisePourcent ? montantHT * Number(fin.remisePourcent) / 100 : (Number(fin.remiseMontant) || 0);
  const montantHTNet = montantHT - remiseMt;
  const montantTTC = montantHTNet * (1 + Number(admin.tauxTVA) / 100);
  const montantPC = Number(fin.montantPriseEnCharge) || 0;
  const resteCharge = Math.max(0, montantTTC - montantPC);

  const dateLimiteDepot = admin.dateDebut ? calculerDateLimiteDepot(new Date(admin.dateDebut)) : null;
  const dateLimiteRemboursement = admin.dateFin ? calculerDateLimiteRemboursement(new Date(admin.dateFin)) : null;
  const joursAvantDebut = admin.dateDebut ? joursRestants(new Date(admin.dateDebut)) : null;

  const totalHeuresSessions = sessions.reduce((acc, s) => acc + heuresEntre(s.heureDebut, s.heureFin), 0);

  const filteredClients = clients.filter(c => {
    const q = clientSearch.toLowerCase();
    return c.nom.toLowerCase().includes(q) || c.prenom.toLowerCase().includes(q) || c.siret.includes(q);
  });

  /* Create client inline */
  async function handleCreateClient(e: React.FormEvent) {
    e.preventDefault();
    if (!newClient.nom || !newClient.prenom || !newClient.siret || !newClient.email) return;
    setCreatingClient(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newClient, nombreParticipants: 1 }),
      });
      if (res.ok) {
        const created: Client = await res.json();
        setClients(p => [created, ...p]);
        setSelectedClient(created);
        setShowNewClient(false);
        setStep(2);
      } else {
        const err = await res.json();
        setError(err.error ?? "Erreur création client");
      }
    } catch { setError("Erreur réseau"); }
    finally { setCreatingClient(false); }
  }

  /* Add session */
  function addSession() {
    setSessions(p => [...p, { id: uid(), date: "", heureDebut: "09:00", heureFin: "12:00", lieu: "" }]);
  }
  function removeSession(id: string) { setSessions(p => p.filter(s => s.id !== id)); }
  function updateSession(id: string, field: keyof SessionJour, value: string) {
    setSessions(p => p.map(s => s.id === id ? { ...s, [field]: value } : s));
  }

  /* Submit */
  async function handleSubmit(skipEval = false) {
    if (!selectedClient || !selectedFormation) return;
    setError("");
    setSubmitting(true);

    const remiseMontantFinal = fin.remisePourcent
      ? montantHT * Number(fin.remisePourcent) / 100
      : (Number(fin.remiseMontant) || null);

    const evalNotes = !skipEval && evalState.objectifs.length > 0
      ? evalState.objectifs.filter(o => o.score !== "")
      : null;

    try {
      const res = await fetch("/api/dossiers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: selectedClient.id,
          formationId: selectedFormation.id,
          // Step 4
          dateDebut: admin.dateDebut,
          dateFin: admin.dateFin,
          montantHT: montantHT,
          tauxTVA: Number(admin.tauxTVA),
          modalite: admin.modalite,
          typeAction: admin.typeAction,
          formationObligatoire: admin.formationObligatoire,
          reconversion: admin.reconversion,
          formationEnEntreprise: admin.formationEnEntreprise,
          nomFormateur: admin.nomFormateur || undefined,
          nombreParticipants: Number(admin.nombreParticipants) || 1,
          lieuFormationAdresse: admin.lieuFormationAdresse || undefined,
          lieuFormationCodePostal: admin.lieuFormationCodePostal || undefined,
          lieuFormationVille: admin.lieuFormationVille || undefined,
          dureePresIndividuel: admin.dureePresIndividuel ? Number(admin.dureePresIndividuel) : undefined,
          dureePresCollectif:  admin.dureePresCollectif  ? Number(admin.dureePresCollectif)  : undefined,
          dureeDistSynchrone:  admin.dureeDistSynchrone  ? Number(admin.dureeDistSynchrone)  : undefined,
          dureeDistAsynchrone: admin.dureeDistAsynchrone ? Number(admin.dureeDistAsynchrone) : undefined,
          modalitesDeroulement: admin.modalitesDeroulement || undefined,
          modalitesEvaluation: admin.modalitesEvaluation.length > 0 ? JSON.stringify(admin.modalitesEvaluation) : undefined,
          typeCertification: admin.typeCertification || undefined,
          notes: admin.notes || undefined,
          // Step 3 — Financement
          typeFinancement: fin.typeFinancement || undefined,
          nomFinanceur: fin.nomFinanceur || undefined,
          montantPriseEnCharge: montantPC || undefined,
          remisePourcent: fin.remisePourcent ? Number(fin.remisePourcent) : undefined,
          remiseMontant: remiseMontantFinal || undefined,
          // Step 5 — Sessions
          joursSession: sessions.filter(s => s.date).length > 0 ? sessions.filter(s => s.date) : undefined,
          // Step 6 — Evaluation
          evaluationNotes: evalNotes || undefined,
          notationGlobale: !skipEval ? (evalState.notationGlobale || undefined) : undefined,
          dureePresIndividuelRealisee: !skipEval && evalState.dureePresIndividuelRealisee ? Number(evalState.dureePresIndividuelRealisee) : undefined,
          dureePresCollectifRealisee:  !skipEval && evalState.dureePresCollectifRealisee  ? Number(evalState.dureePresCollectifRealisee)  : undefined,
          dureeDistSynchroneRealisee:  !skipEval && evalState.dureeDistSynchroneRealisee  ? Number(evalState.dureeDistSynchroneRealisee)  : undefined,
          dureeDistAsynchroneRealisee: !skipEval && evalState.dureeDistAsynchroneRealisee ? Number(evalState.dureeDistAsynchroneRealisee) : undefined,
          modeReglement: !skipEval ? (evalState.modeReglement || undefined) : undefined,
          dateReglement: !skipEval ? (evalState.dateReglement || undefined) : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Erreur lors de la création du dossier");
        return;
      }
      const dossier = await res.json();
      router.push(`/dossiers/${dossier.id}`);
    } catch {
      setError("Erreur réseau, veuillez réessayer");
    } finally {
      setSubmitting(false);
    }
  }

  const inp = "w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
  const inp_sm = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  const lbl = "block text-sm font-medium text-gray-700 mb-1";
  const lbl_xs = "block text-xs font-medium text-gray-600 mb-1";

  const canAdvance4 = admin.dateDebut && admin.dateFin && admin.montantHT && admin.modalite;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dossiers" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nouveau dossier</h1>
          <p className="text-sm text-gray-500 mt-0.5">Création guidée en 6 étapes</p>
        </div>
      </div>

      {/* Stepper */}
      <Stepper step={step} max={6} />

      {/* Summary bar */}
      <SummaryBar client={selectedClient} formation={selectedFormation} step={step} />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* ── STEP 1 : CLIENT ──────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <User className="w-5 h-5 text-[#1F4E79]" /> Sélectionner ou créer un client
            </h2>
            <button
              onClick={() => setShowNewClient(!showNewClient)}
              className="inline-flex items-center gap-1.5 text-sm text-[#1F4E79] hover:bg-blue-50 px-3 py-1.5 rounded-lg font-medium transition-colors border border-[#1F4E79]/20"
            >
              <Plus className="w-4 h-4" />
              {showNewClient ? "Annuler" : "Nouveau client"}
            </button>
          </div>

          {showNewClient ? (
            <form onSubmit={handleCreateClient} className="border border-blue-100 bg-blue-50/30 rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold text-[#1F4E79] mb-2">Création rapide d&apos;un client</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={lbl}>Civilité</label>
                  <select value={newClient.civilite} onChange={e => setNewClient(p => ({...p, civilite: e.target.value}))} className={inp}>
                    <option value="M.">M.</option>
                    <option value="Mme">Mme</option>
                  </select>
                </div>
                <div>
                  <label className={lbl}>Prénom <span className="text-red-500">*</span></label>
                  <input required value={newClient.prenom} onChange={e => setNewClient(p => ({...p, prenom: e.target.value}))} className={inp} />
                </div>
                <div>
                  <label className={lbl}>Nom <span className="text-red-500">*</span></label>
                  <input required value={newClient.nom} onChange={e => setNewClient(p => ({...p, nom: e.target.value}))} className={inp} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>SIRET <span className="text-red-500">*</span></label>
                  <input required maxLength={14} value={newClient.siret} onChange={e => setNewClient(p => ({...p, siret: e.target.value}))} className={inp} placeholder="14 chiffres" />
                </div>
                <div>
                  <label className={lbl}>Forme juridique</label>
                  <select value={newClient.statutJuridique} onChange={e => setNewClient(p => ({...p, statutJuridique: e.target.value}))} className={inp}>
                    {["EI","EIRL","EURL","SARL","SAS","SASU","SA","SNC","Auto-entrepreneur","Profession libérale","Autre"].map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Email <span className="text-red-500">*</span></label>
                  <input required type="email" value={newClient.email} onChange={e => setNewClient(p => ({...p, email: e.target.value}))} className={inp} />
                </div>
                <div>
                  <label className={lbl}>Téléphone</label>
                  <input value={newClient.telephone} onChange={e => setNewClient(p => ({...p, telephone: e.target.value}))} className={inp} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setShowNewClient(false)} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5">Annuler</button>
                <button type="submit" disabled={creatingClient} className="inline-flex items-center gap-2 bg-[#1F4E79] hover:bg-[#163a5a] disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg">
                  {creatingClient ? "Création..." : "Créer et sélectionner"}
                </button>
              </div>
            </form>
          ) : (
            <>
              <input
                type="text"
                placeholder="Rechercher par nom, prénom ou SIRET..."
                value={clientSearch}
                onChange={e => setClientSearch(e.target.value)}
                className={inp}
              />
              <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 border border-gray-200 rounded-lg">
                {filteredClients.length === 0 ? (
                  <p className="px-4 py-8 text-center text-gray-400 text-sm">Aucun client trouvé</p>
                ) : filteredClients.map(c => (
                  <button key={c.id} type="button"
                    onClick={() => { setSelectedClient(c); setStep(2); }}
                    className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{c.civilite} {c.prenom} {c.nom}</p>
                      <p className="text-xs text-gray-500">{c.statutJuridique} · SIRET {c.siret} · {c.email}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300" />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── STEP 2 : FORMATION ───────────────────────────────────────────── */}
      {step === 2 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#1F4E79]" /> Sélectionner la formation
          </h2>
          {formations.length === 0 ? (
            <div className="py-10 text-center">
              <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Aucune formation active disponible</p>
              <Link href="/formations/nouveau" className="mt-3 inline-block text-sm text-blue-600 hover:underline">Créer une formation</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
              {formations.map(f => (
                <button key={f.id} type="button"
                  onClick={() => { setSelectedFormation(f); setStep(3); }}
                  className="text-left p-4 border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 rounded-xl transition-all"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-xs font-mono font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{f.reference}</span>
                    <div className="flex gap-1">
                      {f.eligibleCPF && <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">CPF</span>}
                      {f.certifiant && <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-medium">Certifiant</span>}
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 leading-snug">{f.intitule}</p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {f.dureeHeures}h</span>
                    <span>{formatMontant(f.tarifInterHT)} HT</span>
                  </div>
                  {f.plafondAGEFICE != null && (
                    <p className="mt-1 text-xs text-orange-600 font-medium">Plafond AGEFICE : {formatMontant(f.plafondAGEFICE)}</p>
                  )}
                </button>
              ))}
            </div>
          )}
          <button onClick={() => setStep(1)} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 pt-2">
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>
        </div>
      )}

      {/* ── STEP 3 : FINANCEMENT ─────────────────────────────────────────── */}
      {step === 3 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#1F4E79]" /> Financement &amp; Remise
          </h2>

          {/* Type financement */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Type de financement</label>
              <select value={fin.typeFinancement} onChange={e => setFin(p => ({...p, typeFinancement: e.target.value}))} className={inp}>
                <option value="">— Non défini —</option>
                {Object.entries(TYPES_FINANCEMENT).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            {fin.typeFinancement && fin.typeFinancement !== "agefice" && fin.typeFinancement !== "autofinancement" && (
              <div>
                <label className={lbl}>Nom du financeur</label>
                <input value={fin.nomFinanceur} onChange={e => setFin(p => ({...p, nomFinanceur: e.target.value}))} className={inp} placeholder="Ex : OPCO EP, AFDAS, Région Réunion…" />
              </div>
            )}
          </div>

          {/* Remise */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">Remise commerciale <span className="text-xs text-gray-400 font-normal">(optionnel)</span></p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Remise en %</label>
                <div className="relative">
                  <input type="number" min={0} max={100} step={0.5} value={fin.remisePourcent}
                    onChange={e => setFin(p => ({...p, remisePourcent: e.target.value, remiseMontant: ""}))}
                    className={inp} placeholder="0" />
                  <span className="absolute right-3 top-2.5 text-sm text-gray-400">%</span>
                </div>
              </div>
              <div>
                <label className={lbl}>Remise en €</label>
                <div className="relative">
                  <input type="number" min={0} step={0.01} value={fin.remiseMontant}
                    onChange={e => setFin(p => ({...p, remiseMontant: e.target.value, remisePourcent: ""}))}
                    className={inp} placeholder="0.00" />
                  <span className="absolute right-3 top-2.5 text-sm text-gray-400">€</span>
                </div>
              </div>
            </div>
          </div>

          {/* Montant prise en charge */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">Prise en charge</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Montant pris en charge (€)</label>
                <input type="number" min={0} step={0.01} value={fin.montantPriseEnCharge}
                  onChange={e => setFin(p => ({...p, montantPriseEnCharge: e.target.value}))}
                  className={inp} placeholder="0.00" />
              </div>
            </div>
          </div>

          {/* Récap financier */}
          {selectedFormation && (
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-2 text-sm">
              <p className="font-semibold text-gray-700 mb-2">Récapitulatif financier</p>
              <div className="flex justify-between"><span className="text-gray-500">Tarif HT brut</span><span className="font-medium">{formatMontant(montantHT)}</span></div>
              {remiseMt > 0 && <div className="flex justify-between text-red-600"><span>Remise{fin.remisePourcent ? ` (${fin.remisePourcent}%)` : ""}</span><span>− {formatMontant(remiseMt)}</span></div>}
              <div className="flex justify-between border-t border-gray-200 pt-2"><span className="text-gray-500">Montant HT net</span><span className="font-semibold">{formatMontant(montantHTNet)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Montant TTC</span><span className="font-semibold">{formatMontant(montantTTC)}</span></div>
              {montantPC > 0 && <>
                <div className="flex justify-between text-green-700 border-t border-gray-200 pt-2"><span>Prise en charge ({fin.typeFinancement ? (TYPES_FINANCEMENT as Record<string, string>)[fin.typeFinancement] || fin.nomFinanceur : "—"})</span><span className="font-semibold">{formatMontant(montantPC)}</span></div>
                <div className="flex justify-between font-bold text-base"><span>Reste à charge</span><span className={resteCharge === 0 ? "text-green-600" : "text-gray-900"}>{formatMontant(resteCharge)}</span></div>
              </>}
              {selectedFormation.plafondAGEFICE && (
                <p className="text-xs text-orange-600 border-t border-gray-200 pt-2">Plafond AGEFICE : {formatMontant(selectedFormation.plafondAGEFICE)}</p>
              )}
            </div>
          )}

          <div className="flex justify-between pt-2">
            <button onClick={() => setStep(2)} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Retour</button>
            <button onClick={() => setStep(4)} className="inline-flex items-center gap-2 bg-[#1F4E79] hover:bg-[#163a5a] text-white text-sm font-medium px-5 py-2.5 rounded-lg">
              Suivant <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 4 : ADMINISTRATIF QUALIOPI ──────────────────────────────── */}
      {step === 4 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-[#1F4E79]" /> Informations administratives &amp; Qualiopi
          </h2>

          {/* Dates & Montant */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">Calendrier &amp; Tarif</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Date de début <span className="text-red-500">*</span></label>
                <input type="date" required value={admin.dateDebut} onChange={e => setAdmin(p => ({...p, dateDebut: e.target.value}))} className={inp} />
              </div>
              <div>
                <label className={lbl}>Date de fin <span className="text-red-500">*</span></label>
                <input type="date" required value={admin.dateFin} onChange={e => setAdmin(p => ({...p, dateFin: e.target.value}))} min={admin.dateDebut} className={inp} />
              </div>
              <div>
                <label className={lbl}>Montant HT net (€) <span className="text-red-500">*</span></label>
                <input type="number" required min={0} step={0.01} value={admin.montantHT}
                  onChange={e => setAdmin(p => ({...p, montantHT: e.target.value}))} className={inp} />
                {remiseMt > 0 && <p className="mt-1 text-xs text-gray-400">Remise appliquée : − {formatMontant(remiseMt)}</p>}
              </div>
              <div>
                <label className={lbl}>TVA (%)</label>
                <input type="number" value={admin.tauxTVA} disabled className={`${inp} bg-gray-50 text-gray-400 cursor-not-allowed`} />
                <p className="mt-1 text-xs text-gray-400">Exonération Art. 261.4.4° CGI</p>
              </div>
            </div>

            {/* Délais AGEFICE */}
            {(dateLimiteDepot || dateLimiteRemboursement) && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Montant TTC</p>
                  <p className="text-base font-bold text-gray-900 mt-0.5">{formatMontant(montantTTC)}</p>
                </div>
                {dateLimiteDepot && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Limite de dépôt AGEFICE</p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">{formatDate(dateLimiteDepot)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">15 jours avant début</p>
                  </div>
                )}
                {dateLimiteRemboursement && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Limite remboursement</p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">{formatDate(dateLimiteRemboursement)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">4 mois après fin</p>
                  </div>
                )}
              </div>
            )}

            {joursAvantDebut !== null && joursAvantDebut < 15 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-start gap-2 mt-3">
                <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-orange-700">
                  {joursAvantDebut <= 0 ? "La formation a déjà commencé" : `Commence dans ${joursAvantDebut} jour${joursAvantDebut > 1 ? "s" : ""}`} — dépôt AGEFICE ≥ 15 jours avant le début requis.
                </p>
              </div>
            )}
          </div>

          {/* Type action & Modalité */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">Nature de l&apos;action</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={lbl}>Type d&apos;action <span className="text-red-500">*</span></label>
                <select value={admin.typeAction} onChange={e => setAdmin(p => ({...p, typeAction: e.target.value}))} className={inp}>
                  {Object.entries(TYPES_ACTION).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Modalité <span className="text-red-500">*</span></label>
                <select required value={admin.modalite} onChange={e => setAdmin(p => ({...p, modalite: e.target.value}))} className={inp}>
                  {Object.entries(MODALITES).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Certification</label>
                <select value={admin.typeCertification} onChange={e => setAdmin(p => ({...p, typeCertification: e.target.value}))} className={inp}>
                  <option value="">— Aucune —</option>
                  {Object.entries(TYPES_CERTIFICATION).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Nb participants</label>
                <input type="number" min={1} value={admin.nombreParticipants} onChange={e => setAdmin(p => ({...p, nombreParticipants: e.target.value}))} className={inp} />
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-4">
              {[{key:"formationObligatoire",label:"Formation obligatoire"},{key:"reconversion",label:"Reconversion"},{key:"formationEnEntreprise",label:"En entreprise"}].map(({key,label}) => (
                <label key={key} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="checkbox" checked={admin[key as keyof typeof admin] as boolean}
                    onChange={e => setAdmin(p => ({...p, [key]: e.target.checked}))} className="rounded border-gray-300 text-blue-600" />
                  {label}
                </label>
              ))}
            </div>
          </div>

          {/* Formateur & Lieu */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">Formateur &amp; Lieu</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={lbl}>Nom du formateur</label>
                <input value={admin.nomFormateur} onChange={e => setAdmin(p => ({...p, nomFormateur: e.target.value}))} className={inp} placeholder="Prénom NOM" />
              </div>
              <div className="sm:col-span-2">
                <label className={lbl}>Adresse du lieu de formation</label>
                <input value={admin.lieuFormationAdresse} onChange={e => setAdmin(p => ({...p, lieuFormationAdresse: e.target.value}))} className={inp} placeholder="12 rue de la République" />
              </div>
              <div>
                <label className={lbl}>Code postal</label>
                <input maxLength={5} value={admin.lieuFormationCodePostal} onChange={e => setAdmin(p => ({...p, lieuFormationCodePostal: e.target.value}))} className={inp} placeholder="97400" />
              </div>
              <div>
                <label className={lbl}>Ville</label>
                <input value={admin.lieuFormationVille} onChange={e => setAdmin(p => ({...p, lieuFormationVille: e.target.value}))} className={inp} placeholder="Saint-Denis" />
              </div>
            </div>
          </div>

          {/* Durées */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-sm font-semibold text-gray-700 mb-1">Durées prévues par type (heures)</p>
            <p className="text-xs text-gray-400 mb-3">Laisser vide si non applicable</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[{key:"dureePresIndividuel",label:"Présentiel individuel"},{key:"dureePresCollectif",label:"Présentiel collectif"},{key:"dureeDistSynchrone",label:"Dist. synchrone"},{key:"dureeDistAsynchrone",label:"Dist. asynchrone"}].map(({key,label}) => (
                <div key={key}>
                  <label className={lbl_xs}>{label}</label>
                  <input type="number" min={0} step={0.5} value={admin[key as keyof typeof admin] as string}
                    onChange={e => setAdmin(p => ({...p, [key]: e.target.value}))} className={inp_sm} placeholder="0" />
                </div>
              ))}
            </div>
          </div>

          {/* Modalités pédagogiques */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">Modalités pédagogiques</p>
            <div className="space-y-3">
              <div>
                <label className={lbl}>Modalités de déroulement</label>
                <textarea rows={2} value={admin.modalitesDeroulement}
                  onChange={e => setAdmin(p => ({...p, modalitesDeroulement: e.target.value}))}
                  placeholder="Exposés interactifs, ateliers pratiques…" className={inp} />
              </div>
              <div>
                <label className={lbl}>Modalités d&apos;évaluation</label>
                <div className="flex flex-wrap gap-3 mt-1">
                  {Object.entries(MODALITES_EVALUATION).map(([k,v]) => (
                    <label key={k} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input type="checkbox" checked={admin.modalitesEvaluation.includes(k)}
                        onChange={e => setAdmin(p => ({...p, modalitesEvaluation: e.target.checked ? [...p.modalitesEvaluation,k] : p.modalitesEvaluation.filter(x => x !== k)}))}
                        className="rounded border-gray-300 text-blue-600" />
                      {v}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className={lbl}>Notes internes</label>
                <textarea rows={2} value={admin.notes} onChange={e => setAdmin(p => ({...p, notes: e.target.value}))} placeholder="Informations complémentaires…" className={inp} />
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <button onClick={() => setStep(3)} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Retour</button>
            <button onClick={() => setStep(5)} disabled={!canAdvance4}
              className="inline-flex items-center gap-2 bg-[#1F4E79] hover:bg-[#163a5a] disabled:opacity-50 text-white text-sm font-medium px-5 py-2.5 rounded-lg">
              Suivant <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 5 : JOURS DE SESSION ─────────────────────────────────────── */}
      {step === 5 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#1F4E79]" /> Jours &amp; Créneaux de session
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">Planifiez les créneaux horaires de la formation. Ces données alimentent la feuille d&apos;émargement.</p>
            </div>
            <button onClick={addSession}
              className="inline-flex items-center gap-1.5 bg-[#1F4E79] hover:bg-[#163a5a] text-white text-xs font-medium px-3 py-1.5 rounded-lg">
              <Plus className="w-3.5 h-3.5" /> Ajouter un créneau
            </button>
          </div>

          {sessions.length === 0 ? (
            <div className="border-2 border-dashed border-gray-200 rounded-xl py-10 text-center">
              <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Aucun créneau défini</p>
              <p className="text-gray-300 text-xs mt-1">Optionnel — la feuille d&apos;émargement peut être générée depuis les dates de début/fin</p>
              <button onClick={addSession} className="mt-3 text-sm text-blue-600 hover:underline">+ Ajouter le premier créneau</button>
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.map((s, i) => (
                <div key={s.id} className="grid grid-cols-12 gap-2 items-center bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                  <div className="col-span-1 text-xs text-gray-400 font-medium text-center">{i+1}</div>
                  <div className="col-span-3">
                    <label className={lbl_xs}>Date</label>
                    <input type="date" value={s.date} onChange={e => updateSession(s.id, "date", e.target.value)} className={inp_sm} />
                  </div>
                  <div className="col-span-2">
                    <label className={lbl_xs}>Début</label>
                    <input type="time" value={s.heureDebut} onChange={e => updateSession(s.id, "heureDebut", e.target.value)} className={inp_sm} />
                  </div>
                  <div className="col-span-2">
                    <label className={lbl_xs}>Fin</label>
                    <input type="time" value={s.heureFin} onChange={e => updateSession(s.id, "heureFin", e.target.value)} className={inp_sm} />
                  </div>
                  <div className="col-span-3">
                    <label className={lbl_xs}>Lieu <span className="text-gray-300">(optionnel)</span></label>
                    <input value={s.lieu} onChange={e => updateSession(s.id, "lieu", e.target.value)} className={inp_sm} placeholder="Saint-Denis" />
                  </div>
                  <div className="col-span-1 flex items-end justify-center pb-0.5">
                    <button onClick={() => removeSession(s.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2 px-1">
                <button onClick={addSession} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                  <Plus className="w-4 h-4" /> Ajouter un créneau
                </button>
                <div className="text-sm text-gray-600">
                  Total : <strong className={totalHeuresSessions > 0 && selectedFormation && Math.abs(totalHeuresSessions - selectedFormation.dureeHeures) > 0.5 ? "text-orange-600" : "text-green-600"}>
                    {totalHeuresSessions.toFixed(1)}h
                  </strong>
                  {selectedFormation && <span className="text-gray-400"> / {selectedFormation.dureeHeures}h prévues</span>}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-2">
            <button onClick={() => setStep(4)} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Retour</button>
            <button onClick={() => setStep(6)} className="inline-flex items-center gap-2 bg-[#1F4E79] hover:bg-[#163a5a] text-white text-sm font-medium px-5 py-2.5 rounded-lg">
              Suivant <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 6 : ÉVALUATION & NOTATION ───────────────────────────────── */}
      {step === 6 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Star className="w-5 h-5 text-[#1F4E79]" /> Évaluation &amp; Notation post-formation
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">Optionnel — à compléter si la formation est déjà terminée ou en cours.</p>
            </div>
          </div>

          {/* Évaluation des acquis */}
          {evalState.objectifs.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">Évaluation des objectifs pédagogiques</p>
              <div className="space-y-2">
                {evalState.objectifs.map((obj, i) => (
                  <div key={i} className="flex items-start gap-3 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                    <span className="text-xs text-gray-400 font-medium mt-1 w-5 flex-shrink-0">{i+1}.</span>
                    <p className="text-sm text-gray-700 flex-1">{obj.texte}</p>
                    <select
                      value={obj.score}
                      onChange={e => setEvalState(p => ({...p, objectifs: p.objectifs.map((o,j) => j===i ? {...o, score: e.target.value} : o)}))}
                      className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 flex-shrink-0"
                    >
                      {SCORE_OPTIONS.map(o => <option key={o.v} value={o.v}>{o.label}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Durées réalisées */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">Durées réalisées (heures) <span className="text-xs text-gray-400 font-normal">— pour l&apos;attestation d&apos;assiduité</span></p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {key:"dureePresIndividuelRealisee", label:"Présentiel indiv.", prev: admin.dureePresIndividuel},
                {key:"dureePresCollectifRealisee",  label:"Présentiel collect.", prev: admin.dureePresCollectif},
                {key:"dureeDistSynchroneRealisee",  label:"Dist. synchrone", prev: admin.dureeDistSynchrone},
                {key:"dureeDistAsynchroneRealisee", label:"Dist. asynchrone", prev: admin.dureeDistAsynchrone},
              ].map(({key,label,prev}) => (
                <div key={key}>
                  <label className={lbl_xs}>{label}{prev ? <span className="ml-1 text-gray-400">(prévu: {prev}h)</span> : ""}</label>
                  <input type="number" min={0} step={0.5} value={evalState[key as keyof typeof evalState] as string}
                    onChange={e => setEvalState(p => ({...p, [key]: e.target.value}))} className={inp_sm} placeholder="0" />
                </div>
              ))}
            </div>
          </div>

          {/* Notation globale */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">Résultat global</p>
            <div className="flex flex-wrap gap-3 mb-3">
              {Object.entries(NOTATION_GLOBALE).map(([k,v]) => (
                <button key={k} type="button"
                  onClick={() => setEvalState(p => ({...p, notationGlobale: p.notationGlobale === k ? "" : k}))}
                  className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-all ${
                    evalState.notationGlobale === k ? `${v.color} border-current` : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}>
                  {v.label}
                </button>
              ))}
            </div>
            <div>
              <label className={lbl}>Commentaire global</label>
              <textarea rows={2} value={evalState.commentaireGlobal}
                onChange={e => setEvalState(p => ({...p, commentaireGlobal: e.target.value}))}
                placeholder="Points forts, axes d'amélioration, recommandations…" className={inp} />
            </div>
          </div>

          {/* Règlement */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">Règlement <span className="text-xs text-gray-400 font-normal">— si facture acquittée déjà reçue</span></p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={lbl}>Mode de règlement</label>
                <select value={evalState.modeReglement} onChange={e => setEvalState(p => ({...p, modeReglement: e.target.value}))} className={inp}>
                  <option value="">— Sélectionner —</option>
                  {Object.entries(MODES_REGLEMENT).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Date de règlement</label>
                <input type="date" value={evalState.dateReglement} onChange={e => setEvalState(p => ({...p, dateReglement: e.target.value}))} className={inp} />
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <button onClick={() => setStep(5)} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Retour</button>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => handleSubmit(true)} disabled={submitting || !canAdvance4}
                className="inline-flex items-center gap-1.5 border border-gray-300 hover:bg-gray-50 text-gray-600 text-sm font-medium px-4 py-2.5 rounded-lg disabled:opacity-50">
                <SkipForward className="w-4 h-4" /> Créer sans évaluation
              </button>
              <button type="button" onClick={() => handleSubmit(false)} disabled={submitting || !canAdvance4}
                className="inline-flex items-center gap-2 bg-[#E4620D] hover:bg-[#c7530b] disabled:opacity-60 text-white text-sm font-medium px-5 py-2.5 rounded-lg">
                {submitting ? "Création…" : "Créer le dossier"}
                {!submitting && <Check className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NouveauDossierPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><p className="text-gray-400 text-sm">Chargement…</p></div>}>
      <NouveauDossierContent />
    </Suspense>
  );
}
