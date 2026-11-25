"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, LayoutDashboard } from "lucide-react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[AdminError]", error.digest || "sem-digest");
  }, [error]);

  return (
    <div className="max-w-lg mx-auto my-12 rounded-2xl border border-rose-200 bg-[#F1F5F9] p-8 text-center shadow-sm space-y-4">
      <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
        <AlertTriangle className="w-6 h-6" aria-hidden="true" />
      </div>

      <div className="space-y-1.5">
        <h2 className="text-lg font-bold text-slate-900">
          Não foi possível carregar esta página
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Ocorreu uma falha temporária ao processar os dados administrativos. Pode tentar
          novamente ou regressar ao painel geral.
        </p>
        {error.digest && (
          <p className="text-xs font-mono text-slate-400 pt-1">
            Referência: {error.digest}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors shadow-sm"
        >
          <RefreshCw className="w-4 h-4" aria-hidden="true" />
          Tentar Novamente
        </button>

        <Link
          href="/admin/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-[#F1F5F9] hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
        >
          <LayoutDashboard className="w-4 h-4" aria-hidden="true" />
          Painel Geral
        </Link>
      </div>
    </div>
  );
}
