import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { RegistrationForm } from "@/components/forms/registration-form";
import { ConferenceLogo } from "@/components/ui/conference-logo";
import { FlyerPreviewCard } from "@/components/ui/flyer-preview-card";
import {
  Calendar,
  MapPin,
  Users,
  AlertCircle,
  Lock,
  BookOpen,
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
  const remainingSpots = Math.max(0, capacity - activeRegistrationsCount);
  const isCapacityReached = activeRegistrationsCount >= capacity;
  const isRegistrationOpen = conference?.registration_open ?? true;
  const canRegister = isRegistrationOpen && !isCapacityReached;

  return (
    <div className="min-h-screen flex flex-col bg-[#F1F5F9] overflow-x-hidden">
      {/* Cabeçalho Oficial da Aplicação */}
      <header className="bg-[#F1F5F9]/95 border-b border-slate-200 sticky top-0 z-30 backdrop-blur-md shadow-xs">
        <div className="max-w-6xl mx-auto px-4 py-3 sm:px-6 flex items-center justify-between gap-4">
          <ConferenceLogo size="md" href="/" />

          <Link
            href="/admin/login"
            className="text-xs font-semibold text-slate-600 hover:text-emerald-800 transition-colors flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 shadow-xs"
            title="Acesso reservado aos membros da organização"
          >
            <Lock className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-700" />
            <span className="hidden sm:inline">Acesso Administrativo</span>
          </Link>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 sm:px-6 sm:py-12">
        {/* Secção Hero com Apresentação Visual do Evento */}
        <section className="mb-10 sm:mb-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Coluna Esquerda: Título, Lema e Informações (Animação Esquerda -> Direita) */}
            <div className="lg:col-span-7 space-y-5 text-center lg:text-left animate-slide-left-to-right">
              {/* Título Principal com Tipografia Forte Inspirada no Flyer */}
              <div className="space-y-1">
                <h2 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-orange-600 uppercase leading-none">
                  IIIª SESSÃO BIENAL ORDINÁRIA DA
                </h2>

                <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-slate-900 leading-[1.05]">
                  CONFERÊNCIA{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600">
                    DISTRITAL
                  </span>{" "}
                  DA JUVENTUDE DE LUANDA
                </h1>
              </div>

              <p className="text-base sm:text-lg font-bold text-emerald-900/90 leading-relaxed">
                Direção Distrital da Juventude de Luanda
              </p>

              {/* Tema Central do Evento (Sem Card) */}
              <div className="space-y-1 text-left py-1">
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-800 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-emerald-700 shrink-0" />
                  Tema Central do Evento
                </p>
                <blockquote className="text-base sm:text-xl font-extrabold text-slate-900 leading-snug tracking-tight">
                  &ldquo;Avivados e Santificados em Cristo, Sejamos a Carta para o Mundo&rdquo;
                </blockquote>
                <p className="text-xs text-emerald-800 font-bold">
                  — (Actos 2:42-47, I Coríntios 3:2-3)
                </p>
              </div>

              {/* Informações de Local e Data (Ícones Limpos sem Fundo) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#F1F5F9] border border-slate-300/80 shadow-xs text-left">
                  <Calendar className="w-6 h-6 text-orange-600 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Data Oficial
                    </p>
                    <p className="text-xs sm:text-sm font-extrabold text-slate-900">
                      21 a 24 de Janeiro de 2027
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#F1F5F9] border border-slate-300/80 shadow-xs text-left">
                  <MapPin className="w-6 h-6 text-emerald-700 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Local do Evento
                    </p>
                    <p className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                      Cargo Pastoral Monte Sinai
                    </p>
                  </div>
                </div>
              </div>

              {/* Badge de Lotação */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-1 text-xs text-slate-600">
                <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                  <Users className="w-4 h-4 text-orange-600" />
                  Capacidade: {capacity} participantes ({remainingSpots} vagas disponíveis)
                </span>
              </div>
            </div>

            {/* Coluna Direita: Flyer Oficial do Evento (Animação Direita -> Esquerda) */}
            <div className="lg:col-span-5 flex justify-center animate-slide-right-to-left">
              <div className="w-full max-w-sm sm:max-w-md">
                <FlyerPreviewCard />
              </div>
            </div>
          </div>
        </section>

        {/* Separador Visual com Grafismo Inspirado no Flyer */}
        <div className="my-8 relative flex items-center justify-center">
          <div className="w-full h-px bg-gradient-to-r from-transparent via-emerald-800/20 to-transparent" />
          <div className="absolute px-4 bg-[#F1F5F9] text-xs font-bold uppercase tracking-widest text-emerald-950/70">
            Ficha de Registo Oficial
          </div>
        </div>

        {/* Secção de Inscrições */}
        <section className="max-w-3xl mx-auto">
          {/* Cenário 1: Inscrições Encerradas */}
          {!isRegistrationOpen && (
            <div className="rounded-3xl border border-amber-200 bg-amber-50/90 p-8 text-center space-y-3 shadow-sm">
              <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                <AlertCircle className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-amber-950">
                Inscrições Temporariamente Encerradas
              </h2>
              <p className="text-xs sm:text-sm text-amber-800 max-w-md mx-auto leading-relaxed">
                O período público de receção de inscrições para esta edição da Conferência
                encontra-se encerrado. Para mais informações, contacte a Direção Distrital da
                Juventude de Luanda.
              </p>
            </div>
          )}

          {/* Cenário 2: Capacidade de 500 Vagas Esgotada */}
          {isRegistrationOpen && isCapacityReached && (
            <div className="rounded-3xl border border-orange-200 bg-orange-50/90 p-8 text-center space-y-3 shadow-sm">
              <div className="w-14 h-14 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center mx-auto">
                <Users className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-orange-950">
                Lotação Máxima Atingida ({capacity} Vagas)
              </h2>
              <p className="text-xs sm:text-sm text-orange-800 max-w-md mx-auto leading-relaxed">
                Foi atingido o limite máximo de 500 participantes previsto para a IIIª Sessão
                Bienal Ordinária. O sistema bloqueou automaticamente novas submissões para
                garantir a segurança e organização do evento.
              </p>
            </div>
          )}

          {/* Cenário 3: Formulário Aberto */}
          {canRegister && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  Formulário de Inscrição de Delegados
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  Preencha os campos obrigatórios abaixo para assegurar a sua vaga oficial na
                  Conferência.
                </p>
              </div>
              <RegistrationForm />
            </div>
          )}
        </section>
      </main>

      {/* Rodapé Institucional com Identidade do Flyer */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 py-10 mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-800 text-center md:text-left">
            <ConferenceLogo size="lg" variant="dark" href="/" />

            <div className="text-xs space-y-1 text-slate-300">
              <p className="font-bold text-white uppercase tracking-wider">
                Direção Distrital da Juventude de Luanda
              </p>
              <p className="text-slate-400">
                Igreja Metodista Unida • Conferência Anual do Oeste de Angola
              </p>
              <p className="text-orange-400 font-semibold">
                Facebook: JUVENTUDE METODISTA - LUANDA
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 text-center sm:text-left">
            <p>
              © 2027 IIIª Sessão Bienal Ordinária da Conferência Distrital da Juventude de
              Luanda. Todos os direitos reservados.
            </p>

            <Link
              href="/admin/login"
              className="text-slate-400 hover:text-emerald-400 transition-colors text-[11px] font-medium flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              Painel Administrativo da Organização
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
