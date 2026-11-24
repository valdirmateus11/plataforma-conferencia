import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAdmin } from "@/features/administration/actions/auth-actions";
import {
  UserCheck,
  ShieldAlert,
  Users,
  CheckCircle2,
  Clock,
  Building2,
  Phone,
  Search,
  AlertCircle,
} from "lucide-react";
import { AccreditationSearchInput } from "@/components/accreditation/accreditation-search-input";
import { AccreditationActionButton } from "@/components/accreditation/accreditation-action-button";
import type { RegistrationStatus } from "@/types/database.types";

export const dynamic = "force-dynamic";

interface SearchProps {
  searchParams: Promise<{
    q?: string;
    filter?: string;
  }>;
}

export default async function AdminCredenciamentoPage({ searchParams }: SearchProps) {
  const currentAdmin = await getCurrentAdmin();

  const allowedRoles = ["super_admin", "registration_admin", "accreditation_operator"];
  const hasAccess = currentAdmin?.roles.some((r) => allowedRoles.includes(r));

  if (!currentAdmin || !hasAccess) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl shadow-sm border border-slate-200 max-w-xl mx-auto my-12 space-y-4">
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900">Acesso Restrito ao Secretariado</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          O módulo de credenciamento presencial é reservado aos operadores de credenciamento, coordenação
          e superadministradores da conferência.
        </p>
      </div>
    );
  }

  const params = await searchParams;
  const searchQuery = (params.q || "").trim();
  const filterType = params.filter || "all";

  const supabase = await createClient();
  const adminClient = createAdminClient();

  // 1. Obter a conferência ativa
  const { data: conference } = await supabase
    .from("conferences")
    .select("id, name, capacity, code_prefix")
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

  // 2. Indicadores do Secretariado em tempo real
  const { count: totalApproved } = await supabase
    .from("registrations")
    .select("id", { count: "exact", head: true })
    .eq("conference_id", confId)
    .eq("status", "approved");

  const { count: totalCredentialed } = await supabase
    .from("accreditations")
    .select("id", { count: "exact", head: true })
    .eq("conference_id", confId)
    .eq("status", "credentialed");

  const approved = totalApproved || 0;
  const credentialed = totalCredentialed || 0;
  const pendingAccreditation = Math.max(0, approved - credentialed);
  const percentCredentialed = approved > 0 ? Math.round((credentialed / approved) * 100) : 0;

  // 3. Consulta de inscrições com credenciamento
  let regQuery = adminClient
    .from("registrations")
    .select(`
      id,
      registration_code,
      full_name,
      sex,
      phone,
      local_church,
      ecclesiastical_district,
      municipality,
      organizational_role,
      participant_category,
      status,
      submitted_at,
      accreditations (
        id,
        status,
        credentialed_at,
        credentialed_by,
        reason
      )
    `)
    .eq("conference_id", confId);

  // Aplicação de filtros
  if (filterType === "eligible") {
    regQuery = regQuery.eq("status", "approved");
  } else if (filterType === "pending") {
    regQuery = regQuery.eq("status", "pending");
  }

  // Pesquisa manual por Código, Nome ou Telefone
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

  const { data: rawRegistrations } = await regQuery;

  // 4. Mapeamento e filtragem de credenciamento concluído
  const registrations = (rawRegistrations || []).map((r) => {
    // Obter credenciamento ativo mais recente se existir
    const accList = (r.accreditations as unknown as Array<{
      id: string;
      status: "credentialed" | "revoked";
      credentialed_at: string;
      credentialed_by: string;
      reason: string | null;
    }>) || [];

    const activeAcc = accList.find((a) => a.status === "credentialed") || null;

    return {
      ...r,
      activeAccreditation: activeAcc,
    };
  }).filter((r) => {
    if (filterType === "eligible") {
      return !r.activeAccreditation; // Apenas os ainda não credenciados
    }
    if (filterType === "credentialed") {
      return Boolean(r.activeAccreditation); // Apenas os já credenciados
    }
    return true;
  });

  // 5. Obter nomes dos operadores de credenciamento
  const operatorIds = Array.from(
    new Set(
      registrations
        .map((r) => r.activeAccreditation?.credentialed_by)
        .filter((id): id is string => Boolean(id))
    )
  );

  const operatorMap: Record<string, string> = {};
  if (operatorIds.length > 0) {
    const { data: operators } = await adminClient
      .from("admin_profiles")
      .select("id, display_name")
      .in("id", operatorIds);

    (operators || []).forEach((op) => {
      operatorMap[op.id] = op.display_name;
    });
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-emerald-600" />
            Secretariado de Credenciamento Presencial
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pesquisa manual rápida e confirmação presencial de entrega de material (sem QR Code).
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-700">Progresso de Mesa:</span>
          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg font-bold">
            {percentCredentialed}% Concluído
          </span>
        </div>
      </div>

      {/* Cartões de Indicadores Rápidos do Secretariado */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
            <Users className="w-4 h-4 text-blue-600" />
            Inscrições Aprovadas (Elegíveis)
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{approved}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Teto oficial de capacidade: {conference.capacity}</div>
        </div>

        <div className="bg-white rounded-2xl border border-emerald-200 bg-emerald-50/20 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-700 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Credenciamentos Concluídos
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">{credentialed}</div>
          <div className="text-[11px] text-emerald-600/80 mt-0.5">Crachás e kits já entregues</div>
        </div>

        <div className="bg-white rounded-2xl border border-amber-200 bg-amber-50/20 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-amber-700 text-xs font-semibold">
            <Clock className="w-4 h-4 text-amber-600" />
            Aguardando Chegada no Local
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">{pendingAccreditation}</div>
          <div className="text-[11px] text-amber-700/80 mt-0.5">Aprovados pendentes de receção</div>
        </div>
      </div>

      {/* Barra de Pesquisa Manual e Abas */}
      <AccreditationSearchInput currentQuery={searchQuery} currentFilter={filterType} />

      {/* Tabela de Resultados de Pesquisa */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-600" />
            Resultados da Pesquisa ({registrations.length})
          </h2>
          <span className="text-[11px] text-slate-400">
            {searchQuery
              ? `Pesquisa por: "${searchQuery}"`
              : "Exibindo participantes em ordem alfabética"}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-slate-600 font-semibold text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">Código / Participante</th>
                <th className="py-3 px-4">Jurisdição Eclesiástica</th>
                <th className="py-3 px-4">Função / Categoria</th>
                <th className="py-3 px-4">Estado Inscrição</th>
                <th className="py-3 px-4 text-right">Ação de Credenciamento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {registrations.map((reg) => {
                const operator = reg.activeAccreditation?.credentialed_by
                  ? operatorMap[reg.activeAccreditation.credentialed_by]
                  : null;

                return (
                  <tr key={reg.id} className="hover:bg-slate-50/60 transition">
                    {/* Código e Nome */}
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2 py-0.5 font-mono font-bold text-xs bg-slate-900 text-white rounded-md mb-1 shadow-sm">
                        {reg.registration_code}
                      </span>
                      <div className="font-bold text-slate-900 text-xs">
                        {reg.full_name}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{reg.phone}</span>
                        <span className="text-slate-300">•</span>
                        <span className="capitalize">{reg.sex === "M" ? "Masculino" : "Feminino"}</span>
                      </div>
                    </td>

                    {/* Igreja e Distrito */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800 text-xs flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        {reg.local_church}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {reg.ecclesiastical_district} • {reg.municipality}
                      </div>
                    </td>

                    {/* Função e Categoria */}
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900 text-xs">
                        {reg.participant_category}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {reg.organizational_role}
                      </div>
                    </td>

                    {/* Estado de Inscrição */}
                    <td className="py-3.5 px-4">
                      {reg.status === "approved" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Aprovada
                        </span>
                      ) : reg.status === "pending" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" />
                          Pendente
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          Rejeitada
                        </span>
                      )}
                    </td>

                    {/* Ação de Credenciamento */}
                    <td className="py-3.5 px-4 text-right">
                      <AccreditationActionButton
                        registrationId={reg.id}
                        registrationCode={reg.registration_code}
                        participantName={reg.full_name}
                        status={reg.status as RegistrationStatus}
                        accreditation={reg.activeAccreditation}
                        operatorName={operator}
                        isSuperAdmin={Boolean(currentAdmin?.isSuperAdmin)}
                      />
                    </td>
                  </tr>
                );
              })}

              {registrations.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 text-xs">
                    <AlertCircle className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                    Nenhum participante encontrado com os critérios de pesquisa.
                    <div className="text-[11px] text-slate-400 mt-1">
                      Verifique o código ou nome pesquisado.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
