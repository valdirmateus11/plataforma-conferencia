"use client";

import { useState, useTransition } from "react";
import { Sliders, Loader2, CheckCircle2, AlertCircle, Save } from "lucide-react";
import { updateConferenceSettings } from "@/features/administration/actions/settings-actions";
import { CONFERENCE_CONFIG } from "@/lib/config";

interface ConferenceSettingsFormProps {
  conference: {
    id: string;
    name: string;
    capacity: number;
    registration_open: boolean;
    code_prefix: string;
    description: string;
    start_date: string | null;
    end_date: string | null;
  };
}

export function ConferenceSettingsForm({ conference }: ConferenceSettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [capacity, setCapacity] = useState(conference.capacity);
  const [registrationOpen, setRegistrationOpen] = useState(conference.registration_open);
  const [codePrefix, setCodePrefix] = useState(conference.code_prefix);
  const [location, setLocation] = useState(conference.description || "Luanda, Angola");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const formData = new FormData();
    formData.append("conferenceId", conference.id);
    formData.append("capacity", capacity.toString());
    formData.append("registrationOpen", registrationOpen ? "true" : "false");
    formData.append("codePrefix", codePrefix);
    formData.append("location", location);

    startTransition(async () => {
      const res = await updateConferenceSettings(formData);
      if (res.error) {
        setErrorMessage(res.error);
      } else {
        setSuccessMessage("Configurações da conferência atualizadas e auditadas com sucesso!");
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="bg-[#F1F5F9] rounded-2xl border border-slate-300/80 p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <Sliders className="w-5 h-5 text-blue-600" aria-hidden="true" />
          <div>
            <h3 className="text-sm font-bold text-slate-900">Parâmetros Operacionais da Conferência</h3>
            <p className="text-xs text-slate-600">
              Controle a disponibilidade pública de inscrições e a lotação máxima do evento.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          {/* Estado de Abertura das Inscrições */}
          <div className="space-y-2 p-4 rounded-xl border border-slate-300/80 bg-slate-200/40">
            <span className="block font-bold text-slate-800">
              Disponibilidade do Portal Público de Inscrições
            </span>
            <p className="text-xs text-slate-600">
              Quando desativado, o formulário público em <code className="font-mono">/</code> é bloqueado
              com aviso informativo de inscrições encerradas.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="radio"
                  name="isOpen"
                  checked={registrationOpen}
                  onChange={() => setRegistrationOpen(true)}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                  Inscrições Abertas
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="radio"
                  name="isOpen"
                  checked={!registrationOpen}
                  onChange={() => setRegistrationOpen(false)}
                  className="text-rose-600 focus:ring-rose-500"
                />
                <span className="font-semibold text-rose-800 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
                  Inscrições Encerradas
                </span>
              </label>
            </div>
          </div>

          {/* Capacidade Máxima do Evento */}
          <div className="space-y-2 p-4 rounded-xl border border-slate-300/80 bg-slate-200/40">
            <label htmlFor="conf-capacity" className="block font-bold text-slate-800">
              Capacidade Limite de Participantes (Lotação Máxima)
            </label>
            <p className="text-xs text-slate-600">
              Teto rigoroso de validação e reativação com trava transacional no PostgreSQL.
            </p>
            <div className="pt-1 flex items-center flex-wrap gap-2">
              <input
                id="conf-capacity"
                type="number"
                min={1}
                max={5000}
                value={capacity}
                onChange={(e) => setCapacity(parseInt(e.target.value, 10) || 0)}
                required
                className="w-full sm:w-48 rounded-xl border border-slate-300 p-2.5 text-xs font-mono font-bold focus:border-blue-500 focus:outline-none bg-[#F1F5F9]"
              />
              <span className="text-slate-600 font-medium">participantes</span>
            </div>
          </div>

          {/* Prefixo do Código do Participante */}
          <div className="space-y-2 p-4 rounded-xl border border-slate-300/80 bg-slate-200/40">
            <label htmlFor="conf-prefix" className="block font-bold text-slate-800">
              Prefixo do Código de Inscrição
            </label>
            <p className="text-xs text-slate-600">
              Prefixo usado nos códigos únicos alfanuméricos gerados para os participantes.
            </p>
            <div className="pt-1">
              <input
                id="conf-prefix"
                type="text"
                maxLength={8}
                value={codePrefix}
                onChange={(e) => setCodePrefix(e.target.value.toUpperCase())}
                required
                placeholder={`Ex.: ${CONFERENCE_CONFIG.codePrefix}`}
                className="w-full sm:w-48 rounded-xl border border-slate-300 p-2.5 text-xs font-mono font-bold uppercase focus:border-blue-500 focus:outline-none bg-[#F1F5F9]"
              />
              <span className="block mt-1.5 text-xs text-slate-500">
                Formato gerado: <code className="font-mono">{codePrefix || CONFERENCE_CONFIG.codePrefix}-XXXXX</code>
              </span>
            </div>
          </div>

          {/* Local do Evento */}
          <div className="space-y-2 p-4 rounded-xl border border-slate-300/80 bg-slate-200/40">
            <label htmlFor="conf-location" className="block font-bold text-slate-800">
              Localização Oficial do Evento
            </label>
            <p className="text-xs text-slate-600">
              Designação do recinto onde decorrerá a {CONFERENCE_CONFIG.editionLabel}.
            </p>
            <div className="pt-1">
              <input
                id="conf-location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
                placeholder={`Ex.: ${CONFERENCE_CONFIG.city}`}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-blue-500 focus:outline-none bg-[#F1F5F9]"
              />
            </div>
          </div>
        </div>

        {/* Botão de Gravar */}
        <div className="flex items-center justify-end pt-2 border-t border-slate-200">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl text-xs transition shadow-sm"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Gravando alterações...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Guardar Configurações
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
