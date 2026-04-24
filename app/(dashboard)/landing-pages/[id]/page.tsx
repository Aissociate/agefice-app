"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft, Plus, Trash2, CheckCircle2, BarChart2,
  Loader2, Sparkles, Eye, Columns2, Download, Users,
} from "lucide-react";
import dynamic from "next/dynamic";
import type { LandingContenu } from "@/lib/generateLandingPage";

const LandingPreview = dynamic(() => import("@/components/LandingPreview"), { ssr: false });

interface Variant {
  id: string;
  nom: string;
  angle: string | null;
  palette: string;
  contenu: string;
  actif: boolean;
  vues: number;
  conversions: number;
  dateCreation: string;
}

interface LandingPage {
  id: string;
  nom: string;
  sujet: string;
  publicCible: string | null;
  offre: string | null;
  template: string;
  statut: string;
  variants: Variant[];
}

const PALETTES = [
  { id: "bleu",   label: "Bleu"   },
  { id: "vert",   label: "Vert"   },
  { id: "violet", label: "Violet" },
  { id: "orange", label: "Orange" },
];

const ANGLES = [
  "focus sur le retour sur investissement et les résultats chiffrés",
  "focus sur la simplicité et la rapidité de mise en œuvre",
  "focus sur la transformation personnelle et la confiance",
  "focus sur la preuve sociale et les témoignages",
  "focus sur l'exclusivité et l'accès privilégié",
  "focus sur la garantie et la réduction du risque",
];

export default function LandingPageDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [page, setPage] = useState<LandingPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareId, setCompareId] = useState<string | null>(null);
  const [addingVariant, setAddingVariant] = useState(false);
  const [newAngle, setNewAngle] = useState(ANGLES[0]);
  const [newPalette, setNewPalette] = useState("bleu");
  const [generating, setGenerating] = useState(false);
  const [editStats, setEditStats] = useState<{ id: string; vues: number; conversions: number } | null>(null);

  const load = useCallback(() => {
    fetch(`/api/landing-pages/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setPage(d);
        if (d.variants?.length > 0) {
          setSelectedId((prev) => prev ?? d.variants[0].id);
          setCompareId((prev) => prev ?? (d.variants[1]?.id ?? null));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const selected = page?.variants.find((v) => v.id === selectedId);
  const compareVariant = page?.variants.find((v) => v.id === compareId);

  function parseContenu(v: Variant): LandingContenu {
    try { return JSON.parse(v.contenu); } catch { return {} as LandingContenu; }
  }

  async function setActif(variantId: string) {
    await fetch(`/api/landing-pages/${id}/variants/${variantId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actif: true }),
    });
    load();
  }

  async function deleteVariant(variantId: string) {
    if (!confirm("Supprimer cette variante ?")) return;
    await fetch(`/api/landing-pages/${id}/variants/${variantId}`, { method: "DELETE" });
    load();
    if (selectedId === variantId) setSelectedId(null);
  }

  async function generateVariant() {
    if (!page) return;
    setGenerating(true);
    try {
      const genRes = await fetch("/api/landing-pages/generer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sujet: page.sujet,
          publicCible: page.publicCible,
          offre: page.offre,
          template: page.template,
          angle: newAngle,
          palette: newPalette,
        }),
      });
      const contenu = await genRes.json();
      const letters = ["A","B","C","D","E","F"];
      const nom = letters[page.variants.length] ?? `V${page.variants.length + 1}`;
      await fetch(`/api/landing-pages/${id}/variants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom, angle: newAngle, palette: newPalette, contenu }),
      });
      load();
      setAddingVariant(false);
    } finally {
      setGenerating(false);
    }
  }

  async function saveStats() {
    if (!editStats) return;
    await fetch(`/api/landing-pages/${id}/variants/${editStats.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vues: editStats.vues, conversions: editStats.conversions }),
    });
    setEditStats(null);
    load();
  }

  function exportHtml(variant: Variant) {
    const c = parseContenu(variant);
    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${c.headline ?? page?.nom ?? "Landing Page"}</title>
<meta name="description" content="${c.meta_description ?? ""}">
<script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-900 font-sans">
<section class="bg-gradient-to-br from-blue-900 to-blue-700 px-8 py-20 text-center text-white">
  ${c.preuve_sociale ? `<p class="inline-block bg-blue-800/60 text-blue-200 text-sm px-4 py-1 rounded-full mb-6">✦ ${c.preuve_sociale}</p>` : ""}
  <h1 class="text-5xl font-extrabold mb-4 max-w-3xl mx-auto">${c.headline ?? ""}</h1>
  <p class="text-xl mb-8 opacity-90 max-w-2xl mx-auto">${c.subheadline ?? ""}</p>
  <a href="#" class="bg-blue-500 hover:bg-blue-400 text-white font-bold px-10 py-5 rounded-xl text-lg">${c.cta_texte ?? "Commencer"}</a>
  ${c.cta_sous_texte ? `<p class="text-sm mt-3 opacity-60">${c.cta_sous_texte}</p>` : ""}
</section>
<section class="bg-gray-900 px-8 py-12 text-center">
  <p class="text-gray-300 max-w-3xl mx-auto text-lg">${c.proposition_valeur ?? ""}</p>
</section>
${c.avantages?.length ? `<section class="bg-gray-800 px-8 py-12">
  <div class="grid grid-cols-2 gap-5 max-w-3xl mx-auto">
    ${c.avantages.map(a => `<div class="bg-gray-700 rounded-xl p-5"><span class="text-2xl">${a.emoji}</span><p class="font-semibold text-white mt-2">${a.titre}</p><p class="text-gray-400 text-sm mt-1">${a.description}</p></div>`).join("")}
  </div>
</section>` : ""}
${c.temoignage?.texte ? `<section class="bg-gradient-to-r from-blue-900 to-blue-700 px-8 py-12 text-center text-white">
  <blockquote class="max-w-2xl mx-auto"><p class="text-xl italic">"${c.temoignage.texte}"</p><footer class="mt-4 font-semibold">— ${c.temoignage.nom}, ${c.temoignage.poste}</footer></blockquote>
</section>` : ""}
${c.faq?.length ? `<section class="bg-gray-900 px-8 py-12">
  <h2 class="text-center text-2xl font-bold text-blue-300 mb-8">Questions fréquentes</h2>
  <div class="max-w-2xl mx-auto space-y-4">
    ${c.faq.map(f => `<div class="bg-gray-800 rounded-xl p-5"><p class="font-semibold text-white">${f.question}</p><p class="text-gray-400 mt-2">${f.reponse}</p></div>`).join("")}
  </div>
</section>` : ""}
<section class="bg-gradient-to-br from-blue-900 to-blue-700 px-8 py-16 text-center text-white">
  ${c.urgence ? `<p class="bg-white/10 rounded-full px-4 py-2 inline-block mb-6">⏳ ${c.urgence}</p>` : ""}
  <h2 class="text-3xl font-extrabold mb-6">${c.headline ?? ""}</h2>
  <a href="#" class="bg-blue-500 hover:bg-blue-400 text-white font-bold px-10 py-5 rounded-xl text-lg">${c.cta_texte ?? "Commencer"}</a>
</section>
</body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `landing-${page?.nom ?? "page"}-variante-${variant.nom}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-gray-400">
      <Loader2 className="w-5 h-5 animate-spin mr-2" />Chargement…
    </div>
  );

  if (!page) return <div className="text-center py-20 text-gray-400">Page introuvable</div>;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/landing-pages")} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{page.nom}</h1>
            <p className="text-xs text-gray-500">{page.sujet}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCompareMode(!compareMode)}
            className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border transition-all ${compareMode ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 text-gray-600 hover:bg-gray-50"}`}
          >
            <Columns2 className="w-3.5 h-3.5" />
            Comparer A/B
          </button>
          {selected && (
            <button
              onClick={() => exportHtml(selected)}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Exporter HTML
            </button>
          )}
        </div>
      </div>

      {/* Variant tabs + stats */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-2 flex-wrap">
          {page.variants.map((v) => {
            const taux = v.vues > 0 ? ((v.conversions / v.vues) * 100).toFixed(1) + "%" : "—";
            return (
              <button
                key={v.id}
                onClick={() => { setSelectedId(v.id); if (compareMode && !compareId) setCompareId(v.id); }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                  selectedId === v.id
                    ? "bg-[#1F4E79] text-white border-[#1F4E79]"
                    : compareMode && compareId === v.id
                    ? "bg-blue-100 text-blue-700 border-blue-300"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span>Variante {v.nom}</span>
                {v.actif && <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />}
                <span className="text-xs opacity-60">{taux}</span>
              </button>
            );
          })}
          <button
            onClick={() => setAddingVariant(true)}
            className="inline-flex items-center gap-1 px-3 py-2.5 rounded-lg border border-dashed border-gray-300 text-xs text-gray-400 hover:text-gray-600 hover:border-gray-400 transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Variante
          </button>
        </div>

        {/* Stats des variantes */}
        {page.variants.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-400 border-b border-gray-100">
                  <th className="text-left py-2 font-medium">Variante</th>
                  <th className="text-left py-2 font-medium">Angle</th>
                  <th className="text-right py-2 font-medium">Vues</th>
                  <th className="text-right py-2 font-medium">Conversions</th>
                  <th className="text-right py-2 font-medium">Taux</th>
                  <th className="text-right py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {page.variants.map((v) => {
                  const taux = v.vues > 0 ? ((v.conversions / v.vues) * 100).toFixed(1) + "%" : "—";
                  return (
                    <tr key={v.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2 font-semibold text-gray-800">
                        {v.nom} {v.actif && <span className="text-[9px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full ml-1">actif</span>}
                      </td>
                      <td className="py-2 text-gray-400 max-w-[200px] truncate">{v.angle ?? "—"}</td>
                      <td className="py-2 text-right text-gray-700">{v.vues}</td>
                      <td className="py-2 text-right text-gray-700">{v.conversions}</td>
                      <td className={`py-2 text-right font-semibold ${v.vues > 0 ? "text-blue-700" : "text-gray-300"}`}>{taux}</td>
                      <td className="py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setEditStats({ id: v.id, vues: v.vues, conversions: v.conversions })} className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Modifier stats">
                            <BarChart2 className="w-3.5 h-3.5" />
                          </button>
                          {!v.actif && (
                            <button onClick={() => setActif(v.id)} className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors" title="Marquer actif">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button onClick={() => exportHtml(v)} className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors" title="Exporter HTML">
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => deleteVariant(v.id)} className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors" title="Supprimer">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal stats */}
      {editStats && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Users className="w-4 h-4" />Mettre à jour les stats</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600">Vues</label>
                <input type="number" value={editStats.vues} onChange={(e) => setEditStats({ ...editStats, vues: Number(e.target.value) })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Conversions</label>
                <input type="number" value={editStats.conversions} onChange={(e) => setEditStats({ ...editStats, conversions: Number(e.target.value) })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setEditStats(null)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-600">Annuler</button>
              <button onClick={saveStats} className="flex-1 py-2 bg-[#1F4E79] text-white rounded-lg text-sm font-medium">Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {/* Ajouter variante */}
      {addingVariant && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2"><Sparkles className="w-4 h-4 text-blue-600" />Générer une nouvelle variante</h3>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1.5 block">Angle copywriting</label>
            <select value={newAngle} onChange={(e) => setNewAngle(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {ANGLES.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1.5 block">Palette</label>
            <div className="flex gap-2">
              {PALETTES.map((p) => (
                <button key={p.id} onClick={() => setNewPalette(p.id)} className={`px-3 py-1.5 text-xs rounded-lg border ${newPalette === p.id ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600"}`}>{p.label}</button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setAddingVariant(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600">Annuler</button>
            <button onClick={generateVariant} disabled={generating} className="inline-flex items-center gap-2 px-4 py-2 bg-[#1F4E79] text-white rounded-lg text-sm font-medium disabled:bg-gray-300">
              {generating ? <><Loader2 className="w-4 h-4 animate-spin" />Génération…</> : <><Sparkles className="w-4 h-4" />Générer</>}
            </button>
          </div>
        </div>
      )}

      {/* Preview(s) */}
      {compareMode && selected && compareVariant ? (
        <div className="grid grid-cols-2 gap-4">
          {[selected, compareVariant].map((v) => (
            <div key={v.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Eye className="w-4 h-4" />Variante {v.nom}
                  {v.actif && <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
                </h3>
                <div className="flex gap-1">
                  {page.variants.filter(x => x.id !== (v.id === selected.id ? compareVariant.id : selected.id)).map(x => (
                    <button key={x.id} onClick={() => v.id === selected.id ? setSelectedId(x.id) : setCompareId(x.id)} className="text-[10px] px-2 py-1 rounded border border-gray-200 text-gray-500 hover:bg-gray-50">{x.nom}</button>
                  ))}
                </div>
              </div>
              <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-900" style={{ height: 600, overflowY: "auto" }}>
                <LandingPreview contenu={parseContenu(v)} palette={v.palette} />
              </div>
            </div>
          ))}
        </div>
      ) : selected ? (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Eye className="w-4 h-4" />Prévisualisation — Variante {selected.nom}
          </h3>
          <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-900" style={{ maxHeight: 700, overflowY: "auto" }}>
            <LandingPreview contenu={parseContenu(selected)} palette={selected.palette} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
