"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, Ban, RefreshCw, Loader2, AlertCircle } from "lucide-react";
import type { RegistrationStatus } from "@/types/database.types";
import { updateRegistrationStatus } from "@/features/registrations/actions/admin-registration-actions";

interface Props {
  registrationId: string;
  currentStatus: RegistrationStatus;
}

export function RegistrationApprovalCard({ registrationId, currentStatus }: Props) {
  const [status, setStatus] = useState<RegistrationStatus>(currentStatus);
  const [reason, setReason] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleAction = async (newStatus: RegistrationStatus) => {
    // Para rejeição ou cancelamento, o motivo é fortemente recomendado/obrigatório
    if ((newStatus === "rejected" || newStatus === "cancelled") && !reason.trim()) {
      setFeedback({
        type: "error",
        text: "Por favor, indique uma justificação/motivo para rejeitar ou cancelar a inscrição.",
      });
      return;
    }

    setIsPending(true);
    setFeedback(null);

    const result = await updateRegistrationStatus(registrationId, newStatus, reason);

    if (result.success) {
      setStatus(result.newStatus);
      setReason("");
      setFeedback({
        type: "success",
        text: result.message,
      });
    } else {
      setFeedback({
        type: "error",
        text: result.error,
      });
    }

    setIsPending(false);
  };

  return (
    <div className="bg-[#F1F5F9] rounded-2xl border border-slate-300/80 p-6 shadow-sm space-y-4">
      <div className="border-b border-slate-200 pb-3">
        <h3 className="text-sm font-bold text-slate-900">
          Ações de Validação Administrativa
        </h3>
        <p className="text-xs text-slate-600">
          Decisão oficial sobre a participação do delegado na IIIª Sessão Bienal.
        </p>
      </div>

      {feedback && (
        <div
          role="status"
          className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" aria-hidden="true" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" aria-hidden="true" />
          )}
          <p className="leading-relaxed font-medium">{feedback.text}</p>
        </div>
      )}

      {/* Campo de Motivo/Justificação */}
      <div>
        <label htmlFor="reason" className="block text-xs font-medium text-slate-700 mb-1.5">
          Motivo da Decisão / Observação Administrativa
        </label>
        <textarea
          id="reason"
          rows={2}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={isPending}
          placeholder="Ex.: Delegação homologada pelo Pastor distrital / Documentação em conformidade..."
          className="w-full rounded-xl border border-slate-300 bg-[#F1F5F9] p-3 text-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
        <p className="text-xs text-slate-500 mt-1">
          Obrigatório para rejeições ou cancelamentos. Ficará registado na trilha de auditoria.
        </p>
      </div>

      {/* Botões de Ação */}
      <div className="flex flex-wrap items-center gap-2.5 pt-2">
        {status !== "approved" && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => handleAction("approved")}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 active:scale-95 transition-all shadow-sm disabled:opacity-50"
          >
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            Aprovar Inscrição
          </button>
        )}

        {status !== "rejected" && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => handleAction("rejected")}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-rose-300 bg-rose-50 text-rose-700 text-xs font-semibold hover:bg-rose-100 active:scale-95 transition-all disabled:opacity-50"
          >
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
            Rejeitar Inscrição
          </button>
        )}

        {status === "approved" && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => handleAction("cancelled")}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 active:scale-95 transition-all disabled:opacity-50"
          >
            <Ban className="w-3.5 h-3.5" />
            Cancelar Inscrição
          </button>
        )}

        {(status === "rejected" || status === "cancelled") && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => handleAction("pending")}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-blue-300 bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100 active:scale-95 transition-all disabled:opacity-50"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reativar Inscrição (Sob Limite de Vagas)
          </button>
        )}
      </div>
    </div>
  );
}
