import { createClient } from "@/lib/supabase/server";
import { CONFERENCE_CONFIG } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAdmin } from "@/features/administration/actions/auth-actions";
import {
  ClipboardList,
  ShieldAlert,
  Users,
  PieChart,
  Building2,
  Phone,
  AlertCircle,
} from "lucide-react";
import { SessionSelector } from "@/components/attendance/session-selector";
import { AttendanceSearchBar } from "@/components/attendance/attendance-search-bar";
import { AttendanceCheckinButton } from "@/components/attendance/attendance-checkin-button";
import { formatGender, formatOrganizationalRole } from "@/lib/utils";
import type { Registration, SessionStatus } from "@/types/database.types";

export const dynamic = "force-dynamic";

interface SearchProps {
  searchParams: Promise<{
    session?: string;
    q?: string;
    filter?: string;
  }>;
}

export default async function AdminPresencasPage({ searchParams }: SearchProps) {
  const currentAdmin = await getCurrentAdmin();

  const allowedRoles = ["super_admin", "registration_admin", "attendance_operator"];
  const hasAccess = currentAdmin?.roles.some((r) => allowedRoles.includes(r));

  if (!currentAdmin || !hasAccess) {
    return (
      <div className="p-8 text-center bg-[#F1F5F9] rounded-2xl shadow-sm border border-slate-200 max-w-xl mx-auto my-12 space-y-4">
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900">Acesso Restrito ao Registo de Presenças</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          O módulo de controlo e check-in de presenças é reservado aos operadores de presenças e
          superadministradores da conferência.
        </p>
      </div>
    );
  }

  const params = await searchParams;
  const requestedSessionId = params.session;
  const searchQuery = (params.q || "").trim();
  const filterType = params.filter || "all";

  const supabase = await createClient();
  const adminClient = createAdminClient();

  // 1. Obter a conferência ativa
  const { data: conference } = await supabase
    .from("conferences")
    .select("id, name")
    .eq("slug", CONFERENCE_CONFIG.slug)
    .single();

  if (!conference) {
    return (
      <div className="p-8 text-center bg-[#F1F5F9] rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-base font-bold text-slate-900">Conferência não configurada</h2>
      </div>
    );
  }

  const confId = conference.id;

  // 2. Obter todas as sessões da conferência
  const { data: allSessions } = await supabase
    .from("sessions")
    .select("id, name, session_date, starts_at, ends_at, status")
    .eq("conference_id", confId)
    .order("session_date", { ascending: true })
    .order("sort_order", { ascending: true });

  const sessions = (allSessions || []) as Array<{
    id: string;
    name: string;
    session_date: string;
    starts_at: string | null;
    ends_at: string | null;
    status: SessionStatus;
  }>;

  // 3. Determinar a sessão selecionada
  let selectedSession = sessions.find((s) => s.id === requestedSessionId);
  if (!selectedSession) {
    // Dá prioridade à primeira sessão que esteja com status "open"
    selectedSession = sessions.find((s) => s.status === "open") || sessions[0] || null;
  }

  // 4. Obter total de participantes credenciados (base do quórum)
  const { count: totalCredentialed } = await supabase
    .from("accreditations")
    .select("id", { count: "exact", head: true })
    .eq("conference_id", confId)
    .eq("status", "credentialed");

  const credentialedCount = totalCredentialed || 0;

  // 5. Presenças registadas na sessão selecionada
  let presentCount = 0;
  const attendanceByRegId: Record<string, { id: string; status: "present" | "voided"; recorded_at: string }> = {};

  if (selectedSession) {
    const { data: sessionAttendances } = await supabase
      .from("attendance_records")
      .select("id, registration_id, status, recorded_at")
      .eq("session_id", selectedSession.id)
      .eq("status", "present");

    (sessionAttendances || []).forEach((att) => {
      attendanceByRegId[att.registration_id] = {
        id: att.id,
        status: att.status as "present" | "voided",
        recorded_at: att.recorded_at,
      };
    });

    presentCount = Object.keys(attendanceByRegId).length;
  }

  const quorumPercent =
    credentialedCount > 0 ? Math.round((presentCount / credentialedCount) * 100) : 0;
  const isQuorumSimple = quorumPercent >= 50;
  const isQuorumQualified = quorumPercent >= 66.7;

  // 6. Consultar participantes elegíveis (usa * para compatibilidade antes e após migração 00009)
  let regQuery = adminClient
    .from("registrations")
    .select(`
      *,
      accreditations!inner (
        id,
        status
      )
    `)
    .eq("conference_id", confId)
    .eq("accreditations.status", "credentialed");

  if (searchQuery) {
    const isCode = searchQuery.toUpperCase().startsWith("CDJ") || searchQuery.includes("-");
    const isNumeric = /^[0-9+]+$/.test(searchQuery);

    if (isCode) {
      regQuery = regQuery.ilike("registration_code", `%${searchQuery}%`);
    } else if (isNumeric) {
      regQuery = regQuery.ilike("phone", `%${searchQuery}%`);
    } else {
      regQuery = regQuery.ilike("full_name", `%${searchQuery}%`);
    }
  }

  regQuery = regQuery.order("full_name", { ascending: true }).limit(50);

  const { data: rawParticipants } = await regQuery;

  // 7. Mapear e aplicar filtro por presença / ausência na sessão
  const participants = (rawParticipants || [])
    .map((p) => ({
      ...(p as unknown as Registration),
      currentAttendance: attendanceByRegId[p.id] || null,
    }))
    .filter((p) => {
      if (filterType === "present") {
        return Boolean(p.currentAttendance);
      }
      if (filterType === "absent") {
        return !p.currentAttendance;
      }
      return true;
    });

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-cyan-600" />
            Controlo de Presenças & Quórum Deliberativo
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Registo manual de presenças por sessão plenária e cálculo em tempo real do quórum de deliberação.
          </p>
        </div>

        {selectedSession && (
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-600">Sessão Ativa:</span>
            <span
              className={`px-2.5 py-1 rounded-lg font-bold ${
                selectedSession.status === "open"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {selectedSession.name}
            </span>
          </div>
        )}
      </div>

      {/* Seletor de Sessão Plenária */}
      <SessionSelector sessions={sessions} selectedSessionId={selectedSession?.id || null} />

      {/* Painel do Quórum Deliberativo em Tempo Real */}
      {selectedSession && (
        <div className="bg-[#F1F5F9] rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Quórum da Sessão: {selectedSession.name}
                </h3>
                <span className="text-xs text-slate-500">
                  Estado atual:{" "}
                  {selectedSession.status === "open" ? (
                    <strong className="text-emerald-600 font-bold">Aberta para Presenças</strong>
                  ) : (
                    <strong className="text-slate-600 font-bold">Encerrada</strong>
                  )}
                </span>
              </div>
            </div>

            {/* Badges de Quórum Estatutário */}
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                  isQuorumSimple
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-slate-100 text-slate-500 border-slate-200"
                }`}
              >
                {isQuorumSimple ? "✓ Quórum Simples (>50%)" : "Quórum Simples Não Atingido"}
              </span>

              <span
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                  isQuorumQualified
                    ? "bg-purple-50 text-purple-700 border-purple-200"
                    : "bg-slate-100 text-slate-500 border-slate-200"
                }`}
              >
                {isQuorumQualified ? "✓ Maioria Qualificada (≥66%)" : "Maioria Qualificada Pendente"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[11px] font-semibold text-slate-500">Participantes Credenciados</div>
              <div className="text-2xl font-black text-slate-900 mt-1 font-mono">
                {credentialedCount}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Base eleitoral com direito a voto</div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50/40 border border-emerald-200">
              <div className="text-[11px] font-semibold text-emerald-800">Presenças Confirmadas</div>
              <div className="text-2xl font-black text-emerald-700 mt-1 font-mono">{presentCount}</div>
              <div className="text-[10px] text-emerald-600/80 mt-0.5">Presentes fisicamente no recinto</div>
            </div>

            <div className="p-4 rounded-xl bg-blue-50/40 border border-blue-200">
              <div className="text-[11px] font-semibold text-blue-800">Quórum Percentual</div>
              <div className="text-2xl font-black text-blue-700 mt-1 font-mono">{quorumPercent}%</div>
              <div className="text-[10px] text-blue-600/80 mt-0.5">Percentual de assiduidade</div>
            </div>
          </div>

          {/* Barra de Progresso Visual de Quórum */}
          <div className="space-y-1 pt-1">
            <div className="flex justify-between text-[11px] font-mono font-medium text-slate-500">
              <span>0%</span>
              <span className="text-slate-400 font-bold">50% (Abertura)</span>
              <span className="text-slate-400 font-bold">66.7% (Qualificado)</span>
              <span>100%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200 relative">
              {/* Marcações de Quórum */}
              <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-300 z-10" />
              <div className="absolute left-[66.7%] top-0 bottom-0 w-0.5 bg-slate-300 z-10" />

              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isQuorumQualified
                    ? "bg-purple-600"
                    : isQuorumSimple
                    ? "bg-emerald-500"
                    : "bg-blue-500"
                }`}
                style={{ width: `${Math.min(100, quorumPercent)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Barra de Pesquisa e Filtros */}
      {selectedSession && (
        <AttendanceSearchBar currentQuery={searchQuery} currentFilter={filterType} />
      )}

      {/* Tabela de Credenciados para Check-in */}
      {selectedSession && (
        <div className="bg-[#F1F5F9] rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-600" />
              Lista de Participantes Credenciados ({participants.length})
            </h2>
            <span className="text-[11px] text-slate-400">
              Apenas participantes com crachá entregue são listados
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-slate-600 font-semibold text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4">Código / Participante</th>
                  <th className="py-3 px-4">Cargo Pastoral / Intendência</th>
                  <th className="py-3 px-4">Função / Categoria</th>
                  <th className="py-3 px-4 text-right">Check-in de Presença</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {participants.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2 py-0.5 font-mono font-bold text-xs bg-slate-900 text-white rounded-md mb-1 shadow-sm">
                        {p.registration_code}
                      </span>
                      <div className="font-bold text-slate-900 text-xs">{p.full_name}</div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{p.phone}</span>
                        <span className="text-slate-300">•</span>
                        <span>{formatGender(p.sex)}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800 text-xs flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        {p.local_church}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {p.ecclesiastical_district} • {p.municipality}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900 text-xs">{p.participant_category}</div>
                      <div className="text-[11px] text-slate-500">
                        {formatOrganizationalRole(p.organizational_role, p.custom_role)}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <AttendanceCheckinButton
                        sessionId={selectedSession.id}
                        registrationId={p.id}
                        participantName={p.full_name}
                        sessionStatus={selectedSession.status as SessionStatus}
                        attendanceRecord={p.currentAttendance}
                        isSuperAdmin={Boolean(currentAdmin.isSuperAdmin)}
                      />
                    </td>
                  </tr>
                ))}

                {participants.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-500 text-xs">
                      <AlertCircle className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                      Nenhum participante encontrado com os filtros aplicados.
                      <div className="text-[11px] text-slate-400 mt-1">
                        Certifique-se de que existem participantes com credenciamento concluído no secretariado.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
