"use client";

import { useActionState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock, Mail, KeyRound, ArrowLeft, ShieldCheck, Loader2 } from "lucide-react";
import { signInAdmin } from "@/features/administration/actions/auth-actions";

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
          E-mail Administrativo
        </label>
        <div className="relative">
          <input
            type="email"
            id="email"
            name="email"
            required
            autoComplete="email"
            placeholder="admin@conferencia.cdj"
            disabled={isPending}
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          <KeyRound className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
        </div>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              A autenticar...
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              Entrar no Painel
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <main className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-slate-100 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200/90 shadow-sm p-8 sm:p-10 text-center">
        {/* Ícone e Título */}
        <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto mb-4 shadow-sm shadow-blue-500/20">
          <Lock className="w-6 h-6" />
        </div>

        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mb-1">
          Acesso Administrativo
        </h1>

        <p className="text-xs text-slate-500 mb-6">
          III Sessão Bienal da Conferência Distrital da Juventude de Luanda
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
            Acesso reservado exclusivamente à organização autorizada.
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-1 font-medium text-slate-600 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar ao Formulário Público de Inscrição
          </Link>
        </div>
      </div>
    </main>
  );
}
