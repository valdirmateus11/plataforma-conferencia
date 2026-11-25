"use client";

import { useState, useTransition } from "react";
import {
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  ShieldAlert,
  Ban,
  Clock,
} from "lucide-react";
import {
  confirmAccreditation,
  revokeAccreditation,
} from "@/features/accreditation/actions/accreditation-actions";
import type { RegistrationStatus } from "@/types/database.types";

interface AccreditationActionButtonProps {
  registrationId: string;
  registrationCode: string;
  participantName: string;
  status: RegistrationStatus;
  accreditation: {
    id: string;
    status: "credentialed" | "revoked";
    credentialed_at: string;
    credentialed_by: string;
    reason: string | null;
  } | null;
  operatorName?: string | null;
  isSuperAdmin: boolean;
}

export function AccreditationActionButton({
  registrationId,
  registrationCode,
  participantName,
  status,
  accreditation,
  operatorName,
  isSuperAdmin,
}: AccreditationActionButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRevokeModalOpen, setIsRevokeModalOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [revokeReason, setRevokeReason] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isCredentialed = accreditation?.status === "credentialed";
  const isApproved = status === "approved";

  function handleConfirm() {
    setErrorMessage(null);
    startTransition(async () => {
      const res = await confirmAccreditation(registrationId, notes);
      if (res.error) {
        setErrorMessage(res.error);
      } else {
        setIsModalOpen(false);
        setNotes("");
      }
    });
  }

  function handleRevoke() {
    if (!accreditation) return;
    setErrorMessage(null);
    startTransition(async () => {
      const res = await revokeAccreditation(accreditation.id, registrationId, revokeReason);
      if (res.error) {
        setErrorMessage(res.error);
      } else {
        setIsRevokeModalOpen(false);
        setRevokeReason("");
      }
    });
  }

  // 1. Estado: Já Credenciado (Bloqueio de duplicação)
  if (isCredentialed) {
    const credDate = new Date(accreditation.credentialed_at);
    const dateFormatted = credDate.toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "2-digit",
    });
    const timeFormatted = credDate.toLocaleTimeString("pt-PT", {
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <div className="flex flex-col items-end gap-1.5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-blue-600" />
          <span>Credenciado ({dateFormatted} às {timeFormatted})</span>
        </div>

        {operatorName && (
          <span className="text-xs text-slate-500 font-medium">
            Operador: {operatorName}
          </span>
        )}

        {isSuperAdmin && (
          <>
            <button
              type="button"
              onClick={() => setIsRevokeModalOpen(true)}
              className="text-xs text-rose-600 hover:text-rose-800 underline font-medium mt-0.5"
            >
              Revogar Credenciamento
            </button>

            {/* Modal de Revogação Exclusivo de Superadmin */}
            {isRevokeModalOpen && (
              <div
                role="dialog"
                aria-modal="true"
                aria-label="Revogar Credenciamento"
                className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
              >
                <div className="bg-[#F1F5F9] rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 border border-rose-200 text-left">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                      <ShieldAlert className="w-5 h-5" aria-hidden="true" />
                      Revogar Credenciamento
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsRevokeModalOpen(false)}
                      aria-label="Fechar janela"
                      className="text-slate-500 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-200/70"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    A revogação de credenciamento cancela o crachá ativo de{" "}
                    <strong>{participantName}</strong> ({registrationCode}). Esta operação é sensível
                    e será gravada permanentemente na auditoria imutável.
                  </p>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Motivo Obrigatório da Revogação <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      value={revokeReason}
                      onChange={(e) => setRevokeReason(e.target.value)}
                      placeholder="Indique o motivo fundamentado para a revogação..."
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
                      onClick={() => setIsRevokeModalOpen(false)}
                      disabled={isPending}
                      className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleRevoke}
                      disabled={isPending || revokeReason.trim().length < 5}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition"
                    >
                      {isPending ? "Revogando..." : "Confirmar Revogação"}
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

  // 2. Estado: Inscrição Não Aprovada (Bloqueado)
  if (!isApproved) {
    if (status === "pending") {
      return (
        <div className="flex flex-col items-end">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Inscrição Pendente
          </span>
          <span className="text-[10px] text-slate-400 mt-1">
            Necessita de aprovação prévia
          </span>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-end">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
          <Ban className="w-3.5 h-3.5 text-rose-600" />
          {status === "rejected" ? "Inscrição Rejeitada" : "Inscrição Cancelada"}
        </span>
        <span className="text-[10px] text-slate-400 mt-1">Credenciamento bloqueado</span>
      </div>
    );
  }

  // 3. Estado: Elegível (Inscrição Aprovada e Não Credenciada)
  return (
    <div>
      <button
        onClick={() => setIsModalOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition transform active:scale-95"
      >
        <UserCheck className="w-4 h-4" />
        Credenciar Participante
      </button>

      {/* Modal de Confirmação Rápida no Secretariado */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Confirmar Credenciamento Presencial"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
        >
          <div className="bg-[#F1F5F9] rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 border border-emerald-200 text-left">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                <UserCheck className="w-5 h-5 text-emerald-600" aria-hidden="true" />
                Secretariado de Credenciamento
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Fechar janela"
                className="text-slate-500 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-200/70"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-200/50 p-3.5 rounded-xl border border-slate-300/80 space-y-1 text-xs">
              <div className="text-slate-600 text-xs">Participante Confirmado:</div>
              <div className="text-sm font-bold text-slate-900">{participantName}</div>
              <div className="font-mono text-emerald-700 font-semibold">{registrationCode}</div>
            </div>

            <p className="text-xs text-slate-600">
              Confirme que o participante se encontra presente fisicamente e que o material oficial da
              IIIª Sessão Bienal (crachá e pasta) foi entregue.
            </p>

            <div>
              <label htmlFor={`acc-notes-${registrationId}`} className="block text-xs font-semibold text-slate-700 mb-1">
                Observações de Secretariado (Opcional)
              </label>
              <input
                id={`acc-notes-${registrationId}`}
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex.: Crachá nº 140 entregue com pasta e material de apoio"
                className="w-full rounded-xl border border-slate-300 bg-[#F1F5F9] p-2.5 text-xs focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={isPending}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={isPending}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Confirmar Entrega de Crachá
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
