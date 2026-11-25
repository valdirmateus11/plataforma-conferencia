"use client";

import { useState, useTransition } from "react";
import { Plus, Loader2, Calendar, CheckCircle2, AlertCircle } from "lucide-react";
import { createSession } from "@/features/sessions/actions/session-actions";
import { CONFERENCE_CONFIG } from "@/lib/config";

export function CreateSessionForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setErrorMessage(null);
    setSuccessMessage(null);

    startTransition(async () => {
      const res = await createSession(formData);
      if (res.error) {
        setErrorMessage(res.error);
      } else {
        setSuccessMessage("Sessão plenária criada com sucesso!");
        setTimeout(() => {
          setIsOpen(false);
          setSuccessMessage(null);
        }, 1500);
      }
    });
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
      >
        <Plus className="w-4 h-4" aria-hidden="true" />
        Criar Nova Sessão Plenária
      </button>
    );
  }

  return (
    <div className="bg-[#F1F5F9] rounded-2xl border border-blue-300 p-6 shadow-sm space-y-4 w-full">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-200">
            <Calendar className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Nova Sessão Plenária</h3>
            <p className="text-xs text-slate-600">
              Agende sessões de trabalho, plenárias deliberativas ou cultos oficiais da conferência.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsOpen(false);
            setErrorMessage(null);
            setSuccessMessage(null);
          }}
          disabled={isPending}
          className="text-xs text-slate-500 hover:text-slate-700 font-medium px-2 py-1 rounded"
        >
          Cancelar
        </button>
      </div>

      {errorMessage && (
        <div role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div role="status" className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{successMessage}</span>
        </div>
      )}

      <form action={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label htmlFor="session-name" className="block font-semibold text-slate-700 mb-1">
              Nome da Sessão Plenária <span className="text-rose-500">*</span>
            </label>
            <input
              id="session-name"
              type="text"
              name="name"
              required
              placeholder="Ex.: 1ª Sessão Plenária — Abertura e Apresentação de Relatórios"
              className="w-full rounded-xl border border-slate-300 bg-[#F1F5F9] p-2.5 text-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="session-description" className="block font-semibold text-slate-700 mb-1">
              Descrição / Pauta dos Trabalhos (Opcional)
            </label>
            <textarea
              id="session-description"
              name="description"
              rows={2}
              placeholder="Ex.: Leitura do relatório bienal da liderança distrital e deliberação do quórum de abertura."
              className="w-full rounded-xl border border-slate-300 bg-[#F1F5F9] p-2.5 text-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label htmlFor="session-date" className="block font-semibold text-slate-700 mb-1">
              Data da Sessão <span className="text-rose-500">*</span>
            </label>
            <input
              id="session-date"
              type="date"
              name="sessionDate"
              required
              defaultValue={CONFERENCE_CONFIG.startDate}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-blue-500 focus:outline-none bg-[#F1F5F9] font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="session-starts" className="block font-semibold text-slate-700 mb-1">
                Hora de Início
              </label>
              <input
                id="session-starts"
                type="time"
                name="startsAt"
                defaultValue="08:30"
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-blue-500 focus:outline-none bg-[#F1F5F9] font-mono"
              />
            </div>
            <div>
              <label htmlFor="session-ends" className="block font-semibold text-slate-700 mb-1">
                Hora de Término
              </label>
              <input
                id="session-ends"
                type="time"
                name="endsAt"
                defaultValue="12:30"
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-blue-500 focus:outline-none bg-[#F1F5F9] font-mono"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            disabled={isPending}
            className="px-4 py-2 border border-slate-300 hover:bg-slate-200/70 text-slate-700 font-semibold rounded-xl text-xs transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl text-xs transition shadow-sm"
          >
            {isPending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                Criando Sessão...
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                Criar Sessão
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
