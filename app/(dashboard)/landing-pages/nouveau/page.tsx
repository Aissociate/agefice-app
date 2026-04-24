"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Sparkles, Loader2, BookOpen, Download, Briefcase, CalendarDays } from "lucide-react";

const TEMPLATES = [
  {
    id: "formation",
    label: "Formation / Cours",
    desc: "Promouvez une formation et déclenchez des inscriptions",
    icon: BookOpen,
    color: "blue",
  },
  {
    id: "lead_magnet",
    label: "Lead Magnet",
    desc: "Offrez un contenu gratuit pour capturer des emails",
    icon: Download,
    color: "violet",
  },
  {
    id: "service",
    label: "Service B2B",
    desc: "Présentez votre offre à des décideurs d'entreprise",
    icon: Briefcase,
    color: "emerald",
  },
  {
    id: "evenement",
    label: "Événement / Webinaire",
    desc: "Remplissez vos événements et webinaires",
    icon: CalendarDays,
    color: "orange",
  },
];

const PALETTES = [
  { id: "bleu",   label: "Bleu",   cls: "bg-blue-600"   },
  { id: "vert",   label: "Vert",   cls: "bg-emerald-600" },
  { id: "violet", label: "Violet", cls: "bg-violet-600"  },
  { id: "orange", label: "Orange", cls: "bg-orange-500"  },
];

const ANGLES_A = [
  "focus sur le retour sur investissement et les résultats chiffrés",
  "focus sur la simplicité et la rapidité de mise en œuvre",
  "focus sur l'exclusivité et l'accès privilégié",
  "focus sur la communauté et le réseau",
];

const ANGLES_B = [
  "focus sur la transformation personnelle et la confiance",
  "focus sur la résolution du problème principal",
  "focus sur la preuve sociale et les témoignages",
  "focus sur la garantie et la réduction du risque",
];

export default function NouveauLandingPage() {
  const router = useRouter();

  const [template, setTemplate]       = useState("");
  const [nom, setNom]                 = useState("");
  const [sujet, setSujet]             = useState("");
  const [publicCible, setPublicCible] = useState("");
  const [offre, setOffre]             = useState("");
  const [palette, setPalette]         = useState("bleu");
  const [nbVariantes, setNbVariantes] = useState(2);
  const [generating, setGenerating]   = useState(false);
  const [error, setError]             = useState("");
  const [progress, setProgress]       = useState<string[]>([]);

  async function handleGenerate() {
    if (!template || !nom || !sujet) { setError("Choisissez un template et remplissez nom + sujet"); return; }
    setError("");
    setGenerating(true);
    setProgress([]);

    try {
      // 1. Créer la landing page
      setProgress(["Création du projet…"]);
      const pageRes = await fetch("/api/landing-pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom, sujet, publicCible, offre, template }),
      });
      if (!pageRes.ok) throw new Error("Impossible de créer le projet");
      const page = await pageRes.json();

      // 2. Générer les variantes
      const anglesA = ANGLES_A;
      const anglesB = ANGLES_B;
      const variantNames = ["A", "B", "C", "D"].slice(0, nbVariantes);

      for (let i = 0; i < variantNames.length; i++) {
        const nom_v = variantNames[i];
        const angle = i % 2 === 0
          ? anglesA[Math.floor(i / 2) % anglesA.length]
          : anglesB[Math.floor(i / 2) % anglesB.length];

        setProgress((p) => [...p, `Génération variante ${nom_v}…`]);
        const genRes = await fetch("/api/landing-pages/generer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sujet, publicCible, offre, template, angle, palette }),
        });
        if (!genRes.ok) throw new Error(`Erreur variante ${nom_v}`);
        const contenu = await genRes.json();

        await fetch(`/api/landing-pages/${page.id}/variants`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nom: nom_v, angle, palette, contenu }),
        });
      }

      setProgress((p) => [...p, "Terminé !"]);
      router.push(`/landing-pages/${page.id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur inattendue");
      setGenerating(false);
    }
  }

  const colorMap: Record<string, string> = {
    blue: "border-blue-400 bg-blue-50 text-blue-800",
    violet: "border-violet-400 bg-violet-50 text-violet-800",
    emerald: "border-emerald-400 bg-emerald-50 text-emerald-800",
    orange: "border-orange-400 bg-orange-50 text-orange-800",
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nouvelle landing page</h1>
          <p className="text-sm text-gray-500">Générez plusieurs variantes A/B en une seule fois</p>
        </div>
      </div>

      {/* Step 1 — Template */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">1. Choisissez un modèle</h2>
        <div className="grid grid-cols-2 gap-3">
          {TEMPLATES.map((t) => {
            const Icon = t.icon;
            const active = template === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTemplate(t.id)}
                className={`text-left p-4 rounded-xl border-2 transition-all ${
                  active ? colorMap[t.color] : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <Icon className={`w-5 h-5 mb-2 ${active ? "" : "text-gray-400"}`} />
                <p className="font-semibold text-sm">{t.label}</p>
                <p className={`text-xs mt-0.5 ${active ? "opacity-70" : "text-gray-400"}`}>{t.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2 — Infos */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">2. Informations</h2>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Nom du projet <span className="text-red-500">*</span></label>
          <input
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="Ex : Formation AGEFICE — Campagne printemps"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Sujet / produit <span className="text-red-500">*</span></label>
          <input
            value={sujet}
            onChange={(e) => setSujet(e.target.value)}
            placeholder="Ex : Formation IA pour dirigeants financée AGEFICE"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Public cible</label>
            <input
              value={publicCible}
              onChange={(e) => setPublicCible(e.target.value)}
              placeholder="Ex : gérants de TPE/PME"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Offre principale</label>
            <input
              value={offre}
              onChange={(e) => setOffre(e.target.value)}
              placeholder="Ex : Formation 100% prise en charge"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Step 3 — Options A/B */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">3. Options A/B Testing</h2>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">Nombre de variantes</label>
          <div className="flex gap-2">
            {[2, 3, 4].map((n) => (
              <button
                key={n}
                onClick={() => setNbVariantes(n)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                  nbVariantes === n
                    ? "bg-[#1F4E79] text-white border-[#1F4E79]"
                    : "border-gray-300 text-gray-600 hover:border-gray-400"
                }`}
              >
                {n} variantes
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Chaque variante aura un angle copywriting différent généré par l'IA
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">Palette de couleurs</label>
          <div className="flex gap-2">
            {PALETTES.map((p) => (
              <button
                key={p.id}
                onClick={() => setPalette(p.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                  palette === p.id ? "border-gray-800 ring-2 ring-offset-1 ring-gray-400" : "border-gray-200"
                }`}
              >
                <span className={`w-3 h-3 rounded-full ${p.cls}`} />
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg border border-red-200">{error}</p>
      )}

      {/* Progress */}
      {generating && progress.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 space-y-1.5">
          {progress.map((msg, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-blue-800">
              {i === progress.length - 1 && !msg.includes("Terminé") ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
              ) : (
                <span className="w-3.5 h-3.5 text-blue-500 shrink-0">✓</span>
              )}
              {msg}
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end pb-6">
        <button
          onClick={handleGenerate}
          disabled={generating || !template || !nom || !sujet}
          className="inline-flex items-center gap-2 bg-[#1F4E79] hover:bg-[#163a5a] disabled:bg-gray-300 text-white text-sm font-medium px-6 py-3 rounded-lg transition-colors"
        >
          {generating ? (
            <><Loader2 className="w-4 h-4 animate-spin" />Génération en cours…</>
          ) : (
            <><Sparkles className="w-4 h-4" />Générer {nbVariantes} variantes</>
          )}
        </button>
      </div>
    </div>
  );
}
