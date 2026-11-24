"use client";

import { useState, useTransition } from "react";
import { Check, CheckCircle2, Loader2, X, ShieldAlert, Lock, AlertCircle } from "lucide-react";
import { recordAttendance, voidAttendance } from "@/features/attendance/actions/attendance-actions";
import type { SessionStatus } from "@/types/database.types";

interface AttendanceCheckinButtonProps {
  sessionId: string;
  registrationId: string;
  participantName: string;
  sessionStatus: SessionStatus;
  attendanceRecord: {
    id: string;
    status: "present" | "voided";
    recorded_at: string;
  } | null;
  isSuperAdmin: boolean;
}

export function AttendanceCheckinButton({
  sessionId,
  registrationId,
  participantName,
  sessionStatus,
  attendanceRecord,
  isSuperAdmin,
}: AttendanceCheckinButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isVoidModalOpen, setIsVoidModalOpen] = useState(false);
  const [voidReason, setVoidReason] = useState("");

  const isPresent = attendanceRecord?.status === "present";
  const isOpen = sessionStatus === "open";

  function handleCheckin() {
    setErrorMessage(null);
    startTransition(async () => {
      const res = await recordAttendance(sessionId, registrationId);
      if (res.error) {
        setErrorMessage(res.error);
      }
    });
  }

  function handleVoid() {
    if (!attendanceRecord) return;
    setErrorMessage(null);
    startTransition(async () => {
      const res = await voidAttendance(attendanceRecord.id, registrationId, voidReason);
      if (res.error) {
        setErrorMessage(res.error);
      } else {
        setIsVoidModalOpen(false);
        setVoidReason("");
      }
    });
  }

  // 1. Estado: Já Presente nesta Sessão (Prevenção de Duplicados)
  if (isPresent) {
    const timeFormatted = new Date(attendanceRecord.recorded_at).toLocaleTimeString("pt-PT", {
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <div className="flex flex-col items-end gap-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Presente às {timeFormatted}</span>
        </div>

        {isSuperAdmin && (
          <>
            <button
              onClick={() => setIsVoidModalOpen(true)}
              className="text-[10px] text-rose-500 hover:text-rose-700 underline font-medium"
            >
              Anular Presença
            </button>

            {/* Modal de Anulação Exclusivo de Superadmin */}
            {isVoidModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 border border-rose-200 text-left">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                      <ShieldAlert className="w-5 h-5" />
                      Anular Registo de Presença
                    </div>
                    <button
                      onClick={() => setIsVoidModalOpen(false)}
                      className="text-slate-400 hover:text-slate-600 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    A anulação de presença retira a confirmação de <strong>{participantName}</strong> nesta
                    sessão plenária e recalcula o quórum. Esta operação requer justificativa e fica gravada
                    na auditoria.
                  </p>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Motivo Obrigatório da Anulação <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      value={voidReason}
                      onChange={(e) => setVoidReason(e.target.value)}
                      placeholder="Ex.: Registo efetuado por engano ou participante retirou-se antes da deliberação..."
                      rows={3}
                      className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-rose-500 focus:outline-none"
                    />
                  </div>

                  {errorMessage && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                      {errorMessage}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      onClick={() => setIsVoidModalOpen(false)}
                      disabled={isPending}
                      className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleVoid}
                      disabled={isPending || voidReason.trim().length < 5}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition"
                    >
                      {isPending ? "Anulando..." : "Confirmar Anulação"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // 2. Estado: Sessão Não Aberta
  if (!isOpen) {
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 text-xs font-medium cursor-not-allowed">
        <Lock className="w-3.5 h-3.5 text-slate-400" />
        Sessão Fechada
      </span>
    );
  }

  // 3. Estado: Aberto e Não Registado (1-click check-in)
  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleCheckin}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition transform active:scale-95"
      >
        {isPending ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Marcando...
          </>
        ) : (
          <>
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            Marcar Presença
          </>
        )}
      </button>

      {errorMessage && (
        <span className="text-[10px] text-rose-600 font-semibold max-w-xs text-right flex items-center gap-1">
          <AlertCircle className="w-3 h-3 shrink-0" />
          {errorMessage}
        </span>
      )}
    </div>
  );
}
