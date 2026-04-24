"use client";

import type { LandingContenu } from "@/lib/generateLandingPage";

const PALETTES: Record<string, { bg: string; btn: string; accent: string; badge: string }> = {
  bleu:   { bg: "from-blue-900 to-blue-700",   btn: "bg-blue-500 hover:bg-blue-400",   accent: "text-blue-300",  badge: "bg-blue-800/60 text-blue-200" },
  vert:   { bg: "from-emerald-900 to-emerald-700", btn: "bg-emerald-500 hover:bg-emerald-400", accent: "text-emerald-300", badge: "bg-emerald-800/60 text-emerald-200" },
  violet: { bg: "from-violet-900 to-violet-700", btn: "bg-violet-500 hover:bg-violet-400", accent: "text-violet-300", badge: "bg-violet-800/60 text-violet-200" },
  orange: { bg: "from-orange-800 to-amber-700", btn: "bg-orange-500 hover:bg-orange-400", accent: "text-orange-300", badge: "bg-orange-800/60 text-orange-200" },
};

interface Props {
  contenu: LandingContenu;
  palette?: string;
  scale?: number;
}

export default function LandingPreview({ contenu, palette = "bleu", scale = 1 }: Props) {
  const pal = PALETTES[palette] ?? PALETTES.bleu;

  return (
    <div
      style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: `${100 / scale}%` }}
      className="font-sans text-white"
    >
      {/* HERO */}
      <section className={`bg-gradient-to-br ${pal.bg} px-8 py-16 text-center`}>
        {contenu.preuve_sociale && (
          <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full mb-6 ${pal.badge}`}>
            ✦ {contenu.preuve_sociale}
          </span>
        )}
        <h1 className="text-4xl font-extrabold leading-tight mb-4 max-w-3xl mx-auto">
          {contenu.headline}
        </h1>
        <p className={`text-lg mb-8 max-w-2xl mx-auto opacity-90`}>
          {contenu.subheadline}
        </p>
        <button className={`${pal.btn} text-white font-bold px-8 py-4 rounded-xl text-lg shadow-lg transition-colors`}>
          {contenu.cta_texte}
        </button>
        {contenu.cta_sous_texte && (
          <p className="text-sm mt-3 opacity-60">{contenu.cta_sous_texte}</p>
        )}
      </section>

      {/* PROPOSITION DE VALEUR */}
      <section className="bg-gray-900 px-8 py-12">
        <p className="text-center text-gray-300 max-w-3xl mx-auto text-base leading-relaxed">
          {contenu.proposition_valeur}
        </p>
      </section>

      {/* AVANTAGES */}
      {contenu.avantages?.length > 0 && (
        <section className="bg-gray-800 px-8 py-12">
          <h2 className={`text-center text-2xl font-bold mb-8 ${pal.accent}`}>Ce que vous obtenez</h2>
          <div className="grid grid-cols-2 gap-5 max-w-3xl mx-auto">
            {contenu.avantages.map((a, i) => (
              <div key={i} className="bg-gray-700/60 rounded-xl p-5 flex gap-4 items-start">
                <span className="text-2xl">{a.emoji}</span>
                <div>
                  <p className="font-semibold text-white text-sm">{a.titre}</p>
                  <p className="text-gray-400 text-xs mt-1">{a.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* TÉMOIGNAGE */}
      {contenu.temoignage?.texte && (
        <section className={`bg-gradient-to-r ${pal.bg} px-8 py-12`}>
          <blockquote className="max-w-2xl mx-auto text-center">
            <p className="text-lg italic opacity-90 mb-4">"{contenu.temoignage.texte}"</p>
            <footer className="text-sm font-semibold">
              — {contenu.temoignage.nom}
              {contenu.temoignage.poste && (
                <span className="font-normal opacity-70">, {contenu.temoignage.poste}</span>
              )}
            </footer>
          </blockquote>
        </section>
      )}

      {/* FAQ */}
      {contenu.faq?.length > 0 && (
        <section className="bg-gray-900 px-8 py-12">
          <h2 className={`text-center text-2xl font-bold mb-8 ${pal.accent}`}>Questions fréquentes</h2>
          <div className="max-w-2xl mx-auto space-y-4">
            {contenu.faq.map((item, i) => (
              <div key={i} className="bg-gray-800 rounded-xl p-5">
                <p className="font-semibold text-white text-sm mb-2">{item.question}</p>
                <p className="text-gray-400 text-xs">{item.reponse}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* URGENCE + CTA FINAL */}
      <section className={`bg-gradient-to-br ${pal.bg} px-8 py-14 text-center`}>
        {contenu.urgence && (
          <p className="text-sm font-semibold bg-white/10 rounded-full px-4 py-2 inline-block mb-6 opacity-90">
            ⏳ {contenu.urgence}
          </p>
        )}
        <h2 className="text-3xl font-extrabold mb-6">{contenu.headline}</h2>
        <button className={`${pal.btn} text-white font-bold px-8 py-4 rounded-xl text-lg shadow-lg transition-colors`}>
          {contenu.cta_texte}
        </button>
      </section>
    </div>
  );
}
