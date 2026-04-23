"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles, Image, Check, ChevronLeft, Loader2,
  Tag, Hash, RefreshCw, Save, Search, X,
} from "lucide-react";

interface Section { titre: string; contenu: string }
interface BlogGenere {
  titre: string;
  accroche: string;
  introduction: string;
  sections: Section[];
  conclusion: string;
  mots_cles: string[];
  hashtags: string[];
  photo_suggestion: string;
}
interface PexelsPhoto {
  id: number;
  src: { medium: string; large2x: string };
  alt: string;
  photographer: string;
}

const TONS = [
  { value: "professionnel", label: "Professionnel" },
  { value: "inspirant",     label: "Inspirant"     },
  { value: "pédagogique",   label: "Pédagogique"   },
  { value: "expert",        label: "Expert"        },
];
const LONGUEURS = [
  { value: "court",  label: "Court (2 sections)"  },
  { value: "moyen",  label: "Moyen (3 sections)"  },
  { value: "long",   label: "Long (5 sections)"   },
];

export default function NouveauPostPage() {
  const router = useRouter();

  const [sujet,       setSujet]       = useState("");
  const [ton,         setTon]         = useState("professionnel");
  const [longueur,    setLongueur]    = useState("moyen");
  const [publicCible, setPublicCible] = useState("chefs d'entreprise");

  const [generating, setGenerating] = useState(false);
  const [post,       setPost]       = useState<BlogGenere | null>(null);
  const [error,      setError]      = useState("");

  const [photos,         setPhotos]         = useState<PexelsPhoto[]>([]);
  const [loadingPhotos,  setLoadingPhotos]  = useState(false);
  const [photoQuery,     setPhotoQuery]     = useState("");
  const [selectedPhoto,  setSelectedPhoto]  = useState<PexelsPhoto | null>(null);

  const [saving, setSaving] = useState(false);

  async function handleGenerate() {
    if (!sujet.trim()) { setError("Entrez un sujet"); return; }
    setError("");
    setGenerating(true);
    setPost(null);
    setPhotos([]);
    setSelectedPhoto(null);

    try {
      const res = await fetch("/api/contenu/generer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sujet, ton, longueur, publicCible }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const data: BlogGenere = await res.json();
      setPost(data);
      setPhotoQuery(data.photo_suggestion);
      await searchPhotos(data.photo_suggestion);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur de génération");
    } finally {
      setGenerating(false);
    }
  }

  async function searchPhotos(q: string) {
    if (!q.trim()) return;
    setLoadingPhotos(true);
    try {
      const res = await fetch(`/api/contenu/photos?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setPhotos(data.photos ?? []);
    } catch {
      setPhotos([]);
    } finally {
      setLoadingPhotos(false);
    }
  }

  async function handleSave() {
    if (!post) return;
    setSaving(true);
    try {
      const res = await fetch("/api/contenu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titre:        post.titre,
          accroche:     post.accroche,
          introduction: post.introduction,
          sections:     post.sections,
          conclusion:   post.conclusion,
          motsCles:     post.mots_cles,
          hashtags:     post.hashtags,
          photoUrl:     selectedPhoto?.src.large2x ?? null,
          photoCaption: selectedPhoto
            ? `Photo par ${selectedPhoto.photographer} (Pexels)`
            : null,
          sujet,
          ton,
          publicCible,
        }),
      });
      if (!res.ok) throw new Error();
      router.push("/contenu");
    } catch {
      setError("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Générateur de post</h1>
          <p className="text-sm text-gray-500">Créez un post de blog avec l'IA en quelques secondes</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600" />
          Paramètres de génération
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Sujet du post <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={sujet}
              onChange={(e) => setSujet(e.target.value)}
              placeholder="Ex : Comment financer sa formation avec l'AGEFICE ?"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Ton</label>
            <select
              value={ton}
              onChange={(e) => setTon(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {TONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Longueur</label>
            <select
              value={longueur}
              onChange={(e) => setLongueur(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {LONGUEURS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Public cible</label>
            <input
              type="text"
              value={publicCible}
              onChange={(e) => setPublicCible(e.target.value)}
              placeholder="Ex : chefs d'entreprise, gérants de TPE/PME"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}

        <div className="mt-5 flex justify-end">
          <button
            onClick={handleGenerate}
            disabled={generating || !sujet.trim()}
            className="inline-flex items-center gap-2 bg-[#1F4E79] hover:bg-[#163a5a] disabled:bg-gray-300 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            {generating ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Génération en cours…</>
            ) : (
              <><Sparkles className="w-4 h-4" />Générer le post</>
            )}
          </button>
        </div>
      </div>

      {/* Result */}
      {post && (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Photo */}
            {selectedPhoto && (
              <div className="relative">
                <img
                  src={selectedPhoto.src.large2x}
                  alt={selectedPhoto.alt}
                  className="w-full h-64 object-cover"
                />
                <button
                  onClick={() => setSelectedPhoto(null)}
                  className="absolute top-3 right-3 p-1.5 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <p className="absolute bottom-2 right-3 text-white/70 text-[10px]">
                  Photo : {selectedPhoto.photographer} (Pexels)
                </p>
              </div>
            )}

            <div className="p-6 space-y-6">
              {/* Titre + accroche */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 leading-tight">{post.titre}</h2>
                <p className="mt-2 text-base text-blue-700 italic">{post.accroche}</p>
              </div>

              {/* Introduction */}
              <div>
                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{post.introduction}</p>
              </div>

              {/* Sections */}
              {post.sections.map((section, i) => (
                <div key={i} className="border-l-2 border-blue-200 pl-4">
                  <h3 className="font-semibold text-gray-900 mb-2">{section.titre}</h3>
                  <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{section.contenu}</p>
                </div>
              ))}

              {/* Conclusion */}
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{post.conclusion}</p>
              </div>

              {/* Meta */}
              <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-100">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1">
                    <Tag className="w-3 h-3" />Mots-clés
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {post.mots_cles.map((m) => (
                      <span key={m} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{m}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1">
                    <Hash className="w-3 h-3" />Hashtags
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {post.hashtags.map((h) => (
                      <span key={h} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{h}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Photo search */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <Image className="w-4 h-4 text-blue-600" />
              Photo d'illustration
            </h2>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={photoQuery}
                onChange={(e) => setPhotoQuery(e.target.value)}
                placeholder="Mot-clé en anglais (ex: business training)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => e.key === "Enter" && searchPhotos(photoQuery)}
              />
              <button
                onClick={() => searchPhotos(photoQuery)}
                disabled={loadingPhotos}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
              >
                {loadingPhotos
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Search className="w-4 h-4" />}
                Rechercher
              </button>
            </div>

            {photos.length === 0 && !loadingPhotos && (
              <p className="text-sm text-gray-400 text-center py-6">
                {process.env.NODE_ENV === "development"
                  ? "Ajoutez PEXELS_API_KEY dans .env pour activer la recherche photos"
                  : "Aucune photo trouvée — essayez un autre mot-clé"}
              </p>
            )}

            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {photos.map((photo) => (
                  <button
                    key={photo.id}
                    onClick={() => setSelectedPhoto(selectedPhoto?.id === photo.id ? null : photo)}
                    className={`relative rounded-lg overflow-hidden aspect-video group border-2 transition-all ${
                      selectedPhoto?.id === photo.id
                        ? "border-blue-500 ring-2 ring-blue-300"
                        : "border-transparent hover:border-gray-300"
                    }`}
                  >
                    <img
                      src={photo.src.medium}
                      alt={photo.alt}
                      className="w-full h-full object-cover"
                    />
                    {selectedPhoto?.id === photo.id && (
                      <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                        <Check className="w-6 h-6 text-white drop-shadow" />
                      </div>
                    )}
                    <p className="absolute bottom-0 inset-x-0 text-[9px] text-white/80 bg-black/30 px-1.5 py-0.5 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                      {photo.photographer}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pb-4">
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Régénérer
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
            >
              {saving
                ? <><Loader2 className="w-4 h-4 animate-spin" />Enregistrement…</>
                : <><Save className="w-4 h-4" />Enregistrer le post</>}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
