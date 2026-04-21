"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, CheckCircle } from "lucide-react";
import { formatMontant, MODALITES } from "@/lib/utils";

interface Formation {
  id: string;
  reference: string;
  intitule: string;
  programme: string;
  objectifs?: string | null;
  publicCible?: string | null;
  prerequis?: string | null;
  dureeHeures: number;
  tarifInterHT: number;
  tarifIntraHT: number;
  plafondAGEFICE?: number | null;
  modalite: string;
  formationEnEntreprise: boolean;
  certifiant: boolean;
  eligibleCPF: boolean;
  referenceRS?: string | null;
  actif: boolean;
  _count?: { dossiers: number };
}

interface EditForm {
  dureeHeures: number;
  tarifInterHT: number;
  tarifIntraHT: number;
  plafondAGEFICE: string;
  modalite: string;
  formationEnEntreprise: boolean;
  actif: boolean;
}

export default function FormationDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [formation, setFormation] = useState<Formation | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const [form, setForm] = useState<EditForm>({
    dureeHeures: 0,
    tarifInterHT: 0,
    tarifIntraHT: 0,
    plafondAGEFICE: "",
    modalite: "presentiel",
    formationEnEntreprise: false,
    actif: true,
  });

  useEffect(() => {
    fetch(`/api/formations/${id}`)
      .then((r) => r.json())
      .then((data: Formation) => {
        setFormation(data);
        setForm({
          dureeHeures: data.dureeHeures,
          tarifInterHT: data.tarifInterHT,
          tarifIntraHT: data.tarifIntraHT,
          plafondAGEFICE: data.plafondAGEFICE != null ? String(data.plafondAGEFICE) : "",
          modalite: data.modalite,
          formationEnEntreprise: data.formationEnEntreprise ?? false,
          actif: data.actif,
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const body = {
        dureeHeures: Number(form.dureeHeures),
        tarifInterHT: Number(form.tarifInterHT),
        tarifIntraHT: Number(form.tarifIntraHT),
        plafondAGEFICE: form.plafondAGEFICE !== "" ? Number(form.plafondAGEFICE) : null,
        modalite: form.modalite,
        formationEnEntreprise: form.formationEnEntreprise,
        actif: form.actif,
      };

      const res = await fetch(`/api/formations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        showToast("error", err.error ?? "Erreur lors de la sauvegarde");
        return;
      }

      const updated: Formation = await res.json();
      setFormation(updated);
      showToast("success", "Formation mise à jour avec succès");
    } catch {
      showToast("error", "Erreur réseau, veuillez réessayer");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400 text-sm">Chargement...</p>
      </div>
    );
  }

  if (!formation) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-red-500 font-medium">Formation introuvable</p>
        <Link href="/formations" className="text-sm text-blue-600 hover:underline">
          Retour aux formations
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-lg shadow-lg text-sm font-medium text-white transition-all ${
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/formations"
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
              {formation.reference}
            </span>
            {formation.eligibleCPF && (
              <span className="text-xs font-medium bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                Éligible CPF
              </span>
            )}
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                form.actif ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"
              }`}
            >
              {form.actif ? "Active" : "Inactive"}
            </span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mt-1">{formation.intitule}</h1>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 bg-[#1F4E79] hover:bg-[#163a5a] disabled:opacity-60 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          <Save className="w-4 h-4" />
          {saving ? "Sauvegarde..." : "Enregistrer"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Editable fields */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Paramètres modifiables</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Durée (heures) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  value={form.dureeHeures}
                  onChange={(e) => setForm((p) => ({ ...p, dureeHeures: Number(e.target.value) }))}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Modalité</label>
                <select
                  value={form.modalite}
                  onChange={(e) => setForm((p) => ({ ...p, modalite: e.target.value }))}
                  className={inputClass}
                >
                  {Object.entries(MODALITES).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tarif inter HT (€) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.tarifInterHT}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, tarifInterHT: Number(e.target.value) }))
                  }
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tarif intra HT (€) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.tarifIntraHT}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, tarifIntraHT: Number(e.target.value) }))
                  }
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plafond AGEFICE (€)
                </label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.plafondAGEFICE}
                  onChange={(e) => setForm((p) => ({ ...p, plafondAGEFICE: e.target.value }))}
                  placeholder="Non défini"
                  className={inputClass}
                />
              </div>

              <div className="flex items-center gap-3 pt-6">
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, actif: !p.actif }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    form.actif ? "bg-blue-600" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      form.actif ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
                <label className="text-sm font-medium text-gray-700">
                  Formation active
                </label>
              </div>

              <div className="flex items-center gap-3 pt-6">
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, formationEnEntreprise: !p.formationEnEntreprise }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    form.formationEnEntreprise ? "bg-amber-500" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      form.formationEnEntreprise ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
                <label className="text-sm font-medium text-gray-700">
                  Formation en entreprise
                  <span className="block text-xs text-gray-400 font-normal">Réalisée dans les locaux du client</span>
                </label>
              </div>
            </div>
          </div>

          {/* Non-editable fields */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-1">Description (non modifiable)</h2>
            <p className="text-xs text-gray-400 mb-4">Ces champs sont gérés par le catalogue</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Programme</label>
                <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm text-gray-700 whitespace-pre-wrap border border-gray-100">
                  {formation.programme}
                </div>
              </div>

              {formation.objectifs && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Objectifs</label>
                  <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm text-gray-700 whitespace-pre-wrap border border-gray-100">
                    {formation.objectifs}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Summary sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
              Résumé
            </h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-xs text-gray-400">Référence</dt>
                <dd className="text-sm font-mono font-medium text-gray-900 mt-0.5">
                  {formation.reference}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-400">Durée</dt>
                <dd className="text-sm font-medium text-gray-900 mt-0.5">
                  {form.dureeHeures}h de formation
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-400">Tarif inter HT actuel</dt>
                <dd className="text-sm font-medium text-gray-900 mt-0.5">
                  {formatMontant(form.tarifInterHT)}
                </dd>
              </div>
              {form.plafondAGEFICE !== "" && (
                <div>
                  <dt className="text-xs text-gray-400">Plafond AGEFICE</dt>
                  <dd className="text-sm font-medium text-[#E4620D] mt-0.5">
                    {formatMontant(Number(form.plafondAGEFICE))}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-gray-400">Dossiers créés</dt>
                <dd className="text-sm font-medium text-gray-900 mt-0.5 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                  {formation._count?.dossiers ?? 0}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
