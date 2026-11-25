import Link from "next/link";
import { CONFERENCE_CONFIG } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import {
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  UserCheck,
  UserX,
  Gauge,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // 1. Obter a conferência ativa
  const { data: conference } = await supabase
    .from("conferences")
    .select("id, name, capacity, registration_open")
    .eq("slug", CONFERENCE_CONFIG.slug)
    .single();

  if (!conference) {
    return (
      <div className="p-8 text-center bg-[#F1F5F9] rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold text-slate-900">Conferência não encontrada</h2>
        <p className="text-slate-600 mt-2">Execute o seed inicial da base de dados.</p>
      </div>
    );
  }

  const confId = conference.id;
  const capacity = conference?.capacity || CONFERENCE_CONFIG.capacity;

  // 2. Obter contagens agregadas da tabela registrations
  const { count: totalRegistrations } = await supabase
    .from("registrations")
    .select("id", { count: "exact", head: true })
    .eq("conference_id", confId);

  const { count: pendingCount } = await supabase
    .from("registrations")
    .select("id", { count: "exact", head: true })
    .eq("conference_id", confId)
    .eq("status", "pending");

  const { count: approvedCount } = await supabase
    .from("registrations")
    .select("id", { count: "exact", head: true })
    .eq("conference_id", confId)
    .eq("status", "approved");

  const { count: rejectedOrCancelledCount } = await supabase
    .from("registrations")
    .select("id", { count: "exact", head: true })
    .eq("conference_id", confId)
    .in("status", ["rejected", "cancelled"]);

  // 3. Vagas ocupadas (pending + approved)
  const activeCount = (pendingCount || 0) + (approvedCount || 0);
  const remainingVagas = Math.max(0, capacity - activeCount);
  const capacityPercent = Math.min(100, Math.round((activeCount / capacity) * 100));

  // 4. Credenciamento
  const { count: credentialedCount } = await supabase
    .from("accreditations")
    .select("id", { count: "exact", head: true })
    .eq("conference_id", confId)
    .eq("status", "credentialed");

  const approved = approvedCount || 0;
  const credentialed = credentialedCount || 0;
  const pendingAccreditation = Math.max(0, approved - credentialed);

  // 5. Presenças Totais
  const { count: totalAttendance } = await supabase
    .from("attendance_records")
    .select("id", { count: "exact", head: true })
    .eq("conference_id", confId)
    .eq("status", "present");

  // 6. Inscrições Suspeitas de Duplicação
  const { count: duplicatesCount } = await supabase
    .from("registrations")
    .select("id", { count: "exact", head: true })
    .eq("conference_id", confId)
    .eq("is_suspected_duplicate", true);

  // 7. Últimas 6 inscrições para a lista rápida
  const { data: recentRegistrations } = await supabase
    .from("registrations")
    .select("id, registration_code, full_name, phone, participant_category, status, submitted_at, is_suspected_duplicate")
    .eq("conference_id", confId)
    .order("submitted_at", { ascending: false })
    .limit(6);

  return (
    <div className="space-y-8">
      {/* Cabeçalho da Página */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Painel Geral de Controlo
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Indicadores operacionais em tempo real da III Sessão Bienal.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/inscricoes"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm"
          >
            Gerir Inscrições
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Alerta de Suspeita de Duplicações se houver */}
      {(duplicatesCount || 0) > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-semibold">
                Existem {duplicatesCount} inscrições assinaladas com suspeita de duplicação
              </p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                Foram submetidas com número de telefone idêntico a outros registos. Necessitam de revisão pelo Validador.
              </p>
            </div>
          </div>
          <Link
            href="/admin/inscricoes?duplicate=true"
            className="px-3 py-1.5 rounded-xl bg-amber-200/80 text-amber-900 font-semibold hover:bg-amber-300 transition-colors shrink-0"
          >
            Ver Inscrições
          </Link>
        </div>
      )}

      {/* Bloco 1: Controlo de Vagas e Capacidade (Limite 500) */}
      <div className="bg-[#F1F5F9] rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Gauge className="w-5 h-5 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Controlo de Vagas (Limite Máximo: {capacity})
            </h2>
          </div>
          <span className="text-xs font-semibold text-slate-600">
            {activeCount} / {capacity} vagas ocupadas ({capacityPercent}%)
          </span>
        </div>

        {/* Barra de Progresso */}
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden mb-4">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              capacityPercent >= 90
                ? "bg-rose-500"
                : capacityPercent >= 75
                ? "bg-amber-500"
                : "bg-blue-600"
            }`}
            style={{ width: `${capacityPercent}%` }}
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-slate-500">Vagas Totais</p>
            <p className="text-lg font-bold text-slate-900 mt-0.5">{capacity}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-slate-500">Vagas Ocupadas</p>
            <p className="text-lg font-bold text-blue-600 mt-0.5">{activeCount}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-slate-500">Vagas Livres</p>
            <p className="text-lg font-bold text-emerald-600 mt-0.5">{remainingVagas}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-slate-500">Estado de Abertura</p>
            <p className="text-sm font-bold text-slate-900 mt-1">
              {conference?.registration_open ? "Aberto" : "Encerrado"}
            </p>
          </div>
        </div>
      </div>

      {/* Bloco 2: Cards com Métricas das Inscrições e Credenciamento */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Inscrições */}
        <div className="bg-[#F1F5F9] rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Total de Registos</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">
            {totalRegistrations || 0}
          </p>
          <p className="text-[11px] text-slate-400">Todas as submissões históricas</p>
        </div>

        {/* Pendentes */}
        <div className="bg-[#F1F5F9] rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-amber-600">
            <span className="text-xs font-medium">Inscrições Pendentes</span>
            <Clock className="w-4 h-4" />
          </div>
          <p className="text-2xl font-extrabold text-amber-700">
            {pendingCount || 0}
          </p>
          <p className="text-[11px] text-slate-400">Aguardam validação oficial</p>
        </div>

        {/* Aprovadas */}
        <div className="bg-[#F1F5F9] rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-xs font-medium">Inscrições Aprovadas</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-700">
            {approvedCount || 0}
          </p>
          <p className="text-[11px] text-slate-400">Elegíveis para credenciamento</p>
        </div>

        {/* Rejeitadas/Canceladas */}
        <div className="bg-[#F1F5F9] rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-rose-600">
            <span className="text-xs font-medium">Rejeitadas / Canceladas</span>
            <XCircle className="w-4 h-4" />
          </div>
          <p className="text-2xl font-extrabold text-rose-700">
            {rejectedOrCancelledCount || 0}
          </p>
          <p className="text-[11px] text-slate-400">Vagas libertadas</p>
        </div>
      </div>

      {/* Bloco 3: Credenciamento e Presenças */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#F1F5F9] rounded-2xl border border-slate-200 p-5 shadow-sm space-y-1.5">
          <div className="flex items-center gap-2 text-blue-600 text-xs font-semibold">
            <UserCheck className="w-4 h-4" />
            Credenciados no Local
          </div>
          <p className="text-2xl font-bold text-slate-900">{credentialed}</p>
          <p className="text-[11px] text-slate-500">Participantes já com credencial física</p>
        </div>

        <div className="bg-[#F1F5F9] rounded-2xl border border-slate-200 p-5 shadow-sm space-y-1.5">
          <div className="flex items-center gap-2 text-slate-600 text-xs font-semibold">
            <UserX className="w-4 h-4 text-slate-400" />
            Aprovados Não Credenciados
          </div>
          <p className="text-2xl font-bold text-slate-900">{pendingAccreditation}</p>
          <p className="text-[11px] text-slate-500">Ainda não se apresentaram no balcão</p>
        </div>

        <div className="bg-[#F1F5F9] rounded-2xl border border-slate-200 p-5 shadow-sm space-y-1.5">
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            Total de Registos de Presença
          </div>
          <p className="text-2xl font-bold text-slate-900">{totalAttendance || 0}</p>
          <p className="text-[11px] text-slate-500">Soma de assiduidade em todas as sessões</p>
        </div>
      </div>

      {/* Bloco 4: Inscrições Recentes */}
      <div className="bg-[#F1F5F9] rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Últimas Inscrições Submetidas
            </h3>
            <p className="text-xs text-slate-500">
              Acesso rápido para análise e validação.
            </p>
          </div>

          <Link
            href="/admin/inscricoes"
            className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
          >
            Ver todas ({totalRegistrations || 0})
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentRegistrations && recentRegistrations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5">Código</th>
                  <th className="py-2.5">Nome</th>
                  <th className="py-2.5">Categoria</th>
                  <th className="py-2.5">Telefone</th>
                  <th className="py-2.5">Estado</th>
                  <th className="py-2.5 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {recentRegistrations.map((reg) => (
                  <tr key={reg.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 font-mono font-semibold text-blue-600">
                      {reg.registration_code}
                    </td>
                    <td className="py-3 font-medium text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <span>{reg.full_name}</span>
                        {reg.is_suspected_duplicate && (
                          <span
                            className="w-2 h-2 rounded-full bg-amber-500"
                            title="Suspeita de Duplicação"
                          />
                        )}
                      </div>
                    </td>
                    <td className="py-3 text-slate-600">{reg.participant_category}</td>
                    <td className="py-3 text-slate-500">{reg.phone}</td>
                    <td className="py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          reg.status === "approved"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : reg.status === "pending"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {reg.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        href={`/admin/inscricoes/${reg.id}`}
                        className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        Avaliar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-400">
            Nenhuma inscrição submetida até ao momento.
          </div>
        )}
      </div>
    </div>
  );
}
