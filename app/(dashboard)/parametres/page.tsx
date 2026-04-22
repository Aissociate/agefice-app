"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Save, Check, Upload, FileText, ExternalLink } from "lucide-react";
import { formatMontant } from "@/lib/utils";

type Tab = "organisme" | "agefice" | "formations" | "alertes" | "email" | "ia";

interface Formation {
  id: string;
  reference: string;
  intitule: string;
  tarifInterHT: number;
  tarifIntraHT: number;
  plafondAGEFICE?: number | null;
  dureeHeures: number;
  modalite: string;
  actif: boolean;
}

interface FormationRow extends Formation {
  edited: {
    tarifInterHT: string;
    tarifIntraHT: string;
    plafondAGEFICE: string;
    dureeHeures: string;
    actif: boolean;
  };
  saving: boolean;
  saved: boolean;
}

function Toast({ type, msg }: { type: "success" | "error"; msg: string }) {
  return (
    <div
      className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-lg shadow-lg text-sm font-medium text-white ${
        type === "success" ? "bg-green-600" : "bg-red-600"
      }`}
    >
      {msg}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
        active
          ? "border-[#1F4E79] text-[#1F4E79]"
          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
      }`}
    >
      {children}
    </button>
  );
}

function SaveButton({
  onClick,
  loading,
  label = "Enregistrer",
}: {
  onClick: () => void;
  loading: boolean;
  label?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="inline-flex items-center gap-2 bg-[#1F4E79] hover:bg-[#163a5a] disabled:opacity-60 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
    >
      <Save className="w-4 h-4" />
      {loading ? "Sauvegarde..." : label}
    </button>
  );
}

const inputClass =
  "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

// ===================== ORGANISME TAB =====================
function OrganismeTab({
  onToast,
}: {
  onToast: (type: "success" | "error", msg: string) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    org_nom: "",
    org_siret: "",
    org_nda: "",
    org_qualiopi: "",
    org_dreets: "",
    org_adresse: "",
    org_code_postal: "",
    org_ville: "",
    org_email: "",
    org_telephone: "",
    org_site: "",
    org_tva: "",
    org_iban: "",
    org_responsable_civilite: "",
    org_responsable_nom: "",
    org_responsable_prenom: "",
    org_responsable_qualite: "",
    org_responsable_tel: "",
    org_responsable_mail: "",
  });
  const [docs, setDocs] = useState({ qualiopi: "", kbis: "", catalogue: "" });
  const [uploading, setUploading] = useState<"qualiopi" | "kbis" | "catalogue" | null>(null);
  const qualiopiRef  = useRef<HTMLInputElement>(null);
  const kbisRef      = useRef<HTMLInputElement>(null);
  const catalogueRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/parametres")
      .then((r) => r.json())
      .then((data: Record<string, string>) => {
        setForm({
          org_nom: data.org_nom ?? "",
          org_siret: data.org_siret ?? "",
          org_nda: data.org_nda ?? "",
          org_qualiopi: data.org_qualiopi ?? "",
          org_dreets: data.org_dreets ?? "",
          org_adresse: data.org_adresse ?? "",
          org_code_postal: data.org_code_postal ?? "",
          org_ville: data.org_ville ?? "",
          org_email: data.org_email ?? "",
          org_telephone: data.org_telephone ?? "",
          org_site: data.org_site ?? "",
          org_tva: data.org_tva ?? "",
          org_iban: data.org_iban ?? "",
          org_responsable_civilite: data.org_responsable_civilite ?? "",
          org_responsable_nom: data.org_responsable_nom ?? "",
          org_responsable_prenom: data.org_responsable_prenom ?? "",
          org_responsable_qualite: data.org_responsable_qualite ?? "",
          org_responsable_tel: data.org_responsable_tel ?? "",
          org_responsable_mail: data.org_responsable_mail ?? "",
        });
        setDocs({
          qualiopi:  data.org_doc_qualiopi_url ?? "",
          kbis:      data.org_doc_kbis_url ?? "",
          catalogue: data.org_doc_catalogue_url ?? "",
        });
      });
  }, []);

  async function handleUpload(docType: "qualiopi" | "kbis" | "catalogue", file: File) {
    setUploading(docType);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("docType", docType);
      const res = await fetch("/api/parametres/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const err = await res.json();
        onToast("error", err.error || "Erreur upload");
        return;
      }
      const { url } = await res.json();
      setDocs((p) => ({ ...p, [docType]: url }));
      const labels: Record<string, string> = { qualiopi: "Qualiopi", kbis: "Kbis", catalogue: "Catalogue de formation" };
      onToast("success", `Document ${labels[docType] ?? docType} enregistré`);
    } catch {
      onToast("error", "Erreur réseau lors de l'upload");
    } finally {
      setUploading(null);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const params = Object.entries(form).map(([cle, valeur]) => ({ cle, valeur }));
      const res = await fetch("/api/parametres", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ params }),
      });
      if (!res.ok) throw new Error();
      onToast("success", "Paramètres organisme sauvegardés");
    } catch {
      onToast("error", "Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  }

  function DocUploadZone({
    docType,
    label,
    hint,
    inputRef,
  }: {
    docType: "qualiopi" | "kbis" | "catalogue";
    label: string;
    hint: string;
    inputRef: React.RefObject<HTMLInputElement | null>;
  }) {
    const url = docs[docType];
    const isUploading = uploading === docType;
    return (
      <div className="border border-gray-200 rounded-lg p-4 flex items-center gap-4">
        <div className="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
          <FileText className="w-5 h-5 text-[#1F4E79]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">{label}</p>
          <p className="text-xs text-gray-400 mt-0.5">{hint}</p>
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-800 mt-1 font-medium"
            >
              <ExternalLink className="w-3 h-3" />
              Voir le fichier enregistré
            </a>
          )}
        </div>
        <div className="flex-shrink-0">
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleUpload(docType, f);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            className="inline-flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg border border-[#1F4E79] text-[#1F4E79] hover:bg-blue-50 disabled:opacity-50 transition-colors"
          >
            <Upload className="w-4 h-4" />
            {isUploading ? "Upload…" : url ? "Remplacer" : "Uploader"}
          </button>
        </div>
      </div>
    );
  }

  function field(label: string, key: keyof typeof form, type = "text", hint?: string) {
    return (
      <div key={key}>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input
          type={type}
          value={form[key]}
          onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
          className={inputClass}
        />
        {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Identité organisme */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-900">Identité de l&apos;organisme</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {field("Nom de l'organisme", "org_nom")}
          {field("SIRET", "org_siret")}
          {field("N° de Déclaration d'Activité (NDA)", "org_nda", "text", "Numéro auprès de la DREETS / ex-DIRECCTE")}
          {field("DREETS / DRIEETS / DEETS de rattachement", "org_dreets", "text", "Ex : La Réunion")}
          {field("Numéro Qualiopi", "org_qualiopi")}
          {field("Numéro TVA intracommunautaire", "org_tva")}
        </div>
      </div>

      {/* Coordonnées */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-900">Coordonnées</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {field("Adresse", "org_adresse")}
          {field("Code postal", "org_code_postal")}
          {field("Ville", "org_ville")}
          {field("Email", "org_email", "email")}
          {field("Téléphone", "org_telephone", "tel")}
          {field("Site web", "org_site", "url")}
        </div>
      </div>

      {/* Responsable */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-900">Responsable / Signataire</h2>
        <p className="text-xs text-gray-500">Personne habilitée à signer les documents AGEFICE</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Civilité</label>
            <select
              value={form.org_responsable_civilite}
              onChange={(e) => setForm((p) => ({ ...p, org_responsable_civilite: e.target.value }))}
              className={inputClass}
            >
              <option value="">—</option>
              <option value="M.">M.</option>
              <option value="Mme">Mme</option>
            </select>
          </div>
          {field("Nom", "org_responsable_nom")}
          {field("Prénom", "org_responsable_prenom")}
          {field("Qualité / Fonction", "org_responsable_qualite", "text", "Ex : Gérant, Directeur pédagogique")}
          {field("Téléphone direct", "org_responsable_tel", "tel")}
          {field("Email direct", "org_responsable_mail", "email")}
        </div>
      </div>

      {/* Coordonnées bancaires */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-900">Coordonnées bancaires</h2>
        <p className="text-xs text-gray-500">Utilisé dans les devis et propositions commerciales</p>
        <div className="grid grid-cols-1 gap-4">
          {field("IBAN", "org_iban", "text", "Ex : FR76 3000 4000 0100 0000 0000 143")}
        </div>
      </div>

      {/* Documents administratifs */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-900">Documents administratifs</h2>
        <p className="text-xs text-gray-500">Certificat Qualiopi, Kbis et catalogue — formats acceptés : PDF, JPG, PNG (max 10 Mo)</p>
        <div className="space-y-3">
          <DocUploadZone
            docType="qualiopi"
            label="Certificat Qualiopi"
            hint="Attestation de certification délivrée par la DREETS"
            inputRef={qualiopiRef}
          />
          <DocUploadZone
            docType="kbis"
            label="Extrait Kbis / Avis de situation SIRENE"
            hint="Document officiel d'immatriculation de l'organisme (moins de 3 mois)"
            inputRef={kbisRef}
          />
          <DocUploadZone
            docType="catalogue"
            label="Catalogue de formation"
            hint="PDF envoyable en pièce jointe dans les mails clients"
            inputRef={catalogueRef}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <SaveButton onClick={handleSave} loading={saving} />
      </div>
    </div>
  );
}

// ===================== AGEFICE TAB =====================
function AgeficeTab({
  onToast,
}: {
  onToast: (type: "success" | "error", msg: string) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    agefice_delai_depot_min_jours: "15",
    agefice_delai_depot_max_mois: "4",
    agefice_delai_remboursement_mois: "4",
    agefice_plafond_annuel: "2000",
    org_point_accueil_nom: "",
    org_point_accueil_numero: "",
    org_point_accueil_interlocuteur: "",
    org_point_accueil_adresse: "",
    org_point_accueil_code_postal: "",
    org_point_accueil_ville: "",
    org_point_accueil_tel: "",
    org_point_accueil_mail: "",
  });

  useEffect(() => {
    fetch("/api/parametres")
      .then((r) => r.json())
      .then((data: Record<string, string>) => {
        setForm({
          agefice_delai_depot_min_jours: data.agefice_delai_depot_min_jours ?? "15",
          agefice_delai_depot_max_mois: data.agefice_delai_depot_max_mois ?? "4",
          agefice_delai_remboursement_mois: data.agefice_delai_remboursement_mois ?? "4",
          agefice_plafond_annuel: data.agefice_plafond_annuel ?? "2000",
          org_point_accueil_nom: data.org_point_accueil_nom ?? "",
          org_point_accueil_numero: data.org_point_accueil_numero ?? "",
          org_point_accueil_interlocuteur: data.org_point_accueil_interlocuteur ?? "",
          org_point_accueil_adresse: data.org_point_accueil_adresse ?? "",
          org_point_accueil_code_postal: data.org_point_accueil_code_postal ?? "",
          org_point_accueil_ville: data.org_point_accueil_ville ?? "",
          org_point_accueil_tel: data.org_point_accueil_tel ?? "",
          org_point_accueil_mail: data.org_point_accueil_mail ?? "",
        });
      });
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const params = Object.entries(form).map(([cle, valeur]) => ({ cle, valeur }));
      const res = await fetch("/api/parametres", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ params }),
      });
      if (!res.ok) throw new Error();
      onToast("success", "Paramètres AGEFICE sauvegardés");
    } catch {
      onToast("error", "Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Règles AGEFICE</h2>
        <p className="text-sm text-gray-500 mb-5">
          Paramètres réglementaires de la prise en charge AGEFICE
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Délai minimum de dépôt (jours avant début)
            </label>
            <input
              type="number"
              min={1}
              value={form.agefice_delai_depot_min_jours}
              onChange={(e) =>
                setForm((p) => ({ ...p, agefice_delai_depot_min_jours: e.target.value }))
              }
              className={inputClass}
            />
            <p className="mt-1 text-xs text-gray-400">
              Le dossier doit être déposé au moins X jours avant le début de la formation
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Délai maximum de dépôt (mois avant début)
            </label>
            <input
              type="number"
              min={1}
              value={form.agefice_delai_depot_max_mois}
              onChange={(e) =>
                setForm((p) => ({ ...p, agefice_delai_depot_max_mois: e.target.value }))
              }
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Délai de remboursement (mois après fin)
            </label>
            <input
              type="number"
              min={1}
              value={form.agefice_delai_remboursement_mois}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  agefice_delai_remboursement_mois: e.target.value,
                }))
              }
              className={inputClass}
            />
            <p className="mt-1 text-xs text-gray-400">
              La demande de remboursement doit être envoyée dans les X mois après la fin
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Plafond annuel AGEFICE (€)
            </label>
            <input
              type="number"
              min={0}
              step={100}
              value={form.agefice_plafond_annuel}
              onChange={(e) =>
                setForm((p) => ({ ...p, agefice_plafond_annuel: e.target.value }))
              }
              className={inputClass}
            />
            <p className="mt-1 text-xs text-gray-400">
              Actuel : {formatMontant(Number(form.agefice_plafond_annuel))} / an / chef d&apos;entreprise
            </p>
          </div>
        </div>
        <div className="flex justify-end pt-4">
          <SaveButton onClick={handleSave} loading={saving} />
        </div>
      </div>

      {/* Point d'accueil CPME */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Point d&apos;accueil AGEFICE (CPME)</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Organisme en charge de la constitution et du suivi de la demande AGEFICE — apparaît en section 1 du formulaire
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom du Point d&apos;accueil</label>
            <input type="text" value={form.org_point_accueil_nom}
              onChange={(e) => setForm((p) => ({ ...p, org_point_accueil_nom: e.target.value }))}
              className={inputClass} placeholder="CPME Réunion" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">N° de Point d&apos;accueil (tél.)</label>
            <input type="tel" value={form.org_point_accueil_numero}
              onChange={(e) => setForm((p) => ({ ...p, org_point_accueil_numero: e.target.value }))}
              className={inputClass} placeholder="02 62 96 43 25" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Interlocuteur</label>
            <input type="text" value={form.org_point_accueil_interlocuteur}
              onChange={(e) => setForm((p) => ({ ...p, org_point_accueil_interlocuteur: e.target.value }))}
              className={inputClass} placeholder="Prénom NOM" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
            <input type="text" value={form.org_point_accueil_adresse}
              onChange={(e) => setForm((p) => ({ ...p, org_point_accueil_adresse: e.target.value }))}
              className={inputClass} placeholder="36 chemin de l'état major" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Code postal</label>
            <input type="text" value={form.org_point_accueil_code_postal}
              onChange={(e) => setForm((p) => ({ ...p, org_point_accueil_code_postal: e.target.value }))}
              className={inputClass} placeholder="97417" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
            <input type="text" value={form.org_point_accueil_ville}
              onChange={(e) => setForm((p) => ({ ...p, org_point_accueil_ville: e.target.value }))}
              className={inputClass} placeholder="La Montagne" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tél. (organisme)</label>
            <input type="tel" value={form.org_point_accueil_tel}
              onChange={(e) => setForm((p) => ({ ...p, org_point_accueil_tel: e.target.value }))}
              className={inputClass} placeholder="0692246860" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mail (organisme)</label>
            <input type="email" value={form.org_point_accueil_mail}
              onChange={(e) => setForm((p) => ({ ...p, org_point_accueil_mail: e.target.value }))}
              className={inputClass} placeholder="contact@aissociate.re" />
          </div>
        </div>
        <div className="flex justify-end pt-2">
          <SaveButton onClick={handleSave} loading={saving} />
        </div>
      </div>
    </div>
  );
}

// ===================== FORMATIONS TAB =====================
function FormationsTab({
  onToast,
}: {
  onToast: (type: "success" | "error", msg: string) => void;
}) {
  const [rows, setRows] = useState<FormationRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/formations")
      .then((r) => r.json())
      .then((data: Formation[]) => {
        setRows(
          data.map((f) => ({
            ...f,
            edited: {
              tarifInterHT: String(f.tarifInterHT),
              tarifIntraHT: String(f.tarifIntraHT),
              plafondAGEFICE: f.plafondAGEFICE != null ? String(f.plafondAGEFICE) : "",
              dureeHeures: String(f.dureeHeures),
              actif: f.actif,
            },
            saving: false,
            saved: false,
          }))
        );
        setLoading(false);
      });
  }, []);

  function updateRow(id: string, field: string, value: string | boolean) {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, edited: { ...r.edited, [field]: value }, saved: false } : r
      )
    );
  }

  async function saveRow(id: string) {
    const row = rows.find((r) => r.id === id);
    if (!row) return;

    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, saving: true } : r)));

    try {
      const res = await fetch(`/api/formations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tarifInterHT: Number(row.edited.tarifInterHT),
          tarifIntraHT: Number(row.edited.tarifIntraHT),
          plafondAGEFICE:
            row.edited.plafondAGEFICE !== "" ? Number(row.edited.plafondAGEFICE) : null,
          dureeHeures: Number(row.edited.dureeHeures),
          actif: row.edited.actif,
        }),
      });

      if (!res.ok) {
        onToast("error", `Erreur lors de la sauvegarde de "${row.intitule}"`);
        setRows((prev) => prev.map((r) => (r.id === id ? { ...r, saving: false } : r)));
        return;
      }

      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, saving: false, saved: true } : r))
      );
      setTimeout(() => {
        setRows((prev) => prev.map((r) => (r.id === id ? { ...r, saved: false } : r)));
      }, 2000);
    } catch {
      onToast("error", "Erreur réseau");
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, saving: false } : r)));
    }
  }

  const cellInput = (
    id: string,
    field: string,
    value: string,
    type = "number"
  ) => (
    <input
      type={type}
      value={value}
      onChange={(e) => updateRow(id, field, e.target.value)}
      min={0}
      step={type === "number" ? 0.01 : undefined}
      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    />
  );

  if (loading) {
    return <p className="text-gray-400 text-sm py-8 text-center">Chargement...</p>;
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900">Catalogue des formations</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Modifiez les tarifs et paramètres directement dans le tableau
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3">Référence</th>
              <th className="px-4 py-3">Intitulé</th>
              <th className="px-4 py-3 w-28">Durée (h)</th>
              <th className="px-4 py-3 w-32">Tarif inter HT</th>
              <th className="px-4 py-3 w-32">Tarif intra HT</th>
              <th className="px-4 py-3 w-32">Plafond AGEFICE</th>
              <th className="px-4 py-3 text-center">Actif</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50/50">
                <td className="px-4 py-3 text-xs font-mono text-blue-700 whitespace-nowrap">
                  {row.reference}
                </td>
                <td className="px-4 py-3 text-sm text-gray-800 max-w-xs">
                  <span className="line-clamp-2">{row.intitule}</span>
                </td>
                <td className="px-3 py-2">
                  {cellInput(row.id, "dureeHeures", row.edited.dureeHeures)}
                </td>
                <td className="px-3 py-2">
                  {cellInput(row.id, "tarifInterHT", row.edited.tarifInterHT)}
                </td>
                <td className="px-3 py-2">
                  {cellInput(row.id, "tarifIntraHT", row.edited.tarifIntraHT)}
                </td>
                <td className="px-3 py-2">
                  {cellInput(row.id, "plafondAGEFICE", row.edited.plafondAGEFICE)}
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    type="button"
                    onClick={() => updateRow(row.id, "actif", !row.edited.actif)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                      row.edited.actif ? "bg-blue-600" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        row.edited.actif ? "translate-x-4" : "translate-x-1"
                      }`}
                    />
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => saveRow(row.id)}
                    disabled={row.saving}
                    className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                      row.saved
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-[#1F4E79] hover:bg-[#163a5a] text-white"
                    } disabled:opacity-60`}
                  >
                    {row.saved ? (
                      <>
                        <Check className="w-3 h-3" /> Sauvegardé
                      </>
                    ) : row.saving ? (
                      "..."
                    ) : (
                      <>
                        <Save className="w-3 h-3" /> Sauvegarder
                      </>
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ===================== ALERTES TAB =====================
function AlertesTab({
  onToast,
}: {
  onToast: (type: "success" | "error", msg: string) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    alerte_delai_depot_jours: "7",
    alerte_delai_remboursement_jours: "14",
    alerte_email_actif: "true",
  });

  useEffect(() => {
    fetch("/api/parametres")
      .then((r) => r.json())
      .then((data: Record<string, string>) => {
        setForm({
          alerte_delai_depot_jours: data.alerte_delai_depot_jours ?? "7",
          alerte_delai_remboursement_jours:
            data.alerte_delai_remboursement_jours ?? "14",
          alerte_email_actif: data.alerte_email_actif ?? "true",
        });
      });
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const params = Object.entries(form).map(([cle, valeur]) => ({ cle, valeur }));
      const res = await fetch("/api/parametres", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ params }),
      });
      if (!res.ok) throw new Error();
      onToast("success", "Paramètres d'alertes sauvegardés");
    } catch {
      onToast("error", "Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  }

  const emailActif = form.alerte_email_actif === "true";

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Configuration des alertes</h2>
        <p className="text-sm text-gray-500 mb-5">
          Définissez les seuils d&apos;alerte pour les délais AGEFICE
        </p>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alerte dépôt — déclencher X jours avant la date limite
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                value={form.alerte_delai_depot_jours}
                onChange={(e) =>
                  setForm((p) => ({ ...p, alerte_delai_depot_jours: e.target.value }))
                }
                className="w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-500">jours avant la date limite de dépôt</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alerte remboursement — déclencher X jours avant la date limite
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                value={form.alerte_delai_remboursement_jours}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    alerte_delai_remboursement_jours: e.target.value,
                  }))
                }
                className="w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-500">jours avant la date limite de remboursement</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-700">Alertes par email</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Recevoir les alertes par email à l&apos;adresse configurée dans l&apos;onglet Organisme
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setForm((p) => ({
                  ...p,
                  alerte_email_actif: emailActif ? "false" : "true",
                }))
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                emailActif ? "bg-blue-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  emailActif ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <SaveButton onClick={handleSave} loading={saving} />
        </div>
      </div>
    </div>
  );
}

// ===================== EMAIL TAB =====================
function EmailTab({ onToast }: { onToast: (type: "success" | "error", msg: string) => void }) {
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [form, setForm] = useState({
    smtp_host: "", smtp_port: "587", smtp_user: "", smtp_pass: "", smtp_from: "",
    imap_host: "", imap_port: "993",
  });

  useEffect(() => {
    fetch("/api/parametres")
      .then((r) => r.json())
      .then((data: Record<string, string>) => {
        setForm({
          smtp_host: data.smtp_host ?? "", smtp_port: data.smtp_port ?? "587",
          smtp_user: data.smtp_user ?? "", smtp_pass: data.smtp_pass ?? "",
          smtp_from: data.smtp_from ?? "",
          imap_host: data.imap_host ?? "", imap_port: data.imap_port ?? "993",
        });
      });
  }, []);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  async function handleSave() {
    setSaving(true);
    try {
      const params = Object.entries(form).map(([cle, valeur]) => ({ cle, valeur }));
      const res = await fetch("/api/parametres", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ params }),
      });
      if (!res.ok) throw new Error();
      onToast("success", "Configuration email sauvegardée");
    } catch {
      onToast("error", "Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    try {
      const res = await fetch("/api/parametres/email-test", { method: "POST" });
      const data = await res.json();
      if (res.ok) onToast("success", "Email de test envoyé avec succès ✓");
      else onToast("error", data.error ?? "Échec de l'envoi");
    } catch {
      onToast("error", "Erreur réseau");
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* SMTP */}
      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        <div className="px-5 py-4">
          <h2 className="font-semibold text-gray-900">Envoi — SMTP</h2>
          <p className="text-xs text-gray-400 mt-0.5">Serveur d&apos;envoi d&apos;emails (signature, alertes, conversations)</p>
        </div>
        <div className="px-5 py-5 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Serveur SMTP</label>
              <input className={inputClass} value={form.smtp_host} onChange={set("smtp_host")} placeholder="smtp.gmail.com" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Port</label>
              <input className={inputClass} value={form.smtp_port} onChange={set("smtp_port")} placeholder="587" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Identifiant</label>
              <input className={inputClass} value={form.smtp_user} onChange={set("smtp_user")} placeholder="vous@exemple.com" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Mot de passe</label>
              <input className={inputClass} type="password" value={form.smtp_pass} onChange={set("smtp_pass")} placeholder="••••••••" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Email expéditeur</label>
            <input className={inputClass} value={form.smtp_from} onChange={set("smtp_from")} placeholder="noreply@aissociate.re" />
            <p className="text-xs text-gray-400 mt-1">Si vide, l&apos;identifiant est utilisé comme expéditeur.</p>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-700">
            <strong>Gmail :</strong> utilisez un <em>mot de passe d&apos;application</em>. &nbsp;
            <strong>OVH / IONOS :</strong> smtp.mail.ovh.net · port 587
          </div>
        </div>
        <div className="px-5 py-4 flex justify-between items-center">
          <button onClick={handleTest} disabled={testing || !form.smtp_host}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium disabled:opacity-40">
            {testing ? "Envoi en cours…" : "Envoyer un email de test"}
          </button>
          <SaveButton onClick={handleSave} loading={saving} />
        </div>
      </div>

      {/* IMAP */}
      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        <div className="px-5 py-4">
          <h2 className="font-semibold text-gray-900">Réception — IMAP</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Permet de récupérer les réponses clients directement dans les conversations.
            Identifiant et mot de passe identiques au SMTP.
          </p>
        </div>
        <div className="px-5 py-5 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Serveur IMAP</label>
              <input className={inputClass} value={form.imap_host} onChange={set("imap_host")} placeholder="imap.gmail.com" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Port</label>
              <input className={inputClass} value={form.imap_port} onChange={set("imap_port")} placeholder="993" />
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-700">
            <strong>Gmail :</strong> imap.gmail.com · port 993 &nbsp;|&nbsp;
            <strong>OVH / IONOS :</strong> imap.mail.ovh.net · port 993
          </div>
        </div>
        <div className="px-5 py-4 flex justify-end">
          <SaveButton onClick={handleSave} loading={saving} />
        </div>
      </div>
    </div>
  );
}

// ===================== IA TAB =====================
function IATab({ onToast }: { onToast: (type: "success" | "error", msg: string) => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    ia_modele: "claude-haiku-4-5-20251001",
    ia_temperature: "0.7",
    ia_prompt_systeme: "",
  });

  useEffect(() => {
    fetch("/api/parametres")
      .then((r) => r.json())
      .then((data: Record<string, string>) => {
        setForm({
          ia_modele: data.ia_modele ?? "claude-haiku-4-5-20251001",
          ia_temperature: data.ia_temperature ?? "0.7",
          ia_prompt_systeme: data.ia_prompt_systeme ?? "",
        });
      });
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const params = Object.entries(form).map(([cle, valeur]) => ({ cle, valeur }));
      const res = await fetch("/api/parametres", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ params }),
      });
      if (!res.ok) throw new Error();
      onToast("success", "Paramètres IA sauvegardés");
    } catch {
      onToast("error", "Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  }

  const MODELES = [
    { id: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5 — rapide, économique" },
    { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6 — équilibré" },
    { id: "claude-opus-4-7", label: "Claude Opus 4.7 — le plus puissant" },
  ];

  const DEFAULT_PROMPT = `Tu es un assistant administratif expert en gestion de formations professionnelles pour l'AGEFICE. Tu rédiges des emails professionnels, clairs et bienveillants. Tes emails sont concis, en français, avec une formule de politesse adaptée. Tu n'inventes jamais d'informations.`;

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        <div className="px-5 py-4">
          <h2 className="font-semibold text-gray-900">Paramètres IA — Rédaction d&apos;emails</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Configure le comportement du modèle Claude pour la génération de brouillons
          </p>
        </div>

        <div className="px-5 py-5 space-y-5">
          {/* Modèle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Modèle Claude</label>
            <div className="space-y-2">
              {MODELES.map((m) => (
                <label key={m.id} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="ia_modele"
                    value={m.id}
                    checked={form.ia_modele === m.id}
                    onChange={() => setForm((p) => ({ ...p, ia_modele: m.id }))}
                    className="accent-[#1F4E79]"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900">{m.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Température */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Température —{" "}
              <span className="font-normal text-gray-500">
                {parseFloat(form.ia_temperature) <= 0.3
                  ? "Très factuelle"
                  : parseFloat(form.ia_temperature) <= 0.6
                  ? "Équilibrée"
                  : parseFloat(form.ia_temperature) <= 0.8
                  ? "Créative"
                  : "Très créative"}
              </span>
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={form.ia_temperature}
                onChange={(e) => setForm((p) => ({ ...p, ia_temperature: e.target.value }))}
                className="w-64 accent-[#1F4E79]"
              />
              <span className="text-sm font-mono text-gray-700 w-10">{form.ia_temperature}</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Valeur basse = emails plus prévisibles · Valeur haute = formulations plus variées
            </p>
          </div>

          {/* Prompt système */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">Prompt système</label>
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, ia_prompt_systeme: DEFAULT_PROMPT }))}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Remettre par défaut
              </button>
            </div>
            <textarea
              rows={6}
              value={form.ia_prompt_systeme || DEFAULT_PROMPT}
              onChange={(e) => setForm((p) => ({ ...p, ia_prompt_systeme: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono"
              placeholder={DEFAULT_PROMPT}
            />
            <p className="text-xs text-gray-400 mt-1">
              Ce prompt définit le ton et le comportement général de l&apos;IA. Il est injecté au début de chaque génération de brouillon.
            </p>
          </div>
        </div>

        <div className="px-5 py-4 flex justify-end">
          <SaveButton onClick={handleSave} loading={saving} />
        </div>
      </div>

      {/* Info box */}
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm text-amber-800">
        <strong>Contexte automatiquement injecté :</strong> lors de la génération d&apos;un brouillon, l&apos;IA reçoit automatiquement les informations du client (nom, entreprise, SIRET, email), ses notes internes, ses dossiers récents, et l&apos;historique de la conversation email.
      </div>
    </div>
  );
}

// ===================== MAIN PAGE =====================
export default function ParametresPage() {
  const [tab, setTab] = useState<Tab>("organisme");
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const handleToast = useCallback(
    (type: "success" | "error", msg: string) => {
      setToast({ type, msg });
      setTimeout(() => setToast(null), 3000);
    },
    []
  );

  const tabs: { key: Tab; label: string }[] = [
    { key: "organisme", label: "Organisme" },
    { key: "agefice", label: "AGEFICE" },
    { key: "formations", label: "Formations" },
    { key: "alertes", label: "Alertes" },
    { key: "email", label: "Email SMTP" },
    { key: "ia", label: "IA / Rédaction" },
  ];

  return (
    <div className="space-y-6">
      {toast && <Toast type={toast.type} msg={toast.msg} />}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configuration de l&apos;application AIssociate
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 flex gap-0">
        {tabs.map((t) => (
          <TabButton key={t.key} active={tab === t.key} onClick={() => setTab(t.key)}>
            {t.label}
          </TabButton>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {tab === "organisme" && <OrganismeTab onToast={handleToast} />}
        {tab === "agefice" && <AgeficeTab onToast={handleToast} />}
        {tab === "formations" && <FormationsTab onToast={handleToast} />}
        {tab === "alertes" && <AlertesTab onToast={handleToast} />}
        {tab === "email" && <EmailTab onToast={handleToast} />}
        {tab === "ia" && <IATab onToast={handleToast} />}
      </div>
    </div>
  );
}
