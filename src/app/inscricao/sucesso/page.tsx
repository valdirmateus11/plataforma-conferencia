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
} from "lucide-react";
import { ConferenceLogo } from "@/components/ui/conference-logo";

function SuccessContent() {
  const searchParams = useSearchParams();
  const queryCode = searchParams.get("code");

  const [registrationCode, setRegistrationCode] = useState(queryCode || "");
  const [participantName, setParticipantName] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
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
    <div className="max-w-xl w-full bg-[#F1F5F9] rounded-3xl border border-slate-300/90 shadow-xl p-6 sm:p-10 text-center">
      {/* Logótipo Oficial DDJL */}
      <div className="flex justify-center mb-6">
        <ConferenceLogo size="lg" href="/" />
      </div>

      {/* Ícone de Sucesso Institucional */}
      <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-4 text-emerald-600 shadow-xs">
        <CheckCircle2 className="w-9 h-9" />
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 mb-3">
        Inscrição Oficial Registada com Sucesso
      </div>

      <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 mb-2">
        {participantName ? `Obrigado, ${participantName}!` : "Inscrição Submetida!"}
      </h1>

      <p className="text-slate-600 text-sm leading-relaxed mb-6">
        A sua participação na{" "}
        <strong className="text-emerald-950 font-bold">
          III Sessão Bienal da Conferência Distrital da Juventude de Luanda (2026)
        </strong>{" "}
        foi submetida à Direcção Distrital da Juventude (D.D.J.L).
      </p>

      {/* Caixa de Destaque do Código Único de Inscrição */}
      <div className="bg-gradient-to-b from-emerald-50/70 to-slate-200/50 border border-emerald-200/90 rounded-2xl p-5 mb-6 text-center">
        <p className="text-xs uppercase tracking-wider text-emerald-900 font-bold mb-2">
          O seu Código Único de Inscrição (Apresentar no Balcão)
        </p>

        <div className="flex items-center justify-center gap-3">
          <span className="text-2xl sm:text-3xl font-mono font-black tracking-widest text-emerald-900 bg-[#F1F5F9] px-5 py-2.5 rounded-2xl border-2 border-emerald-600/40 shadow-sm">
            {registrationCode || "CDJ26-PENDENTE"}
          </span>

          <button
            onClick={handleCopyCode}
            type="button"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold border border-slate-300 bg-[#F1F5F9] hover:bg-slate-200 active:scale-95 transition-all text-slate-700 shadow-sm"
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

        <p className="text-[11px] text-slate-500 mt-2.5 font-medium">
          Tire uma captura de ecrã (screenshot) ou aponte este código com atenção.
        </p>
      </div>

      {/* Instruções Oficiais para o Dia da Conferência */}
      <div className="rounded-2xl border border-slate-300/80 bg-[#F1F5F9] p-4 sm:p-5 text-left space-y-3 mb-6 text-xs text-slate-700">
        <div className="flex items-center gap-2 text-slate-900 font-bold border-b border-slate-200/80 pb-2">
          <ShieldCheck className="w-4 h-4 text-emerald-700" />
          <span>Informações de Acolhimento e Credenciamento</span>
        </div>

        <div className="space-y-2 text-slate-600">
          <div className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-[10px]">
              1
            </span>
            <p>
              <strong>Data & Local:</strong> 21 a 24 de Janeiro de 2026, no{" "}
              <strong>Cargo Pastoral Monte Sinai</strong> (Distrito Eclesiástico de Luanda).
            </p>
          </div>

          <div className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-[10px]">
              2
            </span>
            <p>
              <strong>Credenciamento Presencial Manual:</strong> Apresente este código e o
              seu Bilhete de Identidade (B.I.) no Secretariado da Conferência para receber o seu
              crachá e pasta de congressista.
            </p>
          </div>
        </div>
      </div>

      {/* Botão de Regresso */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          href="/"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-[#F1F5F9] px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors shadow-sm"
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
    <main className="flex-1 min-h-screen flex flex-col justify-center items-center px-4 py-12 sm:px-6 lg:px-8 bg-[#F1F5F9]">
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
