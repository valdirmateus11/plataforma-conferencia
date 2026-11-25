"use client";

import { useState, useTransition } from "react";
import { Play, Lock, RotateCcw, Ban, Loader2, AlertCircle } from "lucide-react";
import { updateSessionStatus } from "@/features/sessions/actions/session-actions";
import type { SessionStatus } from "@/types/database.types";

interface SessionStatusControlsProps {
  sessionId: string;
  sessionName: string;
  status: SessionStatus;
  isSuperAdmin: boolean;
}

export function SessionStatusControls({
  sessionId,
  sessionName,
  status,
  isSuperAdmin,
}: SessionStatusControlsProps) {
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleStatusChange(newStatus: SessionStatus) {
    let confirmMsg = `Deseja alterar a sessão "${sessionName}" para ${newStatus}?`;
    if (newStatus === "open") {
      confirmMsg = `Tem a certeza que deseja ABRIR a sessão "${sessionName}" para registo de presenças?`;
    } else if (newStatus === "closed") {
      confirmMsg = `Tem a certeza que deseja ENCERRAR a sessão "${sessionName}"? Nenhum novo registo de presença será permitido sem reabertura.`;
    } else if (newStatus === "cancelled") {
      confirmMsg = `Atenção: Deseja CANCELAR a sessão "${sessionName}"?`;
    }

    if (!confirm(confirmMsg)) return;

    setErrorMessage(null);
    startTransition(async () => {
      const res = await updateSessionStatus(sessionId, newStatus);
      if (res.error) {
        setErrorMessage(res.error);
      }
    });
  }

  if (isPending) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" aria-hidden="true" />
        <span>Atualizando...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex flex-wrap items-center gap-2">
        {status === "planned" && (
          <button
            type="button"
            onClick={() => handleStatusChange("open")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
          >
            <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
            Abrir Sessão
          </button>
        )}

        {status === "open" && (
          <button
            type="button"
            onClick={() => handleStatusChange("closed")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
          >
            <Lock className="w-3.5 h-3.5" aria-hidden="true" />
            Encerrar Sessão
          </button>
        )}

        {status === "closed" && (
          <button
            type="button"
            onClick={() => handleStatusChange("open")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-blue-300 bg-[#F1F5F9] text-blue-700 hover:bg-blue-50 rounded-xl text-xs font-semibold transition"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            Reabrir Sessão
          </button>
        )}

        {status !== "cancelled" && isSuperAdmin && (
          <button
            type="button"
            onClick={() => handleStatusChange("cancelled")}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-slate-500 hover:text-rose-600 text-xs font-medium transition"
            title="Cancelar Sessão"
          >
            <Ban className="w-3.5 h-3.5" aria-hidden="true" />
            Cancelar
          </button>
        )}
      </div>

      {errorMessage && (
        <span className="text-xs text-rose-600 font-medium flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          {errorMessage}
        </span>
      )}
    </div>
  );
}
