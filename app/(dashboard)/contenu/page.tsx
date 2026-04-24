"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, PenSquare, Trash2, Calendar, Tag, ImageOff } from "lucide-react";

interface PostBlog {
  id: string;
  titre: string;
  accroche: string | null;
  photoUrl: string | null;
  hashtags: string | null;
  statut: string;
  sujet: string | null;
  dateCreation: string;
}

export default function ContenuPage() {
  const [posts, setPosts] = useState<PostBlog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/contenu")
      .then((r) => r.json())
      .then((data) => { setPosts(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce post ?")) return;
    await fetch(`/api/contenu/${id}`, { method: "DELETE" });
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contenu</h1>
          <p className="text-sm text-gray-500 mt-0.5">Générez et gérez vos posts de blog</p>
        </div>
        <Link
          href="/contenu/nouveau"
          className="inline-flex items-center gap-2 bg-[#1F4E79] hover:bg-[#163a5a] text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouveau post
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mr-3" />
          Chargement…
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-20 text-center">
          <PenSquare className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Aucun post créé</p>
          <p className="text-gray-400 text-sm mt-1 mb-6">
            Utilisez le générateur IA pour créer votre premier post de blog
          </p>
          <Link
            href="/contenu/nouveau"
            className="inline-flex items-center gap-2 bg-[#1F4E79] hover:bg-[#163a5a] text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Créer un post
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {posts.map((post) => {
            const tags: string[] = post.hashtags ? JSON.parse(post.hashtags) : [];
            return (
              <div key={post.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                {post.photoUrl ? (
                  <img
                    src={post.photoUrl}
                    alt={post.titre}
                    className="w-full h-44 object-cover"
                  />
                ) : (
                  <div className="w-full h-44 bg-gray-100 flex items-center justify-center">
                    <ImageOff className="w-8 h-8 text-gray-300" />
                  </div>
                )}
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      post.statut === "publie"
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}>
                      {post.statut === "publie" ? "Publié" : "Brouillon"}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(post.dateCreation).toLocaleDateString("fr-FR")}
                    </span>
                  </div>

                  <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 mb-1">
                    {post.titre}
                  </h3>
                  {post.accroche && (
                    <p className="text-xs text-gray-500 line-clamp-2 mb-3">{post.accroche}</p>
                  )}

                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="inline-flex items-center gap-0.5 text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
                          <Tag className="w-2.5 h-2.5" />{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-auto flex items-center gap-2 pt-3 border-t border-gray-100">
                    <Link
                      href={`/contenu/${post.id}`}
                      className="flex-1 text-center text-xs font-medium text-blue-700 hover:text-blue-900 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      Voir le post
                    </Link>
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
