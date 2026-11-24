import { createClient } from "@/lib/supabase/server";
import { getCurrentAdmin } from "@/features/administration/actions/auth-actions";
import {
  Calendar,
  ShieldAlert,
  Clock,
  Lock,
  Play,
  Ban,
  Users,
  PieChart,
} from "lucide-react";
import { CreateSessionForm } from "@/components/sessions/create-session-form";
import { SessionStatusControls } from "@/components/sessions/session-status-controls";
import type { SessionStatus } from "@/types/database.types";

export const dynamic = "force-dynamic";

export default async function AdminSessoesPage() {
  const currentAdmin = await getCurrentAdmin();

  const isAllowed =
    currentAdmin &&
    (currentAdmin.isSuperAdmin || currentAdmin.roles.includes("registration_admin"));

  if (!isAllowed) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl shadow-sm border border-slate-200 max-w-xl mx-auto my-12 space-y-4">
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900">Acesso Restrito a Sessões Plenárias</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          A criação e gestão do calendário de sessões da conferência é restrita ao Superadministrador e à
          Coordenação Geral.
        </p>
      </div>
    );
  }

  const supabase = await createClient();

  // 1. Obter a conferência ativa
  const { data: conference } = await supabase
    .from("conferences")
    .select("id, name")
    .eq("slug", "iii-conferencia-distrital-luanda-2026")
    .single();

  if (!conference) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-base font-bold text-slate-900">Conferência não configurada</h2>
      </div>
    );
  }

  const confId = conference.id;

  // 2. Obter total de participantes credenciados (base oficial do quórum)
  const { count: totalCredentialed } = await supabase
    .from("accreditations")
    .select("id", { count: "exact", head: true })
    .eq("conference_id", confId)
    .eq("status", "credentialed");

  const credentialedCount = totalCredentialed || 0;

  // 3. Obter todas as sessões
  const { data: sessions } = await supabase
    .from("sessions")
    .select("*")
    .eq("conference_id", confId)
    .order("session_date", { ascending: true })
    .order("sort_order", { ascending: true });

  const sessionList = sessions || [];

  // 4. Obter contagens de presenças por sessão
  const { data: attendanceCounts } = await supabase
    .from("attendance_records")
    .select("session_id, status")
    .eq("conference_id", confId)
    .eq("status", "present");

  const attendanceMap: Record<string, number> = {};
  (attendanceCounts || []).forEach((att) => {
    attendanceMap[att.session_id] = (attendanceMap[att.session_id] || 0) + 1;
  });

  const openSessionsCount = sessionList.filter((s) => s.status === "open").length;
  const closedSessionsCount = sessionList.filter((s) => s.status === "closed").length;

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-600" />
            Gestão de Sessões Plenárias & Cultos
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Controlo de abertura, encerramento e agendamento dos períodos de trabalho deliberativo.
          </p>
        </div>

        <CreateSessionForm />
      </div>

      {/* Cartões de Indicadores */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
            <Calendar className="w-4 h-4 text-blue-600" />
            Total de Sessões Agendadas
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{sessionList.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Calendário da III Sessão Bienal</div>
        </div>

        <div className="bg-white rounded-2xl border border-emerald-200 bg-emerald-50/20 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-700 text-xs font-semibold">
            <Play className="w-4 h-4 text-emerald-600 fill-current" />
            Sessões Abertas no Momento
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">{openSessionsCount}</div>
          <div className="text-[11px] text-emerald-600/80 mt-0.5">Aceitando registo de presenças</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
            <Lock className="w-4 h-4 text-slate-600" />
            Sessões Encerradas
          </div>
          <div className="text-2xl font-black text-slate-800 mt-2">{closedSessionsCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Trabalhos concluídos com quórum</div>
        </div>
      </div>

      {/* Lista de Sessões */}
      <div className="space-y-4">
        {sessionList.map((session) => {
          const presentCount = attendanceMap[session.id] || 0;
          const quorumPercent =
            credentialedCount > 0 ? Math.round((presentCount / credentialedCount) * 100) : 0;

          return (
            <div
              key={session.id}
              className={`bg-white rounded-2xl border p-5 shadow-sm transition ${
                session.status === "open"
                  ? "border-emerald-300 ring-2 ring-emerald-50"
                  : "border-slate-200"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    {session.status === "open" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                        ABERTA PARA PRESENÇAS
                      </span>
                    ) : session.status === "closed" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        <Lock className="w-3 h-3 text-slate-500" />
                        ENCERRADA
                      </span>
                    ) : session.status === "cancelled" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        <Ban className="w-3 h-3 text-rose-500" />
                        CANCELADA
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        <Clock className="w-3 h-3 text-blue-500" />
                        PLANEADA
                      </span>
                    )}

                    <span className="text-slate-400 text-xs font-mono font-medium">
                      Data:{" "}
                      {new Date(session.session_date).toLocaleDateString("pt-PT", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </span>

                    {session.starts_at && (
                      <span className="text-slate-500 text-xs font-mono">
                        ({session.starts_at.substring(0, 5)}
                        {session.ends_at ? ` - ${session.ends_at.substring(0, 5)}` : ""})
                      </span>
                    )}
                  </div>

                  <h2 className="text-base font-bold text-slate-900">{session.name}</h2>

                  {session.description && (
                    <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                      {session.description}
                    </p>
                  )}
                </div>

                {/* Controles de Estado */}
                <div className="shrink-0">
                  <SessionStatusControls
                    sessionId={session.id}
                    sessionName={session.name}
                    status={session.status as SessionStatus}
                    isSuperAdmin={Boolean(currentAdmin.isSuperAdmin)}
                  />
                </div>
              </div>

              {/* Barra de Quórum da Sessão */}
              <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span>Presenças Registadas:</span>
                    <span className="font-bold text-slate-900 font-mono text-sm">{presentCount}</span>
                  </div>

                  <div className="text-slate-400">|</div>

                  <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                    <PieChart className="w-4 h-4 text-emerald-600" />
                    <span>Quórum Atual:</span>
                    <span className="font-bold text-emerald-700 font-mono text-sm">
                      {quorumPercent}%
                    </span>
                    <span className="text-[11px] text-slate-400">
                      ({presentCount} de {credentialedCount} credenciados)
                    </span>
                  </div>
                </div>

                {/* Barra de Progresso Visual */}
                <div className="w-full sm:w-48 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, quorumPercent)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}

        {sessionList.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 text-xs">
            <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            Nenhuma sessão plenária configurada até ao momento.
            <div className="text-slate-400 mt-1">
              Clique em &ldquo;Criar Nova Sessão Plenária&rdquo; para agendar os trabalhos.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
