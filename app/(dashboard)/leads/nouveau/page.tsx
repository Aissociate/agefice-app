"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";

const SECTEURS = [
  "Commerce de détail",
  "Restauration / Hôtellerie",
  "BTP / Construction",
  "Transport / Logistique",
  "Automobile",
  "Santé / Médico-social",
  "Agro-alimentaire / Artisanat",
  "Services aux entreprises",
  "Réparation",
  "Immobilier",
  "Autre",
];

export default function NouveauLeadPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nomEntreprise: "",
    siret: "",
    codeApe: "",
    secteurActivite: "",
    chiffreAffaires: "",
    effectif: "",
    adresse: "",
    codePostal: "",
    ville: "",
    nomDirigeant: "",
    prenomDirigeant: "",
    telephone: "",
    email: "",
    descriptionEnjeux: "",
  });

  function set(k: string, v: string) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, sourceDonnee: "manuel" }),
    });
    const data = await res.json();
    router.push(`/leads/${data.id}`);
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/leads" className="text-gray-400 hover:text-gray-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Ajouter un lead manuellement</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Entreprise */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Entreprise</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Nom de l'entreprise *</label>
              <input
                required
                type="text"
                value={form.nomEntreprise}
                onChange={(e) => set("nomEntreprise", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Boulangerie Océan Indien SARL"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">SIRET</label>
              <input
                type="text"
                value={form.siret}
                onChange={(e) => set("siret", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="14 chiffres"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Code APE</label>
              <input
                type="text"
                value={form.codeApe}
                onChange={(e) => set("codeApe", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: 1071A"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Secteur d'activité</label>
              <select
                value={form.secteurActivite}
                onChange={(e) => set("secteurActivite", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">— Sélectionner —</option>
                {SECTEURS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Effectif (employés)</label>
              <input
                type="number"
                min="1"
                max="30"
                value={form.effectif}
                onChange={(e) => set("effectif", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Entre 4 et 30"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Chiffre d'affaires (€)</label>
              <input
                type="number"
                value={form.chiffreAffaires}
                onChange={(e) => set("chiffreAffaires", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: 1500000"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Adresse</label>
              <input
                type="text"
                value={form.adresse}
                onChange={(e) => set("adresse", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Rue, numéro"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Code postal</label>
              <input
                type="text"
                value={form.codePostal}
                onChange={(e) => set("codePostal", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="974XX"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Ville</label>
              <input
                type="text"
                value={form.ville}
                onChange={(e) => set("ville", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Saint-Denis"
              />
            </div>
          </div>
        </div>

        {/* Décideur */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Décideur / Dirigeant</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Prénom</label>
              <input
                type="text"
                value={form.prenomDirigeant}
                onChange={(e) => set("prenomDirigeant", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Jean"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nom *</label>
              <input
                required
                type="text"
                value={form.nomDirigeant}
                onChange={(e) => set("nomDirigeant", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="DUPONT"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Téléphone pro</label>
              <input
                type="tel"
                value={form.telephone}
                onChange={(e) => set("telephone", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+262 6 92 XX XX XX"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Email professionnel</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="jean.dupont@entreprise.re"
              />
            </div>
          </div>
        </div>

        {/* Enjeux (optionnel) */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Description des enjeux business <span className="text-gray-400 font-normal">(optionnel — sera généré par IA sinon)</span>
          </label>
          <textarea
            value={form.descriptionEnjeux}
            onChange={(e) => set("descriptionEnjeux", e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Décrivez les principaux défis opérationnels de cette entreprise…"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#1F4E79] text-white rounded-lg text-sm font-medium hover:bg-[#2E75B6] disabled:opacity-60 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {saving ? "Enregistrement…" : "Créer le lead"}
          </button>
          <Link
            href="/leads"
            className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Annuler
          </Link>
        </div>
      </form>
    </div>
  );
}
