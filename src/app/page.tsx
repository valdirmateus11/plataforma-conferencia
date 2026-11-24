import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { RegistrationForm } from "@/components/forms/registration-form";
import {
  Calendar,
  MapPin,
  Users,
  ShieldCheck,
  AlertCircle,
  Lock,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();

  // 1. Obtenção dos dados da Conferência ativa
  const { data: conference } = await supabase
    .from("conferences")
    .select("*")
    .eq("slug", "iii-conferencia-distrital-luanda-2026")
    .maybeSingle();

  // 2. Verificação no servidor da contagem de vagas ocupadas
  let activeRegistrationsCount = 0;
  if (conference) {
    const { count } = await supabase
      .from("registrations")
      .select("id", { count: "exact", head: true })
      .eq("conference_id", conference.id)
      .in("status", ["pending", "approved"]);

    activeRegistrationsCount = count || 0;
  }

  const capacity = conference?.capacity || 500;
  const isCapacityReached = activeRegistrationsCount >= capacity;
  const isRegistrationOpen = conference?.registration_open ?? true;
  const canRegister = isRegistrationOpen && !isCapacityReached;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/70">
      {/* Cabeçalho Institucional */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 backdrop-blur-md bg-white/90">
        <div className="max-w-4xl mx-auto px-4 py-3.5 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm shadow-blue-500/20">
              CDJ
            </div>
            <div>
              <p className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider">
                Província de Luanda
              </p>
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                Conferência Distrital da Juventude
              </h2>
            </div>
          </div>

          <Link
            href="/admin/login"
            className="text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-50"
            title="Acesso reservado aos membros da organização"
          >
            <Lock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Acesso Administrativo</span>
          </Link>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 sm:px-6 sm:py-12">
        {/* Banner do Evento */}
        <div className="text-center mb-8 sm:mb-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80">
            <Calendar className="w-3.5 h-3.5" />
            III Sessão Bienal — Luanda 2026
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Inscrição Oficial de Participantes
          </h1>

          <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
            Preencha o formulário abaixo para registar a sua participação. A vaga será
            reservada e o seu código único de inscrição será emitido de imediato.
          </p>

          {/* Destaques rápidos */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              Luanda, Angola
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              Lotação Máxima: {capacity} participantes
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Credenciamento Presencial Seguro
            </span>
          </div>
        </div>

        {/* Cenário 1: Inscrições Encerradas */}
        {!isRegistrationOpen && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center space-y-3 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-amber-900">
              Inscrições Temporariamente Encerradas
            </h2>
            <p className="text-xs sm:text-sm text-amber-800 max-w-md mx-auto leading-relaxed">
              O período público de receção de inscrições para esta edição da Conferência
              encontra-se encerrado. Para mais informações, contacte a comissão organizadora.
            </p>
          </div>
        )}

        {/* Cenário 2: Capacidade de 500 Vagas Esgotada */}
        {isRegistrationOpen && isCapacityReached && (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-8 text-center space-y-3 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-blue-950">
              Lotação Máxima Atingida ({capacity} Vagas)
            </h2>
            <p className="text-xs sm:text-sm text-blue-800 max-w-md mx-auto leading-relaxed">
              Foi atingido o limite máximo de 500 participantes previsto para a III Sessão
              Bienal. A plataforma bloqueou novas submissões para garantir a organização e
              segurança do evento.
            </p>
          </div>
        )}

        {/* Cenário 3: Formulário Aberto */}
        {canRegister && <RegistrationForm />}
      </main>

      {/* Rodapé Institucional */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 text-center sm:text-left">
          <p>
            © 2026 III Sessão Bienal da Conferência Distrital da Juventude de Luanda. Todos os
            direitos reservados.
          </p>

          <Link
            href="/admin/login"
            className="text-slate-400 hover:text-blue-600 transition-colors text-[11px] font-medium"
          >
            Painel da Organização
          </Link>
        </div>
      </footer>
    </div>
  );
}
