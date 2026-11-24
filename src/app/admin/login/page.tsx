"use client";

import { useActionState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock, Mail, KeyRound, ArrowLeft, ShieldCheck, Loader2 } from "lucide-react";
import { signInAdmin } from "@/features/administration/actions/auth-actions";
import { ConferenceLogo } from "@/components/ui/conference-logo";

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/admin/dashboard";

  const [state, formAction, isPending] = useActionState(signInAdmin, null);

  return (
    <form action={formAction} className="space-y-4 text-left">
      <input type="hidden" name="redirectTo" value={redirectTo} />

      {state?.error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800">
          <p className="font-semibold">Erro de Autenticação</p>
          <p className="mt-0.5">{state.error}</p>
        </div>
      )}

      <div>
        <label
          htmlFor="email"
          className="block text-xs font-medium text-slate-700 mb-1.5"
        >
          E-mail do Operador / Administrador
        </label>
        <div className="relative">
          <input
            type="email"
            id="email"
            name="email"
            required
            autoComplete="email"
            placeholder="operador@cdjluanda.ao"
            disabled={isPending}
            className="w-full rounded-xl border border-slate-300 bg-[#F1F5F9] px-3.5 py-2.5 text-sm transition-colors focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
          <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
        </div>
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-xs font-medium text-slate-700 mb-1.5"
        >
          Palavra-passe
        </label>
        <div className="relative">
          <input
            type="password"
            id="password"
            name="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            disabled={isPending}
            className="w-full rounded-xl border border-slate-300 bg-[#F1F5F9] px-3.5 py-2.5 text-sm transition-colors focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
          <KeyRound className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
        </div>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-800 hover:from-emerald-900 hover:to-emerald-900 px-5 py-3 text-sm font-bold text-white shadow-md shadow-emerald-950/15 transition-all active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              A autenticar operador...
            </>
          ) : (
            <>
              <Lock className="w-4 h-4 text-emerald-300" />
              Entrar no Painel de Operações
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <main className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-[#F1F5F9] sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-[#F1F5F9] rounded-3xl border border-slate-300/90 shadow-xl p-8 sm:p-10 text-center">
        {/* Logótipo Oficial DDJL */}
        <div className="flex justify-center mb-6">
          <ConferenceLogo size="lg" href="/" />
        </div>

        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 mb-1">
          Acesso Administrativo
        </h1>

        <p className="text-xs text-slate-500 mb-6 font-medium">
          III Sessão Bienal da Conferência Distrital da Juventude de Luanda 2026
        </p>

        <Suspense
          fallback={
            <div className="py-8 text-center text-xs text-slate-400">
              A carregar formulário de acesso...
            </div>
          }
        >
          <LoginForm />
        </Suspense>

        {/* Rodapé do Login */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col items-center gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Acesso reservado exclusivamente aos operadores e secretariado.
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-emerald-700 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar ao Formulário Público de Inscrição
          </Link>
        </div>
      </div>
    </main>
  );
}
