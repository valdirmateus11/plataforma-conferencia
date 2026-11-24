"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Copy,
  Check,
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const queryCode = searchParams.get("code");

  const [registrationCode, setRegistrationCode] = useState(queryCode || "");
  const [participantName, setParticipantName] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Tenta recuperar detalhes da sessão local para enriquecer o ecrã sem expor via URL
    try {
      const stored = sessionStorage.getItem("cdj26_registration_success");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.code) setRegistrationCode(parsed.code);
        if (parsed.name) setParticipantName(parsed.name);
      }
    } catch {
      // Ignora erro de acesso ao sessionStorage
    }
  }, []);

  const handleCopyCode = async () => {
    if (!registrationCode) return;
    try {
      await navigator.clipboard.writeText(registrationCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback simples caso clipboard falhe
    }
  };

  return (
    <div className="max-w-xl w-full bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-10 text-center">
      {/* Ícone de Sucesso Institucional */}
      <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-5 text-emerald-600">
        <CheckCircle2 className="w-9 h-9" />
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-3">
        Inscrição Recebida com Sucesso
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-2">
        {participantName ? `Obrigado, ${participantName}!` : "Inscrição Submetida!"}
      </h1>

      <p className="text-slate-600 text-sm leading-relaxed mb-6">
        A sua participação na <strong>III Sessão Bienal da Conferência Distrital da Juventude de Luanda</strong> foi
        registada na plataforma.
      </p>

      {/* Caixa de Destaque do Código Único de Inscrição */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-6 text-center">
        <p className="text-xs uppercase tracking-wider text-slate-500 font-medium mb-2">
          O seu Código Único de Inscrição
        </p>

        <div className="flex items-center justify-center gap-3">
          <span className="text-2xl sm:text-3xl font-mono font-bold tracking-wider text-blue-600 bg-white px-4 py-2 rounded-xl border border-blue-200 shadow-sm">
            {registrationCode || "CDJ26-PENDENTE"}
          </span>

          <button
            onClick={handleCopyCode}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-slate-300 bg-white hover:bg-slate-50 active:scale-95 transition-all text-slate-700 shadow-sm"
            title="Copiar código para a área de transferência"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-500" />
                <span>Copiar</span>
              </>
            )}
          </button>
        </div>

        <p className="text-[11px] text-slate-500 mt-2.5">
          Tire uma captura de ecrã (screenshot) ou aponte este código com atenção.
        </p>
      </div>

      {/* Aviso Institucional de Estado Pendente (Conforme Requisito 6.8) */}
      <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-left mb-6 text-xs text-amber-900 space-y-1.5">
        <div className="flex items-center gap-2 font-semibold">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          Estado: Aguardando Validação Administrativa
        </div>
        <p className="text-amber-800 leading-relaxed text-[11px]">
          A confirmação de submissão assegura a receção dos seus dados. A sua inscrição
          passará agora pelo processo de validação pela equipa organizadora. A aprovação
          final será confirmada antes do evento.
        </p>
      </div>

      {/* Instruções para o Credenciamento Presencial */}
      <div className="bg-slate-50 rounded-2xl border border-slate-100 p-5 text-left text-xs text-slate-600 space-y-3 mb-8">
        <p className="font-semibold text-slate-900 flex items-center gap-1.5 text-sm">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          Instruções para o Credenciamento Presencial:
        </p>

        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
              1
            </span>
            <p>
              Apresente o seu <strong>Código de Inscrição</strong> ou o seu número de
              telefone no balcão de credenciamento à entrada do evento.
            </p>
          </div>

          <div className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
              2
            </span>
            <p>
              O credenciamento é presencial e manual <em>(sem necessidade de leitura de QR Code)</em>.
              Será realizada a confirmação da sua identidade para entrega da credencial oficial.
            </p>
          </div>

          <div className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
              3
            </span>
            <p>
              Após o credenciamento, a sua presença será registada individualmente em cada
              sessão da Conferência.
            </p>
          </div>
        </div>
      </div>

      {/* Botão de Regresso */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          href="/"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar à Página Inicial
        </Link>
      </div>
    </div>
  );
}

export default function RegistrationSuccessPage() {
  return (
    <main className="flex-1 flex flex-col justify-center items-center px-4 py-12 sm:px-6 lg:px-8 bg-slate-50">
      <Suspense
        fallback={
          <div className="max-w-xl w-full bg-white rounded-3xl p-10 text-center border border-slate-200">
            <p className="text-sm text-slate-500">A carregar confirmação...</p>
          </div>
        }
      >
        <SuccessContent />
      </Suspense>
    </main>
  );
}
