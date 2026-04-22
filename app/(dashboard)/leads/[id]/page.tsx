"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Sparkles, MessageSquare, Mail, Phone, Building2,
  User, Star, Send, Copy, Check, Trash2, Edit3, Save,
  Zap, Globe, CheckCircle2, XCircle, Loader2, UserPlus, ExternalLink,
} from "lucide-react";
import Link from "next/link";

// ─── Types ─────────────────────────────────────────────────────────────────
interface Lead {
  id: string;
  nomEntreprise: string;
  siret?: string | null;
  siren?: string | null;
  codeApe?: string | null;
  secteurActivite?: string | null;
  chiffreAffaires?: number | null;
  effectif?: number | null;
  adresse?: string | null;
  codePostal?: string | null;
  ville?: string | null;
  nomDirigeant: string;
  prenomDirigeant?: string | null;
  telephone?: string | null;
  email?: string | null;
  siteWeb?: string | null;
  descriptionEnjeux?: string | null;
  messagePrepare?: string | null;
  statut: string;
  canalContact?: string | null;
  dateContact?: string | null;
  scoreLead?: number | null;
  feedbackHumain?: string | null;
  sourceDonnee?: string | null;
  dateDecouverte: string;
  clientId?: string | null;
}

interface EnrichResult {
  trouve: boolean;
  champs: string[];
  sources: string[];
}

// ─── Statuts ──────────────────────────────────────────────────────────────
const STATUTS: Record<string, { label: string; bg: string; text: string }> = {
  nouveau:     { label: "Nouveau",     bg: "bg-blue-100",   text: "text-blue-800"   },
  contacte:    { label: "Contacté",    bg: "bg-yellow-100", text: "text-yellow-800" },
  repondu:     { label: "A répondu",   bg: "bg-purple-100", text: "text-purple-800" },
  qualifie:    { label: "Qualifié ✓",  bg: "bg-green-100",  text: "text-green-800"  },
  disqualifie: { label: "Disqualifié", bg: "bg-red-100",    text: "text-red-800"    },
};

// ─── Page ──────────────────────────────────────────────────────────────────
export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [lead, setLead]                   = useState<Lead | null>(null);
  const [loading, setLoading]             = useState(true);
  const [generatingMsg, setGeneratingMsg] = useState(false);
  const [enrichissant, setEnrichissant]   = useState(false);
  const [enrichResult, setEnrichResult]   = useState<EnrichResult | null>(null);
  const [editingMsg, setEditingMsg]       = useState(false);
  const [editingFeedback, setEditingFeedback] = useState(false);
  const [msgDraft, setMsgDraft]           = useState("");
  const [feedbackDraft, setFeedbackDraft] = useState("");
  const [copied, setCopied]               = useState(false);
  const [saving, setSaving]               = useState(false);
  const [converting, setConverting]       = useState(false);

  useEffect(() => {
    fetch(`/api/leads/${id}`)
      .then((r) => r.json())
      .then((d) => { setLead(d); setMsgDraft(d.messagePrepare || ""); setFeedbackDraft(d.feedbackHumain || ""); })
      .finally(() => setLoading(false));
  }, [id]);

  async function enrichir() {
    setEnrichissant(true);
    setEnrichResult(null);
    const res = await fetch(`/api/leads/${id}/enrichir`, { method: "POST" });
    const data = await res.json();
    if (data.lead) setLead(data.lead);
    setEnrichResult({ trouve: data.trouve, champs: data.champs || [], sources: data.sources || [] });
    setEnrichissant(false);
  }

  async function genererMessage() {
    setGeneratingMsg(true);
    const res = await fetch(`/api/leads/${id}/message`, { method: "POST" });
    const data = await res.json();
    setLead((prev) => prev ? { ...prev, messagePrepare: data.message, descriptionEnjeux: data.lead?.descriptionEnjeux } : prev);
    setMsgDraft(data.message || "");
    setGeneratingMsg(false);
  }

  async function sauvegarderMessage() {
    setSaving(true);
    await fetch(`/api/leads/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messagePrepare: msgDraft }) });
    setLead((prev) => prev ? { ...prev, messagePrepare: msgDraft } : prev);
    setEditingMsg(false);
    setSaving(false);
  }

  async function updateField(updates: Partial<Lead>) {
    await fetch(`/api/leads/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updates) });
    setLead((prev) => prev ? { ...prev, ...updates } : prev);
  }

  async function saveFeedback() {
    await updateField({ feedbackHumain: feedbackDraft });
    setEditingFeedback(false);
  }

  async function convertirEnClient() {
    setConverting(true);
    const res = await fetch(`/api/leads/${id}/convertir`, { method: "POST" });
    const data = await res.json();
    if (data.clientId) {
      setLead((prev) => prev ? { ...prev, clientId: data.clientId, statut: "qualifie" } : prev);
    }
    setConverting(false);
  }

  async function deleteLead() {
    if (!confirm("Supprimer ce lead définitivement ?")) return;
    await fetch(`/api/leads/${id}`, { method: "DELETE" });
    router.push("/leads");
  }

  function copyMessage() {
    navigator.clipboard.writeText(msgDraft || lead?.messagePrepare || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function genererLienWhatsApp(): string {
    if (!lead?.telephone) return "#";
    const tel = lead.telephone.replace(/[^0-9+]/g, "");
    const intl = tel.startsWith("0") ? "+262" + tel.slice(1) : tel;
    return `https://api.whatsapp.com/send?phone=${intl}&text=${encodeURIComponent(msgDraft || lead.messagePrepare || "")}`;
  }

  // ── Scorecard enrichissement ─────────────────────────────────────────────
  function EnrichBadge() {
    if (!lead) return null;
    const has = { tel: !!lead.telephone, email: !!lead.email, site: !!lead.siteWeb, prenom: !!lead.prenomDirigeant && lead.nomDirigeant !== "Dirigeant" };
    const count = Object.values(has).filter(Boolean).length;
    const color = count >= 3 ? "green" : count >= 2 ? "yellow" : count >= 1 ? "orange" : "red";
    const colors: Record<string, string> = { green: "bg-green-100 text-green-800", yellow: "bg-yellow-100 text-yellow-800", orange: "bg-orange-100 text-orange-800", red: "bg-red-100 text-red-800" };
    return (
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors[color]}`}>
        {count}/4 données
      </span>
    );
  }

  if (loading) return <div className="p-8 text-center text-gray-400 text-sm">Chargement…</div>;
  if (!lead)   return <div className="p-8 text-center text-gray-500">Lead introuvable.</div>;

  const nomComplet = [lead.prenomDirigeant, lead.nomDirigeant].filter(Boolean).join(" ");
  const s = STATUTS[lead.statut] || STATUTS.nouveau;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/leads" className="text-gray-400 hover:text-gray-700 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{lead.nomEntreprise}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-sm text-gray-500">{nomComplet}</p>
              <EnrichBadge />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>{s.label}</span>
          {lead.clientId ? (
            <Link href={`/clients/${lead.clientId}`}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium transition-colors">
              <ExternalLink className="w-3.5 h-3.5" />
              Voir la fiche client
            </Link>
          ) : (
            <button onClick={convertirEnClient} disabled={converting}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1F4E79] hover:bg-[#2E75B6] text-white rounded-lg text-xs font-medium disabled:opacity-60 transition-colors">
              {converting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
              {converting ? "Conversion…" : "Convertir en client"}
            </button>
          )}
          <button onClick={deleteLead} className="p-2 text-gray-400 hover:text-red-600 transition-colors" title="Supprimer">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* ── Colonne gauche ─────────────────────────────────────────────── */}
        <div className="col-span-1 space-y-4">

          {/* Entreprise */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5" /> Entreprise
            </h2>
            <p className="font-medium text-gray-900 text-sm">{lead.nomEntreprise}</p>
            {lead.secteurActivite && <p className="text-gray-600 text-sm">{lead.secteurActivite}</p>}
            {lead.codeApe && <p className="text-xs text-gray-400">APE: {lead.codeApe}</p>}
            {lead.siret && <p className="text-xs text-gray-400">SIRET: {lead.siret}</p>}
            {lead.effectif && <p className="text-sm text-gray-600">{lead.effectif} employés</p>}
            {lead.chiffreAffaires && <p className="text-sm text-gray-600">CA: {(lead.chiffreAffaires / 1000).toFixed(0)}K€</p>}
            {(lead.adresse || lead.ville) && (
              <p className="text-xs text-gray-500">{[lead.adresse, lead.codePostal, lead.ville].filter(Boolean).join(", ")}</p>
            )}
          </div>

          {/* Décideur + Enrichissement */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <User className="w-3.5 h-3.5" /> Décideur
              </h2>
              {/* Bouton Enrichir */}
              <button
                onClick={enrichir}
                disabled={enrichissant}
                title="Rechercher automatiquement tél, email et site"
                className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 text-white hover:opacity-90 disabled:opacity-60 transition-all shadow-sm"
              >
                {enrichissant
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Zap className="w-3.5 h-3.5" />}
                {enrichissant ? "Recherche…" : "Enrichir"}
              </button>
            </div>

            {/* Résultat enrichissement */}
            {enrichResult && (
              <div className={`rounded-lg p-2.5 text-xs ${enrichResult.trouve ? "bg-green-50 border border-green-200" : "bg-gray-50 border border-gray-200"}`}>
                {enrichResult.trouve ? (
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-green-800">
                        {enrichResult.champs.length} donnée{enrichResult.champs.length > 1 ? "s" : ""} trouvée{enrichResult.champs.length > 1 ? "s" : ""}
                      </p>
                      <p className="text-green-700 mt-0.5">{enrichResult.sources.join(" · ")}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <XCircle className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <p className="text-gray-500">Aucune donnée supplémentaire trouvée</p>
                  </div>
                )}
              </div>
            )}

            <p className="font-medium text-gray-900 text-sm">{nomComplet}</p>

            {/* Téléphone */}
            <div>
              <label className="text-xs text-gray-400">Téléphone pro</label>
              <div className="flex items-center gap-2 mt-1">
                <input type="tel"
                  defaultValue={lead.telephone || ""}
                  onBlur={(e) => updateField({ telephone: e.target.value || null })}
                  placeholder="+262 6 92 XX XX XX"
                  className="flex-1 text-sm border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
                {lead.telephone && (
                  <a href={`tel:${lead.telephone}`} className="text-blue-600 flex-shrink-0">
                    <Phone className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-xs text-gray-400">Email professionnel</label>
              <div className="flex items-center gap-2 mt-1">
                <input type="email"
                  defaultValue={lead.email || ""}
                  onBlur={(e) => updateField({ email: e.target.value || null })}
                  placeholder="prenom.nom@entreprise.re"
                  className="flex-1 text-sm border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
                {lead.email && (
                  <a href={`mailto:${lead.email}`} className="text-blue-600 flex-shrink-0">
                    <Mail className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>

            {/* Site web */}
            <div>
              <label className="text-xs text-gray-400">Site web</label>
              <div className="flex items-center gap-2 mt-1">
                <input type="url"
                  defaultValue={lead.siteWeb || ""}
                  onBlur={(e) => updateField({ siteWeb: e.target.value || null })}
                  placeholder="https://www.entreprise.re"
                  className="flex-1 text-sm border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
                {lead.siteWeb && (
                  <a href={lead.siteWeb} target="_blank" rel="noopener noreferrer" className="text-blue-600 flex-shrink-0">
                    <Globe className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Suivi */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Suivi</h2>
            <div>
              <label className="text-xs text-gray-400">Statut</label>
              <select value={lead.statut} onChange={(e) => updateField({ statut: e.target.value })}
                className="w-full mt-1 text-sm border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400">
                {Object.entries(STATUTS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400">Canal de contact</label>
              <select value={lead.canalContact || ""} onChange={(e) => updateField({ canalContact: e.target.value || null })}
                className="w-full mt-1 text-sm border border-gray-200 rounded px-2 py-1.5 focus:outline-none">
                <option value="">—</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="email">Email</option>
                <option value="telephone">Téléphone</option>
              </select>
            </div>
          </div>

          {/* Feedback */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <Star className="w-3.5 h-3.5" /> Feedback humain
            </h2>
            <div>
              <label className="text-xs text-gray-400">Qualité du lead</label>
              <div className="flex gap-1 mt-1.5">
                {[1,2,3,4,5].map((i) => (
                  <button key={i} onClick={() => updateField({ scoreLead: i })}
                    className={`w-6 h-6 transition-colors ${(lead.scoreLead||0)>=i ? "text-amber-400":"text-gray-300"} hover:text-amber-400`}>
                    <Star className="w-full h-full fill-current" />
                  </button>
                ))}
                {lead.scoreLead && <span className="ml-2 text-xs text-gray-500 self-center">{lead.scoreLead}/5</span>}
              </div>
            </div>
            {editingFeedback ? (
              <div className="space-y-2">
                <textarea value={feedbackDraft} onChange={(e) => setFeedbackDraft(e.target.value)}
                  rows={3} autoFocus
                  className="w-full text-sm border border-blue-400 rounded px-2 py-1.5 focus:outline-none resize-none"
                  placeholder="Vos notes sur ce lead…" />
                <div className="flex gap-2">
                  <button onClick={saveFeedback}
                    className="flex items-center gap-1 text-xs text-white bg-blue-600 rounded px-3 py-1.5 hover:bg-blue-700">
                    <Save className="w-3 h-3" /> Sauvegarder
                  </button>
                  <button onClick={() => setEditingFeedback(false)} className="text-xs text-gray-500 hover:text-gray-700">Annuler</button>
                </div>
              </div>
            ) : (
              <button onClick={() => { setFeedbackDraft(lead.feedbackHumain||""); setEditingFeedback(true); }}
                className="w-full text-left text-sm text-gray-500 italic hover:text-blue-600 transition-colors">
                {lead.feedbackHumain || "Ajouter des notes…"}
              </button>
            )}
          </div>
        </div>

        {/* ── Colonne droite ──────────────────────────────────────────────── */}
        <div className="col-span-2 space-y-4">

          {/* Enjeux business */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" /> Enjeux business identifiés
            </h2>
            {lead.descriptionEnjeux
              ? <p className="text-sm text-gray-700 leading-relaxed">{lead.descriptionEnjeux}</p>
              : <p className="text-sm text-gray-400 italic">Cliquez sur &ldquo;Générer le message&rdquo; pour analyser les enjeux.</p>
            }
          </div>

          {/* Message de prospection */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-600" /> Message de prospection
              </h2>
              <div className="flex gap-2">
                {(msgDraft || lead.messagePrepare) && (
                  <>
                    <button onClick={copyMessage}
                      className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 border border-gray-200 rounded px-2.5 py-1.5 transition-colors">
                      {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? "Copié !" : "Copier"}
                    </button>
                    {!editingMsg && (
                      <button onClick={() => { setMsgDraft(lead.messagePrepare||""); setEditingMsg(true); }}
                        className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 border border-gray-200 rounded px-2.5 py-1.5">
                        <Edit3 className="w-3.5 h-3.5" /> Modifier
                      </button>
                    )}
                  </>
                )}
                <button onClick={genererMessage} disabled={generatingMsg}
                  className="flex items-center gap-1.5 text-xs text-white bg-[#1F4E79] hover:bg-[#2E75B6] rounded px-3 py-1.5 font-medium disabled:opacity-60 transition-colors">
                  <Sparkles className="w-3.5 h-3.5" />
                  {generatingMsg ? "Génération…" : lead.messagePrepare ? "Régénérer" : "Générer le message"}
                </button>
              </div>
            </div>

            {editingMsg ? (
              <div className="space-y-2">
                <textarea value={msgDraft} onChange={(e) => setMsgDraft(e.target.value)} rows={12}
                  className="w-full text-sm border border-blue-400 rounded-lg px-3 py-2.5 focus:outline-none resize-none font-mono leading-relaxed" />
                <div className="flex gap-2">
                  <button onClick={sauvegarderMessage} disabled={saving}
                    className="flex items-center gap-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded px-3 py-1.5 font-medium disabled:opacity-60">
                    <Save className="w-3 h-3" /> {saving ? "Sauvegarde…" : "Sauvegarder"}
                  </button>
                  <button onClick={() => setEditingMsg(false)} className="text-xs text-gray-500 hover:text-gray-700">Annuler</button>
                </div>
              </div>
            ) : lead.messagePrepare ? (
              <pre className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed font-sans bg-gray-50 rounded-lg p-4 border border-gray-100">
                {lead.messagePrepare}
              </pre>
            ) : (
              <div className="bg-gray-50 rounded-lg p-6 text-center border border-dashed border-gray-200">
                <Sparkles className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Aucun message généré.</p>
                <p className="text-xs text-gray-400 mt-1">Cliquez sur &ldquo;Générer le message&rdquo; pour créer un message personnalisé.</p>
              </div>
            )}

            {/* Boutons d'envoi */}
            {(lead.messagePrepare || msgDraft) && (
              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <a href={genererLienWhatsApp()} target="_blank" rel="noopener noreferrer"
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    lead.telephone ? "bg-green-600 hover:bg-green-700 text-white" : "bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none"
                  }`}
                  onClick={() => { if (lead.telephone) updateField({ statut: "contacte", canalContact: "whatsapp" }); }}>
                  <MessageSquare className="w-4 h-4" />
                  Envoyer WhatsApp
                  {!lead.telephone && <span className="text-xs ml-1">(enrichir d&apos;abord)</span>}
                </a>
                <a href={lead.email ? `mailto:${lead.email}?subject=${encodeURIComponent("Optimisez votre activité grâce à l'IA — AIssociate")}&body=${encodeURIComponent(msgDraft||lead.messagePrepare||"")}` : "#"}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    lead.email ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none"
                  }`}
                  onClick={() => { if (lead.email) updateField({ statut: "contacte", canalContact: "email" }); }}>
                  <Send className="w-4 h-4" />
                  Envoyer par email
                  {!lead.email && <span className="text-xs ml-1">(enrichir d&apos;abord)</span>}
                </a>
              </div>
            )}
          </div>

          {/* Cialdini recap */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-amber-800 mb-2">Principes Cialdini intégrés dans le message</h3>
            <div className="grid grid-cols-3 gap-2">
              {[
                ["Preuve sociale",  "Vos concurrents ont déjà bénéficié"],
                ["Autorité",        "Plan gouvernemental IA + 3 000€ min."],
                ["Rareté",          "Enveloppe et places limitées"],
                ["Sympathie",       "Message personnalisé par secteur"],
                ["Engagement",      "CTA simple : formulaire en 2 min"],
                ["Confiance",       "Certifié Qualiopi n°814211-1"],
              ].map(([titre, desc]) => (
                <div key={titre} className="bg-amber-100/50 rounded-lg p-2">
                  <p className="text-xs font-semibold text-amber-900">{titre}</p>
                  <p className="text-xs text-amber-700 mt-0.5">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
