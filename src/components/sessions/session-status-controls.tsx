"use client";

import { useTransition } from "react";
import { Play, Lock, RotateCcw, Ban, Loader2 } from "lucide-react";
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

    startTransition(async () => {
      const res = await updateSessionStatus(sessionId, newStatus);
      if (res.error) {
        alert(res.error);
      }
    });
  }

  if (isPending) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
        <span>Atualizando...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {status === "planned" && (
        <button
          onClick={() => handleStatusChange("open")}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          Abrir Sessão
        </button>
      )}

      {status === "open" && (
        <button
          onClick={() => handleStatusChange("closed")}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
        >
          <Lock className="w-3.5 h-3.5" />
          Encerrar Sessão
        </button>
      )}

      {status === "closed" && (
        <button
          onClick={() => handleStatusChange("open")}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-blue-200 text-blue-700 hover:bg-blue-50 rounded-xl text-xs font-semibold transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reabrir Sessão
        </button>
      )}

      {status !== "cancelled" && isSuperAdmin && (
        <button
          onClick={() => handleStatusChange("cancelled")}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-slate-400 hover:text-rose-600 text-[11px] font-medium transition"
          title="Cancelar Sessão"
        >
          <Ban className="w-3 h-3" />
          Cancelar
        </button>
      )}
    </div>
  );
}
