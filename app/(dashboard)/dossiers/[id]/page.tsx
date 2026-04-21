"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  X,
  Check,
  FileText,
  AlertTriangle,
  ChevronRight,
  Upload,
  Download,
  Trash2,
} from "lucide-react";
import {
  formatDate,
  formatMontant,
  joursRestants,
  getUrgenceColor,
  STATUTS_DOSSIER,
  TRANSITIONS_STATUT,
  TYPES_PIECES,
  TYPES_DOCUMENTS,
  MODALITES,
  MODES_REGLEMENT,
  TYPES_FINANCEMENT,
  StatutDossier,
} from "@/lib/utils";

interface Piece {
  id: string;
  typePiece: string;
  statut: string;
  dateDepot?: string | null;
  url?: string | null;
  commentaire?: string | null;
}

interface Document {
  id: string;
  type: string;
  dateGeneration: string;
  contenu?: string | null;
  signe?: boolean;
  signatureEleve?: string | null;
  signatureOF?: string | null;
  tokenEleve?: string | null;
  tokenOF?: string | null;
}

interface Dossier {
  id: string;
  numero: string;
  statut: string;
  dateDebut: string;
  dateFin: string;
  dateLimiteDepot?: string;
  dateLimiteRemboursement?: string;
  montantHT: number;
  tauxTVA: number;
  montantTTC: number;
  modalite: string;
  nomFormateur?: string | null;
  nombreParticipants: number;
  lieuFormationAdresse?: string | null;
  lieuFormationCodePostal?: string | null;
  lieuFormationVille?: string | null;
  dureePresIndividuel?: number | null;
  dureePresCollectif?: number | null;
  dureeDistSynchrone?: number | null;
  dureeDistAsynchrone?: number | null;
  dureePresIndividuelRealisee?: number | null;
  dureePresCollectifRealisee?: number | null;
  dureeDistSynchroneRealisee?: number | null;
  dureeDistAsynchroneRealisee?: number | null;
  modeReglement?: string | null;
  dateReglement?: string | null;
  typeFinancement?: string | null;
  nomFinanceur?: string | null;
  montantPriseEnCharge?: number | null;
  remisePourcent?: number | null;
  remiseMontant?: number | null;
  notes?: string | null;
  client: { id: string; nom: string; prenom: string; siret: string; statutJuridique: string; telephone?: string | null };
  formation: { id: string; reference: string; intitule: string; dureeHeures: number };
  pieces: Piece[];
  documents: Document[];
}

const STATUT_ORDRE: StatutDossier[] = [
  "en_preparation",
  "depose",
  "accord",
  "en_cours",
  "termine",
  "remboursement_demande",
  "rembourse",
];

const PIECE_STATUTS = {
  manquante: { label: "Manquante", color: "bg-red-100 text-red-700" },
  recue: { label: "Reçue", color: "bg-blue-100 text-blue-700" },
  validee: { label: "Validée", color: "bg-green-100 text-green-700" },
  rejetee: { label: "Rejetée", color: "bg-orange-100 text-orange-700" },
} as const;

function StatutBadge({ statut }: { statut: string }) {
  const s = STATUTS_DOSSIER[statut as keyof typeof STATUTS_DOSSIER];
  if (!s) return <span className="text-gray-500 text-xs">{statut}</span>;
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${s.color}`}>
      {s.label}
    </span>
  );
}

function Toast({ type, msg }: { type: "success" | "error"; msg: string }) {
  return (
    <div
      className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-lg shadow-lg text-sm font-medium text-white ${
        type === "success" ? "bg-green-600" : "bg-red-600"
      }`}
    >
      {msg}
    </div>
  );
}

export default function DossierDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [dossier, setDossier] = useState<Dossier | null>(null);
  const [loading, setLoading] = useState(true);
  const [showStatutModal, setShowStatutModal] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [generatingDoc, setGeneratingDoc] = useState<string | null>(null);
  const [savingAgefice, setSavingAgefice] = useState(false);
  const [uploadingPiece, setUploadingPiece] = useState<string | null>(null);
  const [agefice, setAgefice] = useState({
    nomFormateur: "",
    lieuFormationAdresse: "",
    lieuFormationCodePostal: "",
    lieuFormationVille: "",
    dureePresIndividuelRealisee: "",
    dureePresCollectifRealisee: "",
    dureeDistSynchroneRealisee: "",
    dureeDistAsynchroneRealisee: "",
    modeReglement: "",
    dateReglement: "",
    // Financement
    typeFinancement: "",
    nomFinanceur: "",
    montantPriseEnCharge: "",
    // Remise
    remisePourcent: "",
    remiseMontant: "",
  });

  const loadDossier = useCallback(async () => {
    const res = await fetch(`/api/dossiers/${id}`);
    if (res.ok) {
      const data: Dossier = await res.json();
      setDossier(data);
      setNotes(data.notes ?? "");
      setAgefice({
        nomFormateur: data.nomFormateur ?? "",
        lieuFormationAdresse: data.lieuFormationAdresse ?? "",
        lieuFormationCodePostal: data.lieuFormationCodePostal ?? "",
        lieuFormationVille: data.lieuFormationVille ?? "",
        dureePresIndividuelRealisee: data.dureePresIndividuelRealisee != null ? String(data.dureePresIndividuelRealisee) : "",
        dureePresCollectifRealisee: data.dureePresCollectifRealisee != null ? String(data.dureePresCollectifRealisee) : "",
        dureeDistSynchroneRealisee: data.dureeDistSynchroneRealisee != null ? String(data.dureeDistSynchroneRealisee) : "",
        dureeDistAsynchroneRealisee: data.dureeDistAsynchroneRealisee != null ? String(data.dureeDistAsynchroneRealisee) : "",
        modeReglement: data.modeReglement ?? "",
        dateReglement: data.dateReglement ? data.dateReglement.substring(0, 10) : "",
        typeFinancement: data.typeFinancement ?? "",
        nomFinanceur: data.nomFinanceur ?? "",
        montantPriseEnCharge: data.montantPriseEnCharge != null ? String(data.montantPriseEnCharge) : "",
        remisePourcent: data.remisePourcent != null ? String(data.remisePourcent) : "",
        remiseMontant: data.remiseMontant != null ? String(data.remiseMontant) : "",
      });
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    loadDossier();
  }, [loadDossier]);

  function showToastMsg(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleStatutChange(newStatut: string) {
    setShowStatutModal(false);
    try {
      const res = await fetch(`/api/dossiers/${id}/statut`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut: newStatut }),
      });
      if (!res.ok) {
        const err = await res.json();
        showToastMsg("error", err.error ?? "Erreur lors du changement de statut");
        return;
      }
      const updated: Dossier = await res.json();
      setDossier(updated);
      showToastMsg("success", "Statut mis à jour avec succès");
    } catch {
      showToastMsg("error", "Erreur réseau");
    }
  }

  async function handleSaveNotes() {
    setSavingNotes(true);
    try {
      const res = await fetch(`/api/dossiers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      if (!res.ok) {
        showToastMsg("error", "Erreur lors de la sauvegarde des notes");
      } else {
        showToastMsg("success", "Notes sauvegardées");
      }
    } catch {
      showToastMsg("error", "Erreur réseau");
    } finally {
      setSavingNotes(false);
    }
  }

  async function handleSaveAgefice() {
    setSavingAgefice(true);
    try {
      // Calcul automatique remiseMontant si remisePourcent saisie
      let remiseMontantCalc: number | null = null;
      if (agefice.remisePourcent !== "") {
        remiseMontantCalc = dossier ? dossier.montantHT * Number(agefice.remisePourcent) / 100 : null;
      } else if (agefice.remiseMontant !== "") {
        remiseMontantCalc = Number(agefice.remiseMontant);
      }

      const body: Record<string, unknown> = {
        nomFormateur: agefice.nomFormateur || null,
        lieuFormationAdresse: agefice.lieuFormationAdresse || null,
        lieuFormationCodePostal: agefice.lieuFormationCodePostal || null,
        lieuFormationVille: agefice.lieuFormationVille || null,
        dureePresIndividuelRealisee: agefice.dureePresIndividuelRealisee !== "" ? Number(agefice.dureePresIndividuelRealisee) : null,
        dureePresCollectifRealisee: agefice.dureePresCollectifRealisee !== "" ? Number(agefice.dureePresCollectifRealisee) : null,
        dureeDistSynchroneRealisee: agefice.dureeDistSynchroneRealisee !== "" ? Number(agefice.dureeDistSynchroneRealisee) : null,
        dureeDistAsynchroneRealisee: agefice.dureeDistAsynchroneRealisee !== "" ? Number(agefice.dureeDistAsynchroneRealisee) : null,
        modeReglement: agefice.modeReglement || null,
        dateReglement: agefice.dateReglement || null,
        // Financement
        typeFinancement: agefice.typeFinancement || null,
        nomFinanceur: agefice.nomFinanceur || null,
        montantPriseEnCharge: agefice.montantPriseEnCharge !== "" ? Number(agefice.montantPriseEnCharge) : null,
        // Remise
        remisePourcent: agefice.remisePourcent !== "" ? Number(agefice.remisePourcent) : null,
        remiseMontant: remiseMontantCalc,
      };
      const res = await fetch(`/api/dossiers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        showToastMsg("error", "Erreur lors de la sauvegarde");
      } else {
        showToastMsg("success", "Informations AGEFICE sauvegardées");
        loadDossier();
      }
    } catch {
      showToastMsg("error", "Erreur réseau");
    } finally {
      setSavingAgefice(false);
    }
  }

  async function handleUploadPiece(pieceId: string, file: File) {
    setUploadingPiece(pieceId);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/pieces/${pieceId}/upload`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        showToastMsg("error", err.error ?? "Erreur lors de l'upload");
        return;
      }
      showToastMsg("success", "Pièce déposée avec succès");
      loadDossier();
    } catch {
      showToastMsg("error", "Erreur réseau");
    } finally {
      setUploadingPiece(null);
    }
  }

  async function handleDeletePiece(pieceId: string) {
    if (!confirm("Supprimer le fichier de cette pièce ?")) return;
    try {
      const res = await fetch(`/api/pieces/${pieceId}`, { method: "DELETE" });
      if (!res.ok) {
        showToastMsg("error", "Erreur lors de la suppression");
        return;
      }
      showToastMsg("success", "Fichier supprimé");
      loadDossier();
    } catch {
      showToastMsg("error", "Erreur réseau");
    }
  }

  async function handleUpdatePieceStatut(pieceId: string, statut: string) {
    try {
      await fetch(`/api/pieces/${pieceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut }),
      });
      loadDossier();
    } catch {
      showToastMsg("error", "Erreur réseau");
    }
  }

  async function handleGenerateDoc(docType: string) {
    setGeneratingDoc(docType);
    try {
      const res = await fetch(`/api/dossiers/${id}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: docType }),
      });
      if (!res.ok) {
        const err = await res.json();
        showToastMsg("error", err.error ?? "Erreur lors de la génération");
        return;
      }
      const { html, filename } = await res.json();
      // Decode base64 → binary string → Uint8Array to preserve UTF-8 bytes
      const binary = atob(html);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      showToastMsg("success", "Document généré et téléchargé");
      // Reload dossier to update document list
      loadDossier();
    } catch {
      showToastMsg("error", "Erreur réseau lors de la génération");
    } finally {
      setGeneratingDoc(null);
    }
  }

  async function handleGenererLiens(docId: string): Promise<{ tokenEleve: string; tokenOF: string } | null> {
    try {
      const res = await fetch(`/api/dossiers/${id}/documents/${docId}/lien`, { method: "POST" });
      if (!res.ok) { showToastMsg("error", "Erreur génération des liens"); return null; }
      const tokens = await res.json() as { tokenEleve: string; tokenOF: string };
      loadDossier();
      return tokens;
    } catch {
      showToastMsg("error", "Erreur réseau");
      return null;
    }
  }

  async function handleEnvoyerEmail(docId: string, role: "eleve" | "of") {
    try {
      const res = await fetch(`/api/dossiers/${id}/documents/${docId}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) showToastMsg("error", data.error ?? "Erreur lors de l'envoi");
      else showToastMsg("success", `Email envoyé au ${role === "eleve" ? "stagiaire" : "formateur/OF"} ✓`);
    } catch {
      showToastMsg("error", "Erreur réseau");
    }
  }

  function ouvrirWhatsApp(telephone: string | undefined, lien: string, role: "eleve" | "of") {
    const base = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${base}/signer/${lien}`;
    const who = role === "eleve" ? "stagiaire" : "formateur/OF";
    const text = encodeURIComponent(`Bonjour, merci de signer le document de formation via ce lien (${who}) :\n${url}`);
    const phone = telephone ? telephone.replace(/\D/g, "") : "";
    window.open(phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`, "_blank");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400 text-sm">Chargement...</p>
      </div>
    );
  }

  if (!dossier) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-red-500 font-medium">Dossier introuvable</p>
        <Link href="/dossiers" className="text-sm text-blue-600 hover:underline">
          Retour aux dossiers
        </Link>
      </div>
    );
  }

  const currentStatut = dossier.statut as StatutDossier;
  const nextStatuts = TRANSITIONS_STATUT[currentStatut] ?? [];
  const currentStepIndex = STATUT_ORDRE.indexOf(currentStatut);

  const joursDepot = dossier.dateLimiteDepot
    ? joursRestants(new Date(dossier.dateLimiteDepot))
    : null;
  const joursRemb = dossier.dateLimiteRemboursement
    ? joursRestants(new Date(dossier.dateLimiteRemboursement))
    : null;

  const generedDocTypes = new Set(dossier.documents.map((d) => d.type));

  return (
    <div className="space-y-6">
      {toast && <Toast type={toast.type} msg={toast.msg} />}

      {/* Statut modal */}
      {showStatutModal && (
        <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">Changer le statut</h3>
              <button
                onClick={() => setShowStatutModal(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="px-6 py-4">
              <p className="text-sm text-gray-500 mb-3">
                Statut actuel :{" "}
                <strong>{STATUTS_DOSSIER[currentStatut]?.label}</strong>
              </p>
              {nextStatuts.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">
                  Aucune transition disponible depuis ce statut
                </p>
              ) : (
                <div className="space-y-2">
                  {nextStatuts.map((s) => {
                    const info = STATUTS_DOSSIER[s];
                    return (
                      <button
                        key={s}
                        onClick={() => handleStatutChange(s)}
                        className={`w-full text-left px-4 py-3 rounded-xl border-2 border-transparent hover:border-blue-300 hover:bg-blue-50 transition-all flex items-center justify-between ${info.color}`}
                      >
                        <span className="font-medium">{info.label}</span>
                        <ChevronRight className="w-4 h-4 opacity-50" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-3">
        <Link
          href="/dossiers"
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors flex-shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-mono text-gray-500">{dossier.numero}</span>
            <StatutBadge statut={dossier.statut} />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mt-1">
            {dossier.client.prenom} {dossier.client.nom}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5 truncate">{dossier.formation.intitule}</p>
        </div>
        {nextStatuts.length > 0 && (
          <button
            onClick={() => setShowStatutModal(true)}
            className="flex-shrink-0 inline-flex items-center gap-2 bg-[#E4620D] hover:bg-[#c7530b] text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            Changer le statut
          </button>
        )}
      </div>

      {/* Status Timeline */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 overflow-x-auto">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
          Cycle de vie du dossier
        </h2>
        <div className="flex items-center min-w-max">
          {STATUT_ORDRE.map((s, i) => {
            const info = STATUTS_DOSSIER[s];
            const isDone = i < currentStepIndex;
            const isCurrent = i === currentStepIndex;
            const isRefused = currentStatut === "refuse";
            return (
              <div key={s} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      isRefused
                        ? "bg-gray-100 text-gray-300"
                        : isDone
                        ? "bg-green-500 text-white"
                        : isCurrent
                        ? "bg-[#1F4E79] text-white ring-2 ring-offset-2 ring-blue-400"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {isDone ? <Check className="w-3.5 h-3.5" /> : i + 1}
                  </div>
                  <span
                    className={`mt-1.5 text-xs text-center max-w-[80px] leading-tight ${
                      isCurrent ? "text-gray-900 font-semibold" : "text-gray-400"
                    }`}
                  >
                    {info.label}
                  </span>
                </div>
                {i < STATUT_ORDRE.length - 1 && (
                  <div
                    className={`h-px w-12 mx-1 mb-5 ${
                      isDone ? "bg-green-400" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            );
          })}
          {currentStatut === "refuse" && (
            <div className="ml-4 flex items-center gap-2">
              <div className="w-px h-8 bg-gray-200" />
              <div className="bg-red-100 text-red-700 text-xs font-medium px-3 py-1.5 rounded-full">
                Refusé / Clôturé
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Date début</p>
          <p className="text-base font-semibold text-gray-900 mt-1">
            {formatDate(dossier.dateDebut)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Date fin</p>
          <p className="text-base font-semibold text-gray-900 mt-1">
            {formatDate(dossier.dateFin)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Modalité</p>
          <p className="text-base font-semibold text-gray-900 mt-1">
            {MODALITES[dossier.modalite as keyof typeof MODALITES] ?? dossier.modalite}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Montant TTC</p>
          <p className="text-base font-semibold text-gray-900 mt-1">
            {formatMontant(dossier.montantTTC)}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">HT : {formatMontant(dossier.montantHT)}</p>
        </div>
      </div>

      {/* Deadlines */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {dossier.dateLimiteDepot && (
          <div
            className={`rounded-xl border p-4 flex items-start gap-3 ${
              joursDepot !== null && joursDepot < 7
                ? "bg-red-50 border-red-200"
                : joursDepot !== null && joursDepot < 15
                ? "bg-orange-50 border-orange-200"
                : "bg-white border-gray-200"
            }`}
          >
            {joursDepot !== null && joursDepot < 15 && (
              <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                Date limite de dépôt
              </p>
              <p className="text-base font-semibold text-gray-900 mt-1">
                {formatDate(dossier.dateLimiteDepot)}
              </p>
              {joursDepot !== null && (
                <p className={`text-sm font-medium mt-0.5 ${getUrgenceColor(joursDepot)}`}>
                  {joursDepot < 0
                    ? `Expiré depuis ${Math.abs(joursDepot)} jour${Math.abs(joursDepot) > 1 ? "s" : ""}`
                    : `${joursDepot} jour${joursDepot > 1 ? "s" : ""} restant${joursDepot > 1 ? "s" : ""}`}
                </p>
              )}
            </div>
          </div>
        )}
        {dossier.dateLimiteRemboursement && (
          <div
            className={`rounded-xl border p-4 flex items-start gap-3 ${
              joursRemb !== null && joursRemb < 7
                ? "bg-red-50 border-red-200"
                : joursRemb !== null && joursRemb < 15
                ? "bg-orange-50 border-orange-200"
                : "bg-white border-gray-200"
            }`}
          >
            {joursRemb !== null && joursRemb < 15 && (
              <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                Date limite remboursement
              </p>
              <p className="text-base font-semibold text-gray-900 mt-1">
                {formatDate(dossier.dateLimiteRemboursement)}
              </p>
              {joursRemb !== null && (
                <p className={`text-sm font-medium mt-0.5 ${getUrgenceColor(joursRemb)}`}>
                  {joursRemb < 0
                    ? `Expiré depuis ${Math.abs(joursRemb)} jour${Math.abs(joursRemb) > 1 ? "s" : ""}`
                    : `${joursRemb} jour${joursRemb > 1 ? "s" : ""} restant${joursRemb > 1 ? "s" : ""}`}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* AGEFICE Tracking Panel */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-gray-900">Suivi AGEFICE</h2>
            <p className="text-xs text-gray-400 mt-0.5">Informations nécessaires pour l&apos;attestation et la facture</p>
          </div>
          <button
            onClick={handleSaveAgefice}
            disabled={savingAgefice}
            className="inline-flex items-center gap-1.5 bg-[#1F4E79] hover:bg-[#163a5a] disabled:opacity-60 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
          >
            {savingAgefice ? "Sauvegarde..." : "Sauvegarder"}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Formateur */}
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">Nom du formateur</label>
            <input
              type="text"
              value={agefice.nomFormateur}
              onChange={(e) => setAgefice((p) => ({ ...p, nomFormateur: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Prénom NOM"
            />
          </div>

          {/* Lieu de formation */}
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">Adresse du lieu de formation</label>
            <input
              type="text"
              value={agefice.lieuFormationAdresse}
              onChange={(e) => setAgefice((p) => ({ ...p, lieuFormationAdresse: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="12 rue de la République"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Code postal</label>
            <input
              type="text"
              value={agefice.lieuFormationCodePostal}
              onChange={(e) => setAgefice((p) => ({ ...p, lieuFormationCodePostal: e.target.value }))}
              maxLength={5}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="97400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Ville</label>
            <input
              type="text"
              value={agefice.lieuFormationVille}
              onChange={(e) => setAgefice((p) => ({ ...p, lieuFormationVille: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Saint-Denis"
            />
          </div>
        </div>

        {/* Durées réalisées */}
        <div className="mt-4">
          <p className="text-xs font-semibold text-gray-700 mb-1">Durées réalisées (heures) — pour attestation d&apos;assiduité</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { key: "dureePresIndividuelRealisee", label: "Présentiel indiv.", prev: dossier?.dureePresIndividuel },
              { key: "dureePresCollectifRealisee", label: "Présentiel collect.", prev: dossier?.dureePresCollectif },
              { key: "dureeDistSynchroneRealisee", label: "Dist. synchrone", prev: dossier?.dureeDistSynchrone },
              { key: "dureeDistAsynchroneRealisee", label: "Dist. asynchrone", prev: dossier?.dureeDistAsynchrone },
            ].map(({ key, label, prev }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {label}
                  {prev != null && <span className="ml-1 text-gray-400">(prévu: {prev}h)</span>}
                </label>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={agefice[key as keyof typeof agefice]}
                  onChange={(e) => setAgefice((p) => ({ ...p, [key]: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Règlement */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Mode de règlement</label>
            <select
              value={agefice.modeReglement}
              onChange={(e) => setAgefice((p) => ({ ...p, modeReglement: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— Sélectionner —</option>
              {Object.entries(MODES_REGLEMENT).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Date de règlement</label>
            <input
              type="date"
              value={agefice.dateReglement}
              onChange={(e) => setAgefice((p) => ({ ...p, dateReglement: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Financement */}
        <div className="mt-5 pt-4 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-700 mb-3">Financement de la formation</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Type de financement</label>
              <select
                value={agefice.typeFinancement}
                onChange={(e) => setAgefice((p) => ({ ...p, typeFinancement: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">— Sélectionner —</option>
                {Object.entries(TYPES_FINANCEMENT).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Nom du financeur
                <span className="ml-1 text-gray-400 font-normal">(si OPCO, Région…)</span>
              </label>
              <input
                type="text"
                value={agefice.nomFinanceur}
                onChange={(e) => setAgefice((p) => ({ ...p, nomFinanceur: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex : OPCO EP, AFDAS…"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Montant pris en charge (€)
              </label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={agefice.montantPriseEnCharge}
                onChange={(e) => setAgefice((p) => ({ ...p, montantPriseEnCharge: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        {/* Remise */}
        <div className="mt-4 pt-3 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-700 mb-3">
            Remise commerciale
            {dossier && (agefice.remisePourcent !== "" || agefice.remiseMontant !== "") && (
              <span className="ml-2 text-green-600 font-medium">
                {agefice.remisePourcent !== ""
                  ? `− ${agefice.remisePourcent}% = − ${formatMontant(dossier.montantHT * Number(agefice.remisePourcent) / 100)}`
                  : agefice.remiseMontant !== ""
                  ? `− ${formatMontant(Number(agefice.remiseMontant))}`
                  : ""}
              </span>
            )}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Remise en % <span className="text-gray-400 font-normal">(prioritaire sur le montant)</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={agefice.remisePourcent}
                  onChange={(e) => {
                    const v = e.target.value;
                    setAgefice((p) => ({
                      ...p,
                      remisePourcent: v,
                      remiseMontant: v && dossier
                        ? String(Math.round(dossier.montantHT * Number(v) / 100 * 100) / 100)
                        : p.remiseMontant,
                    }));
                  }}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
                <span className="absolute right-3 top-2.5 text-sm text-gray-400">%</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Remise en € <span className="text-gray-400 font-normal">(calculée ou manuelle)</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={agefice.remiseMontant}
                  onChange={(e) => setAgefice((p) => ({ ...p, remiseMontant: e.target.value, remisePourcent: "" }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
                <span className="absolute right-3 top-2.5 text-sm text-gray-400">€</span>
              </div>
            </div>
          </div>
          {dossier && (agefice.remisePourcent !== "" || agefice.remiseMontant !== "") && (() => {
            const remise = agefice.remisePourcent !== ""
              ? dossier.montantHT * Number(agefice.remisePourcent) / 100
              : Number(agefice.remiseMontant);
            const htNet = dossier.montantHT - remise;
            return (
              <div className="mt-2 flex items-center gap-4 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                <span>HT brut : <strong>{formatMontant(dossier.montantHT)}</strong></span>
                <span className="text-red-500">− remise : <strong>{formatMontant(remise)}</strong></span>
                <span className="text-green-700 font-semibold">= HT net : <strong>{formatMontant(htNet)}</strong></span>
              </div>
            );
          })()}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pièces client */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Pièces justificatives client</h2>
            <p className="text-xs text-gray-400 mt-0.5">Documents requis du chef d&apos;entreprise</p>
          </div>
          <div className="divide-y divide-gray-100">
            {Object.entries(TYPES_PIECES).map(([key, label]) => {
              const piece = dossier.pieces.find((p) => p.typePiece === key);
              const statut = piece?.statut ?? "manquante";
              const statutInfo = PIECE_STATUTS[statut as keyof typeof PIECE_STATUTS] ?? PIECE_STATUTS.manquante;
              const isUploading = uploadingPiece === piece?.id;
              return (
                <div key={key} className="px-5 py-3 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800">{label}</p>
                      {piece?.dateDepot && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          Reçu le {formatDate(piece.dateDepot)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Status badge / selector */}
                      {piece ? (
                        <select
                          value={statut}
                          onChange={(e) => handleUpdatePieceStatut(piece.id, e.target.value)}
                          className={`text-xs font-medium rounded-full px-2.5 py-0.5 border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 ${statutInfo.color}`}
                        >
                          {Object.entries(PIECE_STATUTS).map(([k, v]) => (
                            <option key={k} value={k}>{v.label}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          Manquante
                        </span>
                      )}

                      {/* Download link */}
                      {piece?.url && (
                        <a
                          href={piece.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Télécharger / voir le fichier"
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      )}

                      {/* Delete button */}
                      {piece?.url && (
                        <button
                          onClick={() => handleDeletePiece(piece.id)}
                          title="Supprimer le fichier"
                          className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}

                      {/* Upload button */}
                      {piece && (
                        <label
                          title={piece.url ? "Remplacer le fichier" : "Déposer un fichier"}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            isUploading
                              ? "opacity-50 cursor-not-allowed"
                              : "text-gray-500 hover:bg-gray-100"
                          }`}
                        >
                          {isUploading ? (
                            <span className="text-xs text-gray-400">...</span>
                          ) : (
                            <Upload className="w-4 h-4" />
                          )}
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.webp"
                            className="hidden"
                            disabled={isUploading}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleUploadPiece(piece.id, file);
                                e.target.value = "";
                              }
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Documents */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Documents AGEFICE</h2>
            <p className="text-xs text-gray-400 mt-0.5">Documents à générer pour le dossier</p>
          </div>
          <div className="divide-y divide-gray-100">
            {Object.entries(TYPES_DOCUMENTS).map(([key, label]) => {
              const isGenerated = generedDocTypes.has(key);
              const doc = dossier.documents.find((d) => d.type === key);
              return (
                <div key={key} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm text-gray-800 truncate">{label}</p>
                      {doc && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          Généré le {formatDate(doc.dateGeneration)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        doc?.signe
                          ? "bg-indigo-100 text-indigo-700"
                          : isGenerated
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {doc?.signe ? "Signé" : isGenerated ? "Généré" : "À générer"}
                    </span>
                    {isGenerated && doc && doc.contenu && (
                      <a
                        href={`/api/dossiers/${id}/documents/${doc.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-emerald-600 hover:text-emerald-800 font-medium"
                        title="Ouvrir dans un nouvel onglet"
                      >
                        Ouvrir
                      </a>
                    )}
                    {isGenerated && doc && !doc.signe && (
                      <div className="flex items-center gap-1.5">
                        {/* Lien stagiaire */}
                        <button
                          onClick={async () => {
                            const tokens = doc.tokenEleve
                              ? { tokenEleve: doc.tokenEleve, tokenOF: doc.tokenOF! }
                              : await handleGenererLiens(doc.id);
                            if (tokens) ouvrirWhatsApp(dossier.client?.telephone, tokens.tokenEleve, "eleve");
                          }}
                          className="flex items-center gap-1 text-xs text-green-700 hover:text-green-900 font-medium bg-green-50 hover:bg-green-100 px-2 py-1 rounded-lg border border-green-200"
                          title="Envoyer lien signature stagiaire par WhatsApp"
                        >
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                          Stagiaire
                        </button>
                        {/* Lien OF */}
                        <button
                          onClick={async () => {
                            const tokens = doc.tokenOF
                              ? { tokenEleve: doc.tokenEleve!, tokenOF: doc.tokenOF }
                              : await handleGenererLiens(doc.id);
                            if (tokens) ouvrirWhatsApp(undefined, tokens.tokenOF, "of");
                          }}
                          className="flex items-center gap-1 text-xs text-blue-700 hover:text-blue-900 font-medium bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-lg border border-blue-200"
                          title="Envoyer lien signature OF par WhatsApp"
                        >
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                          OF
                        </button>
                        {/* Boutons email */}
                        {!doc.signatureEleve && (
                          <button
                            onClick={() => handleEnvoyerEmail(doc.id, "eleve")}
                            className="flex items-center gap-1 text-xs text-green-700 hover:text-green-900 font-medium bg-green-50 hover:bg-green-100 px-2 py-1 rounded-lg border border-green-200"
                            title="Envoyer par email au stagiaire"
                          >
                            ✉ Mail
                          </button>
                        )}
                        {!doc.signatureOF && (
                          <button
                            onClick={() => handleEnvoyerEmail(doc.id, "of")}
                            className="flex items-center gap-1 text-xs text-blue-700 hover:text-blue-900 font-medium bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-lg border border-blue-200"
                            title="Envoyer par email à l'OF"
                          >
                            ✉ Mail OF
                          </button>
                        )}
                        {/* Badges signatures partielles */}
                        {doc.signatureEleve && (
                          <span className="text-xs text-green-600" title="Stagiaire a signé">✓ Stag.</span>
                        )}
                        {doc.signatureOF && (
                          <span className="text-xs text-blue-600" title="OF a signé">✓ OF</span>
                        )}
                      </div>
                    )}
                    <button
                      onClick={() => handleGenerateDoc(key)}
                      disabled={generatingDoc === key}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
                      title="Générer le document"
                    >
                      {generatingDoc === key ? "..." : isGenerated ? "Régénérer" : "Générer"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">Notes</h2>
          <button
            type="button"
            onClick={() => {
              const tpl = [
                notes ? notes.trimEnd() + "\n\n" : "",
                "# Familles de métiers (pour le Plan de développement des compétences)\n",
                "# Format : FAMILLE: nom | effectif | postes | besoins | compétences visées | modalités\n",
                "FAMILLE: Administration et gestion | 11 | Secrétaire, responsables administratifs | Automatiser les tâches récurrentes | Utiliser l'IA pour rédiger et organiser | Tronc commun + 2 ateliers métier\n",
                "FAMILLE: Technique et encadrement | 8 | Conseillers techniques, éducateurs | Structurer les contenus pédagogiques | Préparer supports et synthèses avec l'IA | Tronc commun + 1 atelier dédié\n",
              ].join("");
              setNotes(tpl);
            }}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium border border-blue-200 rounded px-2 py-1"
            title="Insérer le format FAMILLE pour le PDC"
          >
            + Modèle familles (PDC)
          </button>
        </div>
        <textarea
          rows={6}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={handleSaveNotes}
          placeholder={"Ajouter des notes sur ce dossier...\n\nPour générer un Plan de développement des compétences :\nFAMILLE: nom | effectif | postes | besoins | compétences | modalités"}
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono"
        />
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-gray-400">
            Sauvegarde auto au clic hors du champ · les lignes <code className="bg-gray-100 px-1 rounded">FAMILLE:</code> alimentent le PDC
          </p>
          <button
            onClick={handleSaveNotes}
            disabled={savingNotes}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
          >
            {savingNotes ? "Sauvegarde..." : "Sauvegarder"}
          </button>
        </div>
      </div>

      {/* Client & Formation links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href={`/clients/${dossier.client.id}`}
          className="bg-white rounded-xl border border-gray-200 hover:border-blue-300 p-4 flex items-center justify-between group transition-colors"
        >
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Client</p>
            <p className="text-sm font-semibold text-gray-900 mt-0.5">
              {dossier.client.prenom} {dossier.client.nom}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {dossier.client.statutJuridique} &middot; {dossier.client.siret}
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-400 transition-colors" />
        </Link>
        <Link
          href={`/formations/${dossier.formation.id}`}
          className="bg-white rounded-xl border border-gray-200 hover:border-blue-300 p-4 flex items-center justify-between group transition-colors"
        >
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Formation</p>
            <p className="text-sm font-semibold text-gray-900 mt-0.5">
              {dossier.formation.intitule}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {dossier.formation.reference} &middot; {dossier.formation.dureeHeures}h
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-400 transition-colors" />
        </Link>
      </div>
    </div>
  );
}
