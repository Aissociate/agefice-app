"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft, Plus, Mail, Phone, MapPin, Building2, User,
  MessageSquare, FileText, Send, Pencil, Trash2, ChevronRight,
  RotateCcw, X, Check, Inbox, Clock, Sparkles, StickyNote,
  Paperclip, Download, Mic, MicOff,
} from "lucide-react";
import { formatDate, formatMontant, joursRestants, getUrgenceColor, STATUTS_DOSSIER } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Dossier {
  id: string; numero: string; statut: string; dateDebut?: string | null;
  dateLimiteDepot?: string | null; montantTTC?: number | null;
  formation?: { intitule: string } | null;
}
interface Note { id: string; contenu: string; createdAt: string; updatedAt: string; }
interface Attachment { id: string; nom: string; type: string; taille: number; chemin: string; }
interface PendingAttachment { url: string; nom: string; type: string; taille: number; }
interface Message {
  id: string; direction: "entrant" | "sortant"; expediteur: string;
  destinataire: string; sujet?: string | null; contenu: string;
  brouillon: boolean; envoye: boolean; dateEnvoi?: string | null; lu: boolean; createdAt: string;
  attachments?: Attachment[];
}
interface Conversation {
  id: string; sujet: string; statut: string; updatedAt: string; createdAt: string;
  messages: Message[];
  _count: { messages: number };
}
interface Client {
  id: string; nom: string; prenom: string; civilite?: string | null;
  statutJuridique: string; nomCommercial?: string | null; siret?: string | null; codeApe: string;
  email: string; telephone?: string | null; adresse?: string | null;
  codePostal?: string | null; ville?: string | null;
  dossiers: Dossier[];
  lead?: { id: string; statut: string } | null;
}

const ACTIONS = [
  { value: "accueil", label: "Premier contact / accueil" },
  { value: "relance_depot", label: "Relance dépôt dossier AGEFICE" },
  { value: "relance_pieces", label: "Relance pièces manquantes" },
  { value: "confirmation_accord", label: "Confirmation accord financement" },
  { value: "convocation", label: "Convocation à la formation" },
  { value: "remboursement", label: "Suivi remboursement" },
  { value: "relance_signature", label: "Relance signature document" },
  { value: "reponse_libre", label: "Réponse libre" },
  { value: "autre", label: "Autre" },
];

// ─── Sub-components ──────────────────────────────────────────────────────────
function StatutBadge({ statut }: { statut: string }) {
  const s = STATUTS_DOSSIER[statut as keyof typeof STATUTS_DOSSIER];
  if (!s) return <span className="text-gray-500 text-xs">{statut}</span>;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${s.color}`}>
      {s.label}
    </span>
  );
}

function InfoItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | null }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-blue-700" />
      </div>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-900">{value || "—"}</p>
      </div>
    </div>
  );
}

// ─── Notes Tab ───────────────────────────────────────────────────────────────
function NotesTab({ clientId }: { clientId: string }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [saving, setSaving] = useState(false);
  const [recording, setRecording] = useState(false);
  const [interimText, setInterimText] = useState("");
  const recognitionRef = useRef<unknown>(null);

  function toggleRecording() {
    if (recording) {
      (recognitionRef.current as { stop: () => void } | null)?.stop();
      setRecording(false);
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert("La reconnaissance vocale n'est pas supportée par ce navigateur. Utilisez Chrome ou Edge.");
      return;
    }
    const recognition = new SR();
    recognition.lang = "fr-FR";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event: { resultIndex: number; results: SpeechRecognitionResultList }) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) final += event.results[i][0].transcript;
        else interim += event.results[i][0].transcript;
      }
      if (final) setNewNote((prev) => (prev ? prev + " " + final.trim() : final.trim()));
      setInterimText(interim);
    };
    recognition.onend = () => { setRecording(false); setInterimText(""); };
    recognition.onerror = () => { setRecording(false); setInterimText(""); };
    recognitionRef.current = recognition;
    recognition.start();
    setRecording(true);
  }

  useEffect(() => {
    fetch(`/api/clients/${clientId}/notes`).then((r) => r.json()).then(setNotes);
  }, [clientId]);

  async function addNote() {
    if (!newNote.trim()) return;
    setSaving(true);
    const res = await fetch(`/api/clients/${clientId}/notes`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contenu: newNote }),
    });
    if (res.ok) {
      const note = await res.json();
      setNotes((p) => [note, ...p]);
      setNewNote("");
    }
    setSaving(false);
  }

  async function saveEdit(id: string) {
    const res = await fetch(`/api/clients/${clientId}/notes/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contenu: editText }),
    });
    if (res.ok) {
      const updated = await res.json();
      setNotes((p) => p.map((n) => (n.id === id ? updated : n)));
    }
    setEditingId(null);
  }

  async function deleteNote(id: string) {
    await fetch(`/api/clients/${clientId}/notes/${id}`, { method: "DELETE" });
    setNotes((p) => p.filter((n) => n.id !== id));
  }

  return (
    <div className="space-y-4">
      {/* Saisie */}
      <div className={`bg-white rounded-xl border p-4 transition-colors ${recording ? "border-red-300 ring-2 ring-red-100" : "border-gray-200"}`}>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">Nouvelle note</label>
          <button
            type="button"
            onClick={toggleRecording}
            title={recording ? "Arrêter la dictée" : "Dicter une note vocale (fr-FR)"}
            className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors ${
              recording
                ? "bg-red-50 border-red-300 text-red-600 hover:bg-red-100"
                : "border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50"
            }`}
          >
            {recording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            {recording ? "Arrêter" : "Dicter"}
          </button>
        </div>
        <div className="relative">
          <textarea
            rows={3}
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder={recording ? "Parlez — la transcription apparaît ici…" : "Ajouter une note interne sur ce client (contexte, préférences, points d'attention…)"}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          {interimText && (
            <div className="absolute bottom-2 left-3 right-3 text-sm text-gray-400 italic pointer-events-none truncate">
              {interimText}…
            </div>
          )}
        </div>
        {recording && (
          <div className="flex items-center gap-2 mt-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block" />
            <span className="text-xs text-red-500 font-medium">Enregistrement en cours — parlez en français</span>
          </div>
        )}
        <div className="flex justify-end mt-2">
          <button
            onClick={addNote}
            disabled={saving || !newNote.trim()}
            className="inline-flex items-center gap-2 bg-[#1F4E79] hover:bg-[#163a5a] disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <StickyNote className="w-4 h-4" />
            {saving ? "Ajout…" : "Ajouter la note"}
          </button>
        </div>
      </div>

      {/* Liste des notes */}
      {notes.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm">
          Aucune note pour ce client.<br />
          <span className="text-xs">Les notes sont incluses dans le contexte de rédaction IA.</span>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div key={note.id} className="bg-white rounded-xl border border-gray-200 p-4">
              {editingId === note.id ? (
                <div className="space-y-2">
                  <textarea
                    rows={3}
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    autoFocus
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setEditingId(null)} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg border border-gray-200">
                      Annuler
                    </button>
                    <button onClick={() => saveEdit(note.id)} className="text-sm bg-[#1F4E79] text-white px-3 py-1.5 rounded-lg hover:bg-[#163a5a]">
                      Enregistrer
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <StickyNote className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{note.contenu}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(note.updatedAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => { setEditingId(note.id); setEditText(note.contenu); }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => deleteNote(note.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Draft Modal ─────────────────────────────────────────────────────────────
function DraftModal({
  clientId, clientEmail, orgEmail, convId,
  onClose, onInsert,
}: {
  clientId: string; clientEmail: string; orgEmail: string;
  convId?: string;
  onClose: () => void;
  onInsert: (html: string) => void;
}) {
  const [action, setAction] = useState("accueil");
  const [instruction, setInstruction] = useState("");
  const [formationChoisie, setFormationChoisie] = useState("");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [allFormations, setAllFormations] = useState<{ id: string; intitule: string; reference: string }[]>([]);

  useEffect(() => {
    fetch("/api/formations?actif=true")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setAllFormations(data); })
      .catch(() => {});
  }, []);

  async function generate() {
    setLoading(true); setError(""); setDraft("");
    try {
      const res = await fetch(`/api/clients/${clientId}/draft`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, convId, instruction, formationChoisie: formationChoisie || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Erreur"); return; }
      setDraft(data.draft);
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <h2 className="font-semibold text-gray-900">Générer un brouillon IA</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type d&apos;action</label>
            <select
              value={action} onChange={(e) => setAction(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {ACTIONS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Formation concernée <span className="font-normal text-gray-400">(optionnel)</span>
            </label>
            <select
              value={formationChoisie}
              onChange={(e) => setFormationChoisie(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">— Aucune formation spécifique —</option>
              {allFormations.map((f) => (
                <option key={f.id} value={f.intitule}>
                  {f.intitule}{f.reference ? ` (${f.reference})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Instruction complémentaire <span className="font-normal text-gray-400">(optionnel)</span>
            </label>
            <textarea
              rows={2}
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="Ex : mentionner que le dossier doit être déposé avant le 15 mai, ton urgent mais bienveillant…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />
          </div>

          <button
            onClick={generate}
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            {loading ? "Génération en cours…" : "Générer le brouillon"}
          </button>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          {draft && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">Brouillon généré</label>
                <button onClick={generate} className="text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1">
                  <RotateCcw className="w-3 h-3" /> Regénérer
                </button>
              </div>
              <div
                className="border border-gray-200 rounded-lg p-3 text-sm text-gray-800 bg-gray-50 min-h-[120px] prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: draft }}
              />
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="text-sm text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg border border-gray-200">
            Fermer
          </button>
          {draft && (
            <button
              onClick={() => { onInsert(draft); onClose(); }}
              className="inline-flex items-center gap-2 bg-[#1F4E79] hover:bg-[#163a5a] text-white text-sm font-medium px-4 py-2 rounded-lg"
            >
              <Check className="w-4 h-4" /> Utiliser ce brouillon
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Compose Form ─────────────────────────────────────────────────────────────
function ComposeForm({
  clientId, clientEmail, orgEmail,
  convId, defaultSubject, catalogueUrl, formations,
  onSent, onCancel,
}: {
  clientId: string; clientEmail: string; orgEmail: string;
  convId?: string; defaultSubject?: string; catalogueUrl?: string;
  formations?: { intitule: string; numero: string }[];
  onSent: (conv?: Conversation) => void; onCancel: () => void;
}) {
  const [sujet, setSujet] = useState(defaultSubject || "");
  const [contenu, setContenu] = useState("");
  const [sending, setSending] = useState(false);
  const [showDraft, setShowDraft] = useState(false);
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload/email-attachment", { method: "POST", body: fd });
      if (!res.ok) return;
      const data = await res.json();
      setAttachments((prev) => [...prev, { url: data.url, nom: data.nom, type: data.type, taille: data.taille }]);
    } finally {
      setUploading(false);
    }
  }

  async function attachCatalogue() {
    if (!catalogueUrl) return;
    const nom = catalogueUrl.split("/").pop() ?? "catalogue.pdf";
    if (attachments.some((a) => a.url === catalogueUrl)) return;
    setAttachments((prev) => [...prev, { url: catalogueUrl, nom: "Catalogue de formation.pdf", type: "application/pdf", taille: 0 }]);
  }

  function removeAttachment(url: string) {
    setAttachments((prev) => prev.filter((a) => a.url !== url));
  }

  async function submit(send: boolean) {
    if (!contenu.trim()) return;
    setSending(true);
    const endpoint = convId
      ? `/api/clients/${clientId}/conversations/${convId}/messages`
      : `/api/clients/${clientId}/conversations`;

    const body = convId
      ? { direction: "sortant", expediteur: orgEmail || "nous", destinataire: clientEmail, sujet, contenu, brouillon: !send, envoyer: send, attachments }
      : { sujet: sujet || "Sans objet", contenu, destinataire: clientEmail, expediteur: orgEmail || "nous", brouillon: !send, envoyer: send, attachments };

    const res = await fetch(endpoint, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const data = await res.json();
      onSent(convId ? undefined : data);
    }
    setSending(false);
  }

  return (
    <>
      {showDraft && (
        <DraftModal
          clientId={clientId} clientEmail={clientEmail} orgEmail={orgEmail}
          convId={convId}
          onClose={() => setShowDraft(false)}
          onInsert={(html) => setContenu((prev) => prev ? prev + "\n\n" + html : html)}
        />
      )}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        {!convId && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Objet</label>
            <input
              type="text" value={sujet} onChange={(e) => setSujet(e.target.value)}
              placeholder="Objet de l'email"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-medium text-gray-600">Message</label>
            <button
              type="button" onClick={() => setShowDraft(true)}
              className="inline-flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-800 font-medium"
            >
              <Sparkles className="w-3 h-3" /> Générer avec IA
            </button>
          </div>
          <textarea
            rows={6}
            value={contenu}
            onChange={(e) => setContenu(e.target.value)}
            placeholder="Rédigez votre message ici…"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Pièces jointes */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <input
              ref={fileInputRef} type="file" multiple className="hidden"
              onChange={(e) => { Array.from(e.target.files ?? []).forEach(uploadFile); e.target.value = ""; }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 px-2.5 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 disabled:opacity-50"
            >
              <Paperclip className="w-3 h-3" />
              {uploading ? "Upload…" : "Joindre un fichier"}
            </button>
            {catalogueUrl && (
              <button
                type="button"
                onClick={attachCatalogue}
                disabled={attachments.some((a) => a.url === catalogueUrl)}
                className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 px-2.5 py-1.5 rounded-lg border border-blue-200 hover:border-blue-300 disabled:opacity-40"
              >
                <FileText className="w-3 h-3" /> Joindre le catalogue
              </button>
            )}
          </div>
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {attachments.map((a) => (
                <div key={a.url} className="inline-flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1 text-xs text-gray-700">
                  <Paperclip className="w-3 h-3 text-gray-400 shrink-0" />
                  <span className="max-w-[160px] truncate">{a.nom}</span>
                  <button onClick={() => removeAttachment(a.url)} className="text-gray-400 hover:text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <button onClick={onCancel} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg border border-gray-200">
            Annuler
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => submit(false)} disabled={sending || !contenu.trim()}
              className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-800 px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-50"
            >
              <FileText className="w-3.5 h-3.5" /> Brouillon
            </button>
            <button
              onClick={() => submit(true)} disabled={sending || !contenu.trim()}
              className="inline-flex items-center gap-2 bg-[#1F4E79] hover:bg-[#163a5a] disabled:opacity-50 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              {sending ? "Envoi…" : "Envoyer"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Thread View ─────────────────────────────────────────────────────────────
function ThreadView({
  conv, clientId, clientEmail, orgEmail, clientPrenom, catalogueUrl, formations,
  onBack, onUpdate,
}: {
  conv: Conversation; clientId: string; clientEmail: string; orgEmail: string; clientPrenom: string; catalogueUrl?: string;
  formations?: { intitule: string; numero: string }[];
  onBack: () => void; onUpdate: (conv: Conversation) => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [replying, setReplying] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [fetchResult, setFetchResult] = useState<string | null>(null);
  const [resending, setResending] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  function reload() {
    fetch(`/api/clients/${clientId}/conversations/${conv.id}/messages`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setMessages(data); });
  }

  useEffect(() => { reload(); }, [clientId, conv.id]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function toggleStatut() {
    const newStatut = conv.statut === "ouvert" ? "ferme" : "ouvert";
    const res = await fetch(`/api/clients/${clientId}/conversations/${conv.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut: newStatut }),
    });
    if (res.ok) onUpdate({ ...conv, statut: newStatut });
  }

  async function deleteMessage(msgId: string) {
    if (!confirm("Supprimer ce message définitivement ?")) return;
    await fetch(
      `/api/clients/${clientId}/conversations/${conv.id}/messages/${msgId}`,
      { method: "DELETE" }
    );
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
  }

  async function resend(msgId: string) {
    setResending(msgId);
    try {
      const res = await fetch(
        `/api/clients/${clientId}/conversations/${conv.id}/messages/${msgId}`,
        { method: "PATCH" }
      );
      if (res.ok) reload();
      else {
        const err = await res.json();
        alert(err.error || "Erreur lors du renvoi");
      }
    } finally {
      setResending(null);
    }
  }

  async function checkReplies() {
    setFetching(true);
    setFetchResult(null);
    try {
      const res = await fetch(`/api/clients/${clientId}/conversations/fetch-replies`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setFetchResult(`Erreur : ${data.error}`); return; }
      if (data.imported > 0) { reload(); setFetchResult(`${data.imported} nouvelle${data.imported > 1 ? "s" : ""} réponse${data.imported > 1 ? "s" : ""} importée${data.imported > 1 ? "s" : ""}`); }
      else setFetchResult("Aucune nouvelle réponse");
    } catch { setFetchResult("Erreur réseau"); }
    finally { setFetching(false); setTimeout(() => setFetchResult(null), 4000); }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{conv.sujet}</h3>
          <p className="text-xs text-gray-400">{messages.length} message{messages.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={toggleStatut}
          className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-colors ${
            conv.statut === "ouvert"
              ? "text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100"
              : "text-gray-500 border-gray-200 bg-gray-50 hover:bg-gray-100"
          }`}
        >
          {conv.statut === "ouvert" ? "Ouvert" : "Fermé"}
        </button>
      </div>

      {/* Messages */}
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
        {messages.map((msg) => (
          <div key={msg.id} className={`group flex flex-col ${msg.direction === "sortant" ? "items-end" : "items-start"}`}>
            {/* Étiquette expéditeur pour messages entrants */}
            {msg.direction === "entrant" && (
              <div className="flex items-center gap-1.5 mb-1 ml-1">
                <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-emerald-700">{clientPrenom[0]?.toUpperCase()}</span>
                </div>
                <span className="text-xs font-medium text-gray-500">{clientPrenom}</span>
              </div>
            )}

            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
              msg.direction === "sortant"
                ? msg.brouillon
                  ? "bg-amber-50 border border-amber-200"
                  : msg.envoye
                    ? "bg-[#1F4E79] text-white"
                    : "bg-gray-100 border border-gray-300"
                : "bg-emerald-50 border border-emerald-100"
            }`}>
              {msg.brouillon && (
                <span className="text-xs text-amber-600 font-medium block mb-1">Brouillon</span>
              )}
              {msg.direction === "sortant" && !msg.brouillon && !msg.envoye && (
                <span className="text-xs text-gray-500 font-medium block mb-1">Non envoyé</span>
              )}
              <div
                className={`text-sm prose prose-sm max-w-none ${msg.direction === "sortant" && msg.envoye ? "prose-invert" : ""}`}
                dangerouslySetInnerHTML={{ __html: msg.contenu }}
              />
              {(msg.attachments ?? []).length > 0 && (
                <div className="mt-2 space-y-1 border-t border-white/20 pt-2">
                  {(msg.attachments ?? []).map((att) => (
                    <a
                      key={att.id}
                      href={att.chemin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-1.5 text-xs rounded-lg px-2 py-1 ${
                        msg.direction === "sortant" && msg.envoye
                          ? "bg-white/10 text-blue-100 hover:bg-white/20"
                          : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <Download className="w-3 h-3 shrink-0" />
                      <span className="max-w-[160px] truncate">{att.nom}</span>
                      <span className="opacity-60">({Math.round(att.taille / 1024)} Ko)</span>
                    </a>
                  ))}
                </div>
              )}
              <div className={`flex items-center gap-2 mt-2 text-xs ${msg.direction === "sortant" && msg.envoye ? "text-blue-200" : "text-gray-400"}`}>
                <span>
                  {new Date(msg.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </span>
                {msg.direction === "sortant" && msg.envoye && <span>• Envoyé ✓</span>}
              </div>
            </div>

            {/* Bouton Renvoyer sous les messages non envoyés */}
            {msg.direction === "sortant" && !msg.brouillon && !msg.envoye && (
              <button
                onClick={() => resend(msg.id)}
                disabled={resending === msg.id}
                className="mt-1 mr-1 inline-flex items-center gap-1 text-xs text-gray-500 hover:text-[#1F4E79] font-medium px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
              >
                <RotateCcw className="w-3 h-3" />
                {resending === msg.id ? "Envoi…" : "Renvoyer"}
              </button>
            )}
            {/* Bouton Supprimer — visible au survol */}
            <button
              onClick={() => deleteMessage(msg.id)}
              className="mt-0.5 opacity-0 group-hover:opacity-100 inline-flex items-center gap-1 text-xs text-gray-400 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 transition-all"
              title="Supprimer ce message"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Feedback vérification */}
      {fetchResult && (
        <div className={`text-sm text-center px-4 py-2 rounded-lg ${fetchResult.startsWith("Erreur") ? "bg-red-50 text-red-600" : fetchResult.startsWith("Aucune") ? "bg-gray-50 text-gray-500" : "bg-emerald-50 text-emerald-700 font-medium"}`}>
          {fetchResult}
        </div>
      )}

      {/* Actions bar */}
      {!replying && (
        <div className="flex gap-2">
          <button
            onClick={() => setReplying(true)}
            className="flex-1 inline-flex items-center justify-center gap-2 text-sm text-[#1F4E79] hover:bg-blue-50 font-medium px-4 py-2.5 rounded-xl border border-[#1F4E79] transition-colors"
          >
            <Send className="w-4 h-4" /> Répondre
          </button>
          <button
            onClick={checkReplies}
            disabled={fetching}
            className="flex-1 inline-flex items-center justify-center gap-2 text-sm text-emerald-700 hover:bg-emerald-50 font-medium px-4 py-2.5 rounded-xl border border-emerald-300 transition-colors disabled:opacity-50"
          >
            <RotateCcw className={`w-4 h-4 ${fetching ? "animate-spin" : ""}`} />
            {fetching ? "Vérification…" : "Vérifier les réponses"}
          </button>
        </div>
      )}

      {replying && (
        <ComposeForm
          clientId={clientId} clientEmail={clientEmail} orgEmail={orgEmail}
          convId={conv.id} defaultSubject={conv.sujet} catalogueUrl={catalogueUrl}
          formations={formations}
          onSent={() => { reload(); setReplying(false); }} onCancel={() => setReplying(false)}
        />
      )}
    </div>
  );
}

// ─── Conversations Tab ────────────────────────────────────────────────────────
function ConversationsTab({ clientId, clientEmail, orgEmail, clientPrenom, formations }: {
  clientId: string; clientEmail: string; orgEmail: string; clientPrenom: string;
  formations?: { intitule: string; numero: string }[];
}) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [composing, setComposing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [catalogueUrl, setCatalogueUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    fetch(`/api/clients/${clientId}/conversations`)
      .then((r) => r.json()).then((data) => { setConversations(data); setLoading(false); });
    fetch("/api/conversations/sync")
      .then((r) => r.json()).then((d) => setLastSync(d.lastSync ?? null));
    fetch("/api/parametres")
      .then((r) => r.json()).then((d: Record<string, string>) => {
        if (d.org_doc_catalogue_url) setCatalogueUrl(d.org_doc_catalogue_url);
      });
  }, [clientId]);

  async function syncAll() {
    setSyncing(true); setSyncMsg(null);
    try {
      const res = await fetch("/api/conversations/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setSyncMsg(`Erreur : ${data.error}`); return; }
      if (data.imported > 0) {
        // Recharger les conversations
        fetch(`/api/clients/${clientId}/conversations`)
          .then((r) => r.json()).then(setConversations);
        setSyncMsg(`${data.imported} nouvelle${data.imported > 1 ? "s" : ""} réponse${data.imported > 1 ? "s" : ""}`);
      } else {
        setSyncMsg("Aucune nouvelle réponse");
      }
      setLastSync(data.syncedAt ?? new Date().toISOString());
    } catch { setSyncMsg("Erreur réseau"); }
    finally { setSyncing(false); setTimeout(() => setSyncMsg(null), 4000); }
  }

  async function cleanupMails() {
    setCleaning(true); setSyncMsg(null);
    try {
      const res = await fetch("/api/conversations/cleanup", { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setSyncMsg(`Erreur : ${data.error}`); return; }
      if (data.total > 0) {
        fetch(`/api/clients/${clientId}/conversations`)
          .then((r) => r.json()).then(setConversations);
        const parts = [];
        if (data.deletedDuplicates > 0) parts.push(`${data.deletedDuplicates} doublon${data.deletedDuplicates > 1 ? "s" : ""}`);
        if (data.deletedWrongRecipient > 0) parts.push(`${data.deletedWrongRecipient} mauvais destinataire${data.deletedWrongRecipient > 1 ? "s" : ""}`);
        setSyncMsg(`Nettoyé : ${parts.join(", ")}`);
      } else {
        setSyncMsg("Aucun mail à nettoyer");
      }
    } catch { setSyncMsg("Erreur réseau"); }
    finally { setCleaning(false); setTimeout(() => setSyncMsg(null), 5000); }
  }

  function handleNewConv(conv: Conversation) {
    setConversations((p) => [conv, ...p]);
    setSelected(conv);
    setComposing(false);
  }

  function updateConv(updated: Conversation) {
    setConversations((p) => p.map((c) => (c.id === updated.id ? updated : c)));
    setSelected(updated);
  }

  if (selected) {
    return (
      <ThreadView
        conv={selected} clientId={clientId} clientEmail={clientEmail} orgEmail={orgEmail}
        clientPrenom={clientPrenom} catalogueUrl={catalogueUrl} formations={formations}
        onBack={() => setSelected(null)} onUpdate={updateConv}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-gray-500">{conversations.length} conversation{conversations.length !== 1 ? "s" : ""}</p>
          {lastSync && (
            <p className="text-xs text-gray-400 mt-0.5">
              Dernière synchro : {new Date(lastSync).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={cleanupMails}
            disabled={cleaning}
            title="Supprime les doublons et les mails mal attribués"
            className="inline-flex items-center gap-1.5 text-sm text-red-600 hover:bg-red-50 font-medium px-3 py-2 rounded-lg border border-red-200 transition-colors disabled:opacity-50"
          >
            <Trash2 className={`w-3.5 h-3.5 ${cleaning ? "animate-pulse" : ""}`} />
            {cleaning ? "Nettoyage…" : "Nettoyer"}
          </button>
          <button
            onClick={syncAll}
            disabled={syncing}
            title="Vérifie les réponses reçues pour tous les clients"
            className="inline-flex items-center gap-1.5 text-sm text-emerald-700 hover:bg-emerald-50 font-medium px-3 py-2 rounded-lg border border-emerald-300 transition-colors disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Synchro…" : "Sync"}
          </button>
          <button
            onClick={() => setComposing((p) => !p)}
            className="inline-flex items-center gap-2 bg-[#1F4E79] hover:bg-[#163a5a] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" /> Nouveau mail
          </button>
        </div>
      </div>
      {syncMsg && (
        <div className={`text-sm text-center px-4 py-2 rounded-lg ${syncMsg.startsWith("Erreur") ? "bg-red-50 text-red-600" : syncMsg.startsWith("Aucune") ? "bg-gray-50 text-gray-500" : "bg-emerald-50 text-emerald-700 font-medium"}`}>
          {syncMsg}
        </div>
      )}

      {composing && (
        <ComposeForm
          clientId={clientId} clientEmail={clientEmail} orgEmail={orgEmail}
          catalogueUrl={catalogueUrl} formations={formations}
          onSent={(conv) => conv && handleNewConv(conv)} onCancel={() => setComposing(false)}
        />
      )}

      {loading ? (
        <div className="py-10 text-center text-gray-400 text-sm">Chargement…</div>
      ) : conversations.length === 0 ? (
        <div className="py-12 text-center text-gray-400 text-sm">
          <Inbox className="w-8 h-8 mx-auto mb-2 opacity-30" />
          Aucune conversation avec ce client.<br />
          <span className="text-xs">Composez un nouveau mail pour démarrer.</span>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {conversations.map((conv) => {
            const last = conv.messages?.[0];
            const unread = conv._count?.messages ?? 0;
            return (
              <button
                key={conv.id}
                onClick={() => setSelected(conv)}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors text-left group"
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${conv.statut === "ouvert" ? "bg-blue-50" : "bg-gray-100"}`}>
                  <MessageSquare className={`w-4 h-4 ${conv.statut === "ouvert" ? "text-blue-600" : "text-gray-400"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm truncate ${unread > 0 ? "font-semibold text-gray-900" : "font-medium text-gray-700"}`}>
                      {conv.sujet}
                    </span>
                    {unread > 0 && (
                      <span className="flex-shrink-0 text-xs bg-blue-600 text-white rounded-full px-1.5 py-0.5 font-medium">{unread}</span>
                    )}
                  </div>
                  {last && (
                    <p className="text-xs text-gray-400 truncate mt-0.5">
                      {last.direction === "sortant" ? "Vous : " : ""}
                      {last.contenu.replace(/<[^>]+>/g, " ").trim().slice(0, 80)}
                    </p>
                  )}
                </div>
                <div className="flex-shrink-0 flex items-center gap-2 text-right">
                  <div>
                    <p className="text-xs text-gray-400">
                      {new Date(conv.updatedAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                    </p>
                    <span className={`text-xs font-medium ${conv.statut === "ouvert" ? "text-emerald-600" : "text-gray-400"}`}>
                      {conv.statut === "ouvert" ? "Ouvert" : "Fermé"}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Pipeline statuts ─────────────────────────────────────────────────────────
const PIPELINE_STATUTS = [
  { value: "nouveau",      label: "Nouveau",       color: "bg-gray-100 text-gray-700 border-gray-300" },
  { value: "contacte",     label: "Contacté",      color: "bg-blue-100 text-blue-700 border-blue-300" },
  { value: "repondu",      label: "Répondu",       color: "bg-indigo-100 text-indigo-700 border-indigo-300" },
  { value: "qualifie",     label: "Qualifié",      color: "bg-amber-100 text-amber-700 border-amber-300" },
  { value: "inscrit",      label: "Inscrit",       color: "bg-green-100 text-green-700 border-green-300" },
  { value: "disqualifie",  label: "Disqualifié",   color: "bg-red-100 text-red-700 border-red-300" },
] as const;

// ─── Main Component ───────────────────────────────────────────────────────────
type ClientTab = "informations" | "dossiers" | "notes" | "conversations";

export default function ClientDetail({ client, orgEmail }: { client: Client; orgEmail: string }) {
  const [tab, setTab] = useState<ClientTab>("informations");
  const [leadStatut, setLeadStatut] = useState(client.lead?.statut ?? "nouveau");
  const [leadId, setLeadId] = useState<string | null>(client.lead?.id ?? null);
  const [showPipelineMenu, setShowPipelineMenu] = useState(false);
  const [savingStatut, setSavingStatut] = useState(false);

  const closePipelineMenu = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest("[data-pipeline-menu]")) setShowPipelineMenu(false);
  }, []);

  useEffect(() => {
    if (showPipelineMenu) document.addEventListener("mousedown", closePipelineMenu);
    else document.removeEventListener("mousedown", closePipelineMenu);
    return () => document.removeEventListener("mousedown", closePipelineMenu);
  }, [showPipelineMenu, closePipelineMenu]);

  async function handleLeadStatutChange(newStatut: string) {
    setSavingStatut(true);
    setShowPipelineMenu(false);
    try {
      if (leadId) {
        // Lead existant : simple PATCH
        const res = await fetch(`/api/leads/${leadId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ statut: newStatut }),
        });
        if (res.ok) setLeadStatut(newStatut);
      } else {
        // Pas de lead : on en crée un lié au client
        const res = await fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nomEntreprise: client.nomCommercial || `${client.prenom} ${client.nom}`,
            nomDirigeant: client.nom,
            prenomDirigeant: client.prenom,
            siret: client.siret || null,
            telephone: client.telephone || null,
            email: client.email || null,
            adresse: client.adresse || null,
            codePostal: client.codePostal || null,
            ville: client.ville || null,
            statut: newStatut,
            clientId: client.id,
          }),
        });
        if (res.ok) {
          const lead = await res.json();
          setLeadId(lead.id);
          setLeadStatut(newStatut);
        }
      }
    } finally {
      setSavingStatut(false);
    }
  }

  const tabs: { key: ClientTab; label: string; icon: React.ElementType }[] = [
    { key: "informations", label: "Informations", icon: User },
    { key: "dossiers", label: `Dossiers (${client.dossiers.length})`, icon: FileText },
    { key: "notes", label: "Notes", icon: StickyNote },
    { key: "conversations", label: "Conversations", icon: MessageSquare },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/clients" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">{client.prenom} {client.nom}</h1>
            {(() => {
              const current = PIPELINE_STATUTS.find(s => s.value === leadStatut);
              return (
                <div className="relative" data-pipeline-menu>
                  <button
                    onClick={() => setShowPipelineMenu(p => !p)}
                    disabled={savingStatut}
                    className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border transition-colors disabled:opacity-50 ${current?.color ?? "bg-gray-100 text-gray-700 border-gray-300"}`}
                  >
                    {savingStatut ? "..." : `Pipeline : ${current?.label ?? "Non suivi"}`}
                    <span className="opacity-60">▾</span>
                  </button>
                  {showPipelineMenu && (
                    <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[160px]">
                      {PIPELINE_STATUTS.map(s => (
                        <button
                          key={s.value}
                          onClick={() => s.value !== leadStatut && handleLeadStatutChange(s.value)}
                          className={`w-full text-left px-3 py-2 text-xs font-medium hover:bg-gray-50 flex items-center gap-2 ${s.value === leadStatut ? "opacity-40 cursor-default" : ""}`}
                        >
                          <span className={`w-2 h-2 rounded-full border ${s.color}`} />
                          {s.label}
                          {s.value === leadStatut && <Check className="w-3 h-3 ml-auto" />}
                        </button>
                      ))}
                      {leadId && (
                        <div className="border-t border-gray-100 mt-1 pt-1">
                          <Link
                            href={`/leads/${leadId}`}
                            className="w-full text-left px-3 py-2 text-xs text-blue-600 hover:bg-blue-50 flex items-center gap-2"
                            onClick={() => setShowPipelineMenu(false)}
                          >
                            Voir fiche prospect →
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            {client.statutJuridique}
            {client.siret ? ` · SIRET ${client.siret}` : ""}
          </p>
        </div>
        <Link
          href={`/dossiers/nouveau?clientId=${client.id}`}
          className="inline-flex items-center gap-2 bg-[#1F4E79] hover:bg-[#163a5a] text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> Nouveau dossier
        </Link>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 flex gap-0">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? "border-[#1F4E79] text-[#1F4E79]"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "informations" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Identité</h2>
            <InfoItem icon={User} label="Nom complet" value={`${client.prenom} ${client.nom}`} />
            <InfoItem icon={Building2} label="Statut juridique" value={client.statutJuridique} />
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Entreprise</h2>
            <InfoItem icon={Building2} label="SIRET" value={client.siret} />
            <InfoItem icon={Building2} label="Code APE" value={client.codeApe} />
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Contact</h2>
            <InfoItem icon={Mail} label="Email" value={client.email} />
            <InfoItem icon={Phone} label="Téléphone" value={client.telephone} />
            <InfoItem icon={MapPin} label="Adresse"
              value={[client.adresse, client.codePostal, client.ville].filter(Boolean).join(", ") || undefined} />
          </div>
        </div>
      )}

      {tab === "dossiers" && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">Dossiers AGEFICE</h2>
              <p className="text-xs text-gray-400 mt-0.5">{client.dossiers.length} dossier{client.dossiers.length !== 1 ? "s" : ""}</p>
            </div>
            <Link href={`/dossiers/nouveau?clientId=${client.id}`}
              className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium">
              <Plus className="w-4 h-4" /> Nouveau dossier
            </Link>
          </div>
          {client.dossiers.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-gray-400 text-sm">Aucun dossier pour ce client</p>
              <Link href={`/dossiers/nouveau?clientId=${client.id}`}
                className="inline-block mt-2 text-sm text-blue-600 hover:underline">Créer un dossier</Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-100">
                    <th className="px-4 py-3">N° Dossier</th>
                    <th className="px-4 py-3">Formation</th>
                    <th className="px-4 py-3">Date début</th>
                    <th className="px-4 py-3">Date limite dépôt</th>
                    <th className="px-4 py-3">Jours restants</th>
                    <th className="px-4 py-3">Montant TTC</th>
                    <th className="px-4 py-3">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {client.dossiers.map((dossier) => {
                    const jours = dossier.dateLimiteDepot ? joursRestants(new Date(dossier.dateLimiteDepot)) : null;
                    return (
                      <tr key={dossier.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm font-mono text-blue-700">
                          <Link href={`/dossiers/${dossier.id}`} className="hover:underline">{dossier.numero}</Link>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-800 max-w-xs truncate">{dossier.formation?.intitule ?? "—"}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{dossier.dateDebut ? formatDate(new Date(dossier.dateDebut)) : "—"}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{dossier.dateLimiteDepot ? formatDate(new Date(dossier.dateLimiteDepot)) : "—"}</td>
                        <td className="px-4 py-3 text-sm font-medium">
                          {jours !== null ? (
                            <span className={getUrgenceColor(jours)}>{jours < 0 ? `Expiré (${Math.abs(jours)}j)` : `${jours}j`}</span>
                          ) : "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 font-medium">{dossier.montantTTC != null ? formatMontant(dossier.montantTTC) : "—"}</td>
                        <td className="px-4 py-3"><StatutBadge statut={dossier.statut} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "notes" && <NotesTab clientId={client.id} />}

      {tab === "conversations" && (
        <ConversationsTab
          clientId={client.id} clientEmail={client.email} orgEmail={orgEmail} clientPrenom={client.prenom}
          formations={client.dossiers.filter(d => d.formation).map(d => ({ intitule: d.formation!.intitule, numero: d.numero }))}
        />
      )}
    </div>
  );
}
