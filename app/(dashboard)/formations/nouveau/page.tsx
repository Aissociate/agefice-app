"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import {
  MODALITES,
  THEMATIQUES,
  MODULES,
  TYPES_QUALIFICATION,
} from "@/lib/utils";

const inputClass =
  "w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

function FormField({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
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

export default function NouvelleFormationPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    reference: "",
    intitule: "",
    programme: "",
    objectifs: "",
    publicCible: "",
    prerequis: "",
    thematique: "",
    moduleType: "",
    typeQualification: "",
    nomFormateur: "",
    dureeHeures: "",
    dureePresIndividuel: "",
    dureePresCollectif: "",
    dureeDistSynchrone: "",
    dureeDistAsynchrone: "",
    tarifInterHT: "",
    tarifIntraHT: "",
    plafondAGEFICE: "",
    modalite: "presentiel",
    certifiant: false,
    eligibleCPF: false,
    referenceRS: "",
    actif: true,
  });

  function handleChange(field: keyof typeof form, value: string | boolean) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.reference || !form.intitule || !form.programme || !form.dureeHeures) {
      setError("Référence, intitulé, programme et durée sont obligatoires");
      return;
    }
    if (!form.tarifInterHT || !form.tarifIntraHT) {
      setError("Les tarifs inter et intra sont obligatoires");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/formations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference: form.reference.toUpperCase(),
          intitule: form.intitule,
          programme: form.programme,
          objectifs: form.objectifs || undefined,
          publicCible: form.publicCible || undefined,
          prerequis: form.prerequis || undefined,
          thematique: form.thematique || undefined,
          moduleType: form.moduleType || undefined,
          typeQualification: form.typeQualification || undefined,
          nomFormateur: form.nomFormateur || undefined,
          dureeHeures: Number(form.dureeHeures),
          dureePresIndividuel: form.dureePresIndividuel ? Number(form.dureePresIndividuel) : undefined,
          dureePresCollectif: form.dureePresCollectif ? Number(form.dureePresCollectif) : undefined,
          dureeDistSynchrone: form.dureeDistSynchrone ? Number(form.dureeDistSynchrone) : undefined,
          dureeDistAsynchrone: form.dureeDistAsynchrone ? Number(form.dureeDistAsynchrone) : undefined,
          tarifInterHT: Number(form.tarifInterHT),
          tarifIntraHT: Number(form.tarifIntraHT),
          plafondAGEFICE: form.plafondAGEFICE ? Number(form.plafondAGEFICE) : undefined,
          modalite: form.modalite,
          certifiant: form.certifiant,
          eligibleCPF: form.eligibleCPF,
          referenceRS: form.referenceRS || undefined,
          actif: form.actif,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Erreur lors de la création");
        return;
      }

      const formation = await res.json();
      router.push(`/formations/${formation.id}`);
    } catch {
      setError("Erreur réseau, veuillez réessayer");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/formations"
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nouvelle formation</h1>
          <p className="text-sm text-gray-500 mt-0.5">Ajouter une formation au catalogue AGEFICE</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Identification */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Identification</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Référence" required hint="Ex: INTROIA1 — sera mis en majuscules">
              <input
                type="text"
                value={form.reference}
                onChange={(e) => handleChange("reference", e.target.value)}
                required
                className={inputClass}
                placeholder="SAGEIA1"
              />
            </FormField>
            <FormField label="Thématique">
              <select
                value={form.thematique}
                onChange={(e) => handleChange("thematique", e.target.value)}
                className={inputClass}
              >
                <option value="">— Sélectionner —</option>
                {Object.entries(THEMATIQUES).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </FormField>
            <div className="sm:col-span-2">
              <FormField label="Intitulé de la formation" required>
                <input
                  type="text"
                  value={form.intitule}
                  onChange={(e) => handleChange("intitule", e.target.value)}
                  required
                  className={inputClass}
                  placeholder="Intitulé complet tel qu'il apparaîtra sur les documents AGEFICE"
                />
              </FormField>
            </div>
            <FormField label="Type de module">
              <select
                value={form.moduleType}
                onChange={(e) => handleChange("moduleType", e.target.value)}
                className={inputClass}
              >
                <option value="">— Sélectionner —</option>
                {Object.entries(MODULES).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Type de qualification">
              <select
                value={form.typeQualification}
                onChange={(e) => handleChange("typeQualification", e.target.value)}
                className={inputClass}
              >
                <option value="">— Sélectionner —</option>
                {Object.entries(TYPES_QUALIFICATION).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Public cible">
              <input
                type="text"
                value={form.publicCible}
                onChange={(e) => handleChange("publicCible", e.target.value)}
                className={inputClass}
                placeholder="Dirigeants, managers, indépendants..."
              />
            </FormField>
            <FormField label="Prérequis">
              <input
                type="text"
                value={form.prerequis}
                onChange={(e) => handleChange("prerequis", e.target.value)}
                className={inputClass}
                placeholder="Aucun prérequis technique..."
              />
            </FormField>
          </div>
        </div>

        {/* Contenu pédagogique */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Contenu pédagogique</h2>
          <div className="space-y-4">
            <FormField label="Objectifs pédagogiques" hint="Un objectif par ligne">
              <textarea
                rows={5}
                value={form.objectifs}
                onChange={(e) => handleChange("objectifs", e.target.value)}
                className={inputClass}
                placeholder="À l'issue de la formation, le participant sera capable de :&#10;- ..."
              />
            </FormField>
            <FormField label="Programme détaillé" required hint="Contenu complet jour par jour, module par module">
              <textarea
                rows={12}
                value={form.programme}
                onChange={(e) => handleChange("programme", e.target.value)}
                required
                className={inputClass}
                placeholder="Module 1 : ...&#10;- Point 1&#10;- Point 2&#10;&#10;Module 2 : ..."
              />
            </FormField>
          </div>
        </div>

        {/* Durée & Modalités */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Durée & Modalités</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Durée totale (heures)" required>
              <input
                type="number"
                min={0.5}
                step={0.5}
                value={form.dureeHeures}
                onChange={(e) => handleChange("dureeHeures", e.target.value)}
                required
                className={inputClass}
                placeholder="Ex: 70"
              />
            </FormField>
            <FormField label="Modalité principale" required>
              <select
                value={form.modalite}
                onChange={(e) => handleChange("modalite", e.target.value)}
                className={inputClass}
              >
                {Object.entries(MODALITES).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </FormField>
          </div>
          <p className="text-xs font-medium text-gray-600 mt-4 mb-2">Répartition détaillée par type (heures, optionnel)</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { key: "dureePresIndividuel", label: "Présentiel individuel" },
              { key: "dureePresCollectif", label: "Présentiel collectif" },
              { key: "dureeDistSynchrone", label: "Distanciel synchrone" },
              { key: "dureeDistAsynchrone", label: "Distanciel asynchrone" },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="block text-xs text-gray-500 mb-1">{label}</label>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={form[key as keyof typeof form] as string}
                  onChange={(e) => handleChange(key as keyof typeof form, e.target.value)}
                  className={inputClass}
                  placeholder="0"
                />
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-5">
            <FormField label="Formateur">
              <input
                type="text"
                value={form.nomFormateur}
                onChange={(e) => handleChange("nomFormateur", e.target.value)}
                className={inputClass}
                placeholder="Prénom NOM"
              />
            </FormField>
          </div>
          <div className="mt-4 flex flex-wrap gap-6">
            {[
              { key: "certifiant", label: "Formation certifiante" },
              { key: "eligibleCPF", label: "Éligible CPF" },
              { key: "actif", label: "Formation active (visible au catalogue)" },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form[key as keyof typeof form] as boolean}
                  onChange={(e) => handleChange(key as keyof typeof form, e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 w-4 h-4"
                />
                {label}
              </label>
            ))}
          </div>
          {form.eligibleCPF && (
            <div className="mt-3">
              <FormField label="Référence RS / RNCP (CPF)">
                <input
                  type="text"
                  value={form.referenceRS}
                  onChange={(e) => handleChange("referenceRS", e.target.value)}
                  className={inputClass}
                  placeholder="RS12345"
                />
              </FormField>
            </div>
          )}
        </div>

        {/* Tarifs */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Tarifs & Financement</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField label="Tarif inter HT (€)" required hint="Formation en inter-entreprises">
              <input
                type="number"
                min={0}
                step={0.01}
                value={form.tarifInterHT}
                onChange={(e) => handleChange("tarifInterHT", e.target.value)}
                required
                className={inputClass}
                placeholder="1500"
              />
            </FormField>
            <FormField label="Tarif intra HT (€)" required hint="Formation en intra-entreprise">
              <input
                type="number"
                min={0}
                step={0.01}
                value={form.tarifIntraHT}
                onChange={(e) => handleChange("tarifIntraHT", e.target.value)}
                required
                className={inputClass}
                placeholder="3000"
              />
            </FormField>
            <FormField label="Plafond AGEFICE (€)" hint="Montant max pris en charge par AGEFICE">
              <input
                type="number"
                min={0}
                step={0.01}
                value={form.plafondAGEFICE}
                onChange={(e) => handleChange("plafondAGEFICE", e.target.value)}
                className={inputClass}
                placeholder="2000"
              />
            </FormField>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/formations"
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
            {submitting ? "Création en cours..." : "Créer la formation"}
          </button>
        </div>
      </form>
    </div>
  );
}
