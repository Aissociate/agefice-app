"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Tag, Hash, Calendar, Trash2, ImageOff, Loader2 } from "lucide-react";

interface Section { titre: string; contenu: string }
interface PostBlog {
  id: string;
  titre: string;
  accroche: string | null;
  introduction: string | null;
  sections: string | null;
  conclusion: string | null;
  motsCles: string | null;
  hashtags: string | null;
  photoUrl: string | null;
  photoCaption: string | null;
  statut: string;
  sujet: string | null;
  ton: string | null;
  publicCible: string | null;
  dateCreation: string;
}

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [post, setPost] = useState<PostBlog | null>(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    fetch(`/api/contenu/${id}`)
      .then((r) => r.json())
      .then((data) => { setPost(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  async function handleToggleStatut() {
    if (!post) return;
    setPublishing(true);
    const newStatut = post.statut === "publie" ? "brouillon" : "publie";
    try {
      const res = await fetch(`/api/contenu/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut: newStatut }),
      });
      const updated = await res.json();
      setPost((prev) => prev ? { ...prev, statut: updated.statut } : prev);
    } finally {
      setPublishing(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Supprimer définitivement ce post ?")) return;
    await fetch(`/api/contenu/${id}`, { method: "DELETE" });
    router.push("/contenu");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />Chargement…
      </div>
    );
  }

  if (!post) {
    return <div className="text-center py-20 text-gray-400">Post introuvable</div>;
  }

  const sections: Section[] = post.sections ? JSON.parse(post.sections) : [];
  const motsCles: string[] = post.motsCles ? JSON.parse(post.motsCles) : [];
  const hashtags: string[] = post.hashtags ? JSON.parse(post.hashtags) : [];

  return (
    <div className="max-w-3xl mx-auto space-y-0">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.push("/contenu")}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft className="w-4 h-4" />
          Retour
        </button>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
            post.statut === "publie"
              ? "bg-green-100 text-green-700"
              : "bg-amber-100 text-amber-700"
          }`}>
            {post.statut === "publie" ? "Publié" : "Brouillon"}
          </span>
          <button
            onClick={handleToggleStatut}
            disabled={publishing}
            className="text-xs font-medium px-3 py-1.5 bg-[#1F4E79] hover:bg-[#163a5a] text-white rounded-lg transition-colors disabled:bg-gray-300"
          >
            {publishing ? "…" : post.statut === "publie" ? "Dépublier" : "Publier"}
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Article */}
      <article className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {post.photoUrl ? (
          <img src={post.photoUrl} alt={post.titre} className="w-full h-72 object-cover" />
        ) : (
          <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
            <ImageOff className="w-10 h-10 text-gray-300" />
          </div>
        )}
        {post.photoCaption && (
          <p className="text-[10px] text-gray-400 text-right px-4 pt-1">{post.photoCaption}</p>
        )}

        <div className="p-8 space-y-6">
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(post.dateCreation).toLocaleDateString("fr-FR", {
                day: "numeric", month: "long", year: "numeric",
              })}
            </span>
            {post.ton && <span className="capitalize">{post.ton}</span>}
            {post.publicCible && <span>{post.publicCible}</span>}
          </div>

          <div>
            <h1 className="text-3xl font-bold text-gray-900 leading-tight">{post.titre}</h1>
            {post.accroche && (
              <p className="mt-3 text-lg text-blue-700 italic">{post.accroche}</p>
            )}
          </div>

          {post.introduction && (
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{post.introduction}</p>
          )}

          {sections.map((section, i) => (
            <div key={i} className="border-l-2 border-blue-200 pl-5">
              <h2 className="font-semibold text-gray-900 text-lg mb-2">{section.titre}</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm">{section.contenu}</p>
            </div>
          ))}

          {post.conclusion && (
            <div className="bg-blue-50 rounded-lg p-5">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{post.conclusion}</p>
            </div>
          )}

          {(motsCles.length > 0 || hashtags.length > 0) && (
            <div className="flex flex-wrap gap-6 pt-4 border-t border-gray-100">
              {motsCles.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1">
                    <Tag className="w-3 h-3" />Mots-clés SEO
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {motsCles.map((m) => (
                      <span key={m} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{m}</span>
                    ))}
                  </div>
                </div>
              )}
              {hashtags.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1">
                    <Hash className="w-3 h-3" />Hashtags réseaux sociaux
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {hashtags.map((h) => (
                      <span key={h} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{h}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </article>
    </div>
  );
}
