"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { NIVEAUX_DIPLOME, ANCIENNETES_DIRECTION } from "@/lib/utils";

const STATUTS_JURIDIQUES = [
  "EI",
  "EURL",
  "SARL",
  "SAS",
  "SASU",
  "Auto-entrepreneur",
  "Autre",
];

interface FormData {
  civilite: string;
  nom: string;
  prenom: string;
  nomNaissance: string;
  dateNaissance: string;
  numeroSS: string;
  nomCommercial: string;
  activitePrincipale: string;
  statutJuridique: string;
  siret: string;
  codeApe: string;
  niveauDiplome: string;
  ancienneteDirection: string;
  adresse: string;
  codePostal: string;
  ville: string;
  email: string;
  telephone: string;
}

function FormField({
  label,
  required,
  children,
  hint,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

export default function NouveauClientPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState<FormData>({
    civilite: "",
    nom: "",
    prenom: "",
    nomNaissance: "",
    dateNaissance: "",
    numeroSS: "",
    nomCommercial: "",
    activitePrincipale: "",
    statutJuridique: "EI",
    siret: "",
    codeApe: "",
    niveauDiplome: "",
    ancienneteDirection: "",
    adresse: "",
    codePostal: "",
    ville: "",
    email: "",
    telephone: "",
  });

  function handleChange(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Validate SIRET
    if (form.siret.length !== 14 || !/^\d{14}$/.test(form.siret)) {
      setError("Le SIRET doit comporter exactement 14 chiffres");
      return;
    }

    // Validate code APE
    if (!/^\d{4}[A-Za-z]$/.test(form.codeApe)) {
      setError("Le code APE doit comporter 4 chiffres suivis d'une lettre (ex: 8559A)");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Erreur lors de la création du client");
        return;
      }

      const client = await res.json();
      router.push(`/clients/${client.id}`);
    } catch {
      setError("Erreur réseau, veuillez réessayer");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/clients"
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nouveau client</h1>
          <p className="text-sm text-gray-500 mt-0.5">Créer un nouveau chef d&apos;entreprise</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Identité du dirigeant */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Identité du dirigeant</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Civilité">
              <select
                value={form.civilite}
                onChange={(e) => handleChange("civilite", e.target.value)}
                className={inputClass}
              >
                <option value="">—</option>
                <option value="M.">M.</option>
                <option value="Mme">Mme</option>
              </select>
            </FormField>
            <div />
            <FormField label="Prénom" required>
              <input
                type="text"
                value={form.prenom}
                onChange={(e) => handleChange("prenom", e.target.value)}
                required
                className={inputClass}
                placeholder="Jean"
              />
            </FormField>
            <FormField label="Nom d'usage" required>
              <input
                type="text"
                value={form.nom}
                onChange={(e) => handleChange("nom", e.target.value)}
                required
                className={inputClass}
                placeholder="DUPONT"
              />
            </FormField>
            <FormField label="Nom de naissance" hint="Si différent du nom d'usage">
              <input
                type="text"
                value={form.nomNaissance}
                onChange={(e) => handleChange("nomNaissance", e.target.value)}
                className={inputClass}
                placeholder="NOM DE JEUNE FILLE"
              />
            </FormField>
            <FormField label="Date de naissance">
              <input
                type="date"
                value={form.dateNaissance}
                onChange={(e) => handleChange("dateNaissance", e.target.value)}
                className={inputClass}
              />
            </FormField>
            <FormField label="N° de Sécurité Sociale" hint="15 chiffres">
              <input
                type="text"
                value={form.numeroSS}
                onChange={(e) => handleChange("numeroSS", e.target.value.replace(/\s/g, ""))}
                maxLength={15}
                className={inputClass}
                placeholder="1 XX XX XX XXX XXX XX"
              />
            </FormField>
            <FormField label="Niveau de diplôme">
              <select
                value={form.niveauDiplome}
                onChange={(e) => handleChange("niveauDiplome", e.target.value)}
                className={inputClass}
              >
                <option value="">— Sélectionner —</option>
                {Object.entries(NIVEAUX_DIPLOME).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Ancienneté dans la direction">
              <select
                value={form.ancienneteDirection}
                onChange={(e) => handleChange("ancienneteDirection", e.target.value)}
                className={inputClass}
              >
                <option value="">— Sélectionner —</option>
                {Object.entries(ANCIENNETES_DIRECTION).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </FormField>
          </div>
        </div>

        {/* Identification entreprise */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Identification entreprise</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Statut juridique" required>
              <select
                value={form.statutJuridique}
                onChange={(e) => handleChange("statutJuridique", e.target.value)}
                required
                className={inputClass}
              >
                {STATUTS_JURIDIQUES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Nom commercial / Enseigne">
              <input
                type="text"
                value={form.nomCommercial}
                onChange={(e) => handleChange("nomCommercial", e.target.value)}
                className={inputClass}
                placeholder="Nom commercial si différent"
              />
            </FormField>
            <FormField label="SIRET" required hint="14 chiffres sans espaces">
              <input
                type="text"
                value={form.siret}
                onChange={(e) => handleChange("siret", e.target.value.replace(/\s/g, ""))}
                required
                maxLength={14}
                pattern="\d{14}"
                className={inputClass}
                placeholder="12345678901234"
              />
            </FormField>
            <FormField label="Code APE" required hint="Ex: 8559A">
              <input
                type="text"
                value={form.codeApe}
                onChange={(e) => handleChange("codeApe", e.target.value.toUpperCase())}
                required
                maxLength={5}
                className={inputClass}
                placeholder="8559A"
              />
            </FormField>
            <div className="sm:col-span-2">
              <FormField label="Activité principale">
                <input
                  type="text"
                  value={form.activitePrincipale}
                  onChange={(e) => handleChange("activitePrincipale", e.target.value)}
                  className={inputClass}
                  placeholder="Description de l'activité principale"
                />
              </FormField>
            </div>
          </div>
        </div>

        {/* Adresse */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Adresse</h2>
          <div className="space-y-4">
            <FormField label="Adresse">
              <input
                type="text"
                value={form.adresse}
                onChange={(e) => handleChange("adresse", e.target.value)}
                className={inputClass}
                placeholder="12 rue de la République"
              />
            </FormField>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField label="Code postal">
                <input
                  type="text"
                  value={form.codePostal}
                  onChange={(e) => handleChange("codePostal", e.target.value)}
                  maxLength={5}
                  className={inputClass}
                  placeholder="97400"
                />
              </FormField>
              <div className="sm:col-span-2">
                <FormField label="Ville">
                  <input
                    type="text"
                    value={form.ville}
                    onChange={(e) => handleChange("ville", e.target.value)}
                    className={inputClass}
                    placeholder="Saint-Denis"
                  />
                </FormField>
              </div>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Contact</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Email" required>
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                required
                className={inputClass}
                placeholder="jean.dupont@exemple.fr"
              />
            </FormField>
            <FormField label="Téléphone">
              <input
                type="tel"
                value={form.telephone}
                onChange={(e) => handleChange("telephone", e.target.value)}
                className={inputClass}
                placeholder="0692 12 34 56"
              />
            </FormField>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/clients"
            className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 bg-[#1F4E79] hover:bg-[#163a5a] disabled:opacity-60 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" />
            {submitting ? "Création en cours..." : "Créer le client"}
          </button>
        </div>
      </form>
    </div>
  );
}
