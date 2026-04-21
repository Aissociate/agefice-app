"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Fingerprint, CheckCircle, Clock, AlertCircle } from "lucide-react";
import ThumbprintCanvas from "@/components/ThumbprintCanvas";
import { TYPES_DOCUMENTS } from "@/lib/utils";

interface DocInfo {
  role: "eleve" | "of";
  alreadySigned: boolean;
  otherSigned: boolean;
  bothSigned: boolean;
  docType: string;
  dossierNumero: string;
  formation: string;
  client: string;
  dateDebut: string;
  dateFin: string;
}

type PageState = "loading" | "error" | "already_signed" | "sign" | "done";

export default function SignerPage() {
  const { token } = useParams<{ token: string }>();
  const [info, setInfo] = useState<DocInfo | null>(null);
  const [state, setState] = useState<PageState>("loading");
  const [error, setError] = useState("");
  const [bothSigned, setBothSigned] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/signer/${token}`);
    if (!res.ok) {
      const { error: msg } = await res.json();
      setError(msg ?? "Lien invalide");
      setState("error");
      return;
    }
    const data: DocInfo = await res.json();
    setInfo(data);
    if (data.alreadySigned) setState("already_signed");
    else setState("sign");
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const handleConfirm = useCallback(async (data: { image: string; timestamp: string; userAgent: string }) => {
    const res = await fetch(`/api/signer/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const { error: msg } = await res.json();
      setError(msg ?? "Erreur lors de l'enregistrement");
      setState("error");
      return;
    }
    const { bothSigned: both } = await res.json();
    setBothSigned(both);
    setState("done");
  }, [token]);

  const roleLabel = info?.role === "eleve" ? "Stagiaire" : "Organisme de Formation";
  const otherLabel = info?.role === "eleve" ? "l'OF / formateur" : "le stagiaire";
  const docLabel = info ? (TYPES_DOCUMENTS[info.docType as keyof typeof TYPES_DOCUMENTS] ?? info.docType) : "";

  const fmt = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  if (state === "loading") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm animate-pulse">Chargement...</p>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 p-6">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <p className="text-red-600 font-medium text-center">{error}</p>
      </div>
    );
  }

  if (state === "already_signed") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 p-6">
        <CheckCircle className="w-14 h-14 text-green-500" />
        <h1 className="text-xl font-bold text-gray-900 text-center">Déjà signé</h1>
        <p className="text-gray-500 text-sm text-center">
          Votre empreinte a déjà été enregistrée pour ce document.
        </p>
        {info && !info.bothSigned && (
          <div className="mt-2 flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
            <Clock className="w-4 h-4 flex-shrink-0" />
            En attente de la signature de {otherLabel}
          </div>
        )}
        {info?.bothSigned && (
          <div className="mt-2 flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            Document signé par les deux parties
          </div>
        )}
      </div>
    );
  }

  if (state === "done") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 p-6">
        <CheckCircle className="w-14 h-14 text-green-500" />
        <h1 className="text-xl font-bold text-gray-900 text-center">Signature enregistrée</h1>
        <p className="text-gray-500 text-sm text-center">
          Votre empreinte a bien été enregistrée.
        </p>
        {bothSigned ? (
          <div className="mt-2 flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            Document signé par les deux parties ✓
          </div>
        ) : (
          <div className="mt-2 flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
            <Clock className="w-4 h-4 flex-shrink-0" />
            En attente de la signature de {otherLabel}
          </div>
        )}
      </div>
    );
  }

  // state === "sign"
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-5 py-4">
        <div className="flex items-center gap-2 mb-1">
          <Fingerprint className="w-5 h-5 text-indigo-600" />
          <span className="text-sm font-semibold text-indigo-600">Signature électronique</span>
        </div>
        <h1 className="text-base font-bold text-gray-900">{docLabel}</h1>
        <p className="text-xs text-gray-400 mt-0.5">Dossier n° {info?.dossierNumero}</p>
      </div>

      {/* Doc info card */}
      <div className="mx-4 mt-4 bg-white rounded-xl border border-gray-100 px-4 py-3 space-y-1.5 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">Stagiaire</span>
          <span className="font-medium text-gray-800">{info?.client}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Formation</span>
          <span className="font-medium text-gray-800 text-right max-w-[60%]">{info?.formation}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Période</span>
          <span className="font-medium text-gray-800">
            {info ? `${fmt(info.dateDebut)} → ${fmt(info.dateFin)}` : ""}
          </span>
        </div>
      </div>

      {/* Other party badge */}
      {info?.otherSigned && (
        <div className="mx-4 mt-3 flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          La signature de {otherLabel} est déjà enregistrée
        </div>
      )}
      {!info?.otherSigned && (
        <div className="mx-4 mt-3 flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-700">
          <Clock className="w-4 h-4 flex-shrink-0" />
          En attente de la signature de {otherLabel}
        </div>
      )}

      {/* Role badge */}
      <div className="mx-4 mt-3 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-700 font-medium">
        Vous signez en tant que : <span className="font-bold">{roleLabel}</span>
      </div>

      {/* Canvas */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6">
        <ThumbprintCanvas
          label="Posez votre pouce sur la zone ci-dessous"
          onConfirm={handleConfirm}
          onCancel={() => {}}
        />
      </div>

      <p className="text-center text-xs text-gray-300 pb-6">
        Horodatage et adresse IP enregistrés à des fins probatoires
      </p>
    </div>
  );
}
