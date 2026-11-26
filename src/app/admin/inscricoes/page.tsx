import Link from "next/link";
import { CONFERENCE_CONFIG } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import {
  Users,
  Search,
  Filter,
  ArrowRight,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  LUANDA_MUNICIPALITIES,
  INTENDENCIAS,
  PARTICIPANT_CATEGORIES,
  AGE_GROUPS,
  MEMBER_CATEGORIES,
} from "@/lib/constants/conference-data";
import { formatGender, formatOrganizationalRole } from "@/lib/utils";
import type { Registration, RegistrationStatus } from "@/types/database.types";

export const dynamic = "force-dynamic";

interface SearchProps {
  searchParams: Promise<{
    q?: string;
    status?: string;
    district?: string;
    municipality?: string;
    category?: string;
    ageGroup?: string;
    memberCategory?: string;
    duplicate?: string;
    page?: string;
  }>;
}

export default async function AdminInscricoesPage({ searchParams }: SearchProps) {
  const params = await searchParams;
  const supabase = await createClient();

  const searchQuery = params.q?.trim() || "";
  const statusFilter = params.status || "all";
  const districtFilter = params.district || "all";
  const municipalityFilter = params.municipality || "all";
  const categoryFilter = params.category || "all";
  const ageGroupFilter = params.ageGroup || "all";
  const memberCategoryFilter = params.memberCategory || "all";
  const duplicateOnly = params.duplicate === "true";
  const currentPage = Math.max(1, parseInt(params.page || "1", 10));
  const pageSize = 15;
  const offset = (currentPage - 1) * pageSize;

  // 1. Obter a conferência ativa
  const { data: conference } = await supabase
    .from("conferences")
    .select("id")
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

  // 2. Construção da query paginada no servidor (usa * para compatibilidade pré e pós migração 00010)
  let query = supabase
    .from("registrations")
    .select("*", { count: "exact" })
    .eq("conference_id", confId);

  // Aplicação de filtros
  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter as RegistrationStatus);
  }

  if (districtFilter !== "all") {
    query = query.eq("ecclesiastical_district", districtFilter);
  }

  if (municipalityFilter !== "all") {
    query = query.eq("municipality", municipalityFilter);
  }

  if (categoryFilter !== "all") {
    query = query.eq("participant_category", categoryFilter);
  }

  if (ageGroupFilter !== "all") {
    query = query.eq("age_group", ageGroupFilter);
  }

  if (memberCategoryFilter !== "all") {
    query = query.eq("member_category", memberCategoryFilter);
  }

  if (duplicateOnly) {
    query = query.eq("is_suspected_duplicate", true);
  }

  // Pesquisa textual por código, nome, telefone ou e-mail
  if (searchQuery) {
    if (searchQuery.toUpperCase().startsWith("CDJ") || searchQuery.includes("-")) {
      query = query.ilike("registration_code", `%${searchQuery}%`);
    } else if (searchQuery.includes("@")) {
      query = query.ilike("email", `%${searchQuery}%`);
    } else if (/^\+?\d+$/.test(searchQuery)) {
      query = query.ilike("phone", `%${searchQuery}%`);
    } else {
      query = query.ilike("full_name", `%${searchQuery}%`);
    }
  }

  // Ordenação e paginação
  query = query
    .order("submitted_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  const { data: registrations, count: totalCount } = await query;

  const totalPages = Math.ceil((totalCount || 0) / pageSize);

  const buildPaginationHref = (page: number) =>
    `/admin/inscricoes?page=${page}&q=${encodeURIComponent(
      searchQuery
    )}&status=${encodeURIComponent(statusFilter)}&district=${encodeURIComponent(
      districtFilter
    )}&category=${encodeURIComponent(categoryFilter)}&municipality=${encodeURIComponent(
      municipalityFilter
    )}&ageGroup=${encodeURIComponent(ageGroupFilter)}&memberCategory=${encodeURIComponent(
      memberCategoryFilter
    )}${duplicateOnly ? "&duplicate=true" : ""}`;

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Gestão de Inscrições
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Total de {totalCount || 0} registos encontrados para os filtros aplicados.
          </p>
        </div>
      </div>

      {/* Barra de Filtros e Pesquisa */}
      <div className="bg-[#F1F5F9] rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <form method="GET" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Pesquisa */}
          <div className="sm:col-span-2 relative">
            <input
              type="text"
              name="q"
              defaultValue={searchQuery}
              placeholder="Pesquisar por nome, código, telefone ou e-mail..."
              className="w-full rounded-xl border border-slate-300 bg-[#F1F5F9] pl-9 pr-3 py-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          </div>

          {/* Filtro Estado */}
          <div>
            <select
              name="status"
              defaultValue={statusFilter}
              className="w-full rounded-xl border border-slate-300 bg-[#F1F5F9] px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
            >
              <option value="all">Estado: Todos</option>
              <option value="pending">Pendentes</option>
              <option value="approved">Aprovados</option>
              <option value="rejected">Rejeitados</option>
              <option value="cancelled">Cancelados</option>
            </select>
          </div>

          {/* Filtro Intendência */}
          <div>
            <select
              name="district"
              defaultValue={districtFilter}
              className="w-full rounded-xl border border-slate-300 bg-[#F1F5F9] px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
            >
              <option value="all">Intendência: Todas</option>
              {INTENDENCIAS.map((dist) => (
                <option key={dist} value={dist}>
                  {dist}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro Faixa-etária */}
          <div>
            <select
              name="ageGroup"
              defaultValue={ageGroupFilter}
              className="w-full rounded-xl border border-slate-300 bg-[#F1F5F9] px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
            >
              <option value="all">Faixa-etária: Todas</option>
              {AGE_GROUPS.map((ag) => (
                <option key={ag} value={ag}>
                  {ag}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro Categoria de Membro */}
          <div>
            <select
              name="memberCategory"
              defaultValue={memberCategoryFilter}
              className="w-full rounded-xl border border-slate-300 bg-[#F1F5F9] px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
            >
              <option value="all">Membro: Todos</option>
              {MEMBER_CATEGORIES.map((mc) => (
                <option key={mc} value={mc}>
                  {mc}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro Categoria de Participação */}
          <div>
            <select
              name="category"
              defaultValue={categoryFilter}
              className="w-full rounded-xl border border-slate-300 bg-[#F1F5F9] px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
            >
              <option value="all">Participação: Todas</option>
              {PARTICIPANT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro Município */}
          <div>
            <select
              name="municipality"
              defaultValue={municipalityFilter}
              className="w-full rounded-xl border border-slate-300 bg-[#F1F5F9] px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
            >
              <option value="all">Município: Todos</option>
              {LUANDA_MUNICIPALITIES.map((mun) => (
                <option key={mun} value={mun}>
                  {mun}
                </option>
              ))}
            </select>
          </div>

          {/* Botão de Filtrar */}
          <div className="sm:col-span-2 lg:col-span-4 flex items-center justify-end gap-2">
            <Link
              href="/admin/inscricoes"
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 transition-colors"
              title="Limpar Filtros"
            >
              Limpar
            </Link>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
            >
              <Filter className="w-3.5 h-3.5" />
              Filtrar
            </button>
          </div>
        </form>

        {/* Filtro Rápido de Suspeita de Duplicação */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <Link
            href={duplicateOnly ? "/admin/inscricoes" : "/admin/inscricoes?duplicate=true"}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-medium transition-colors ${
              duplicateOnly
                ? "bg-amber-600 text-white"
                : "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            {duplicateOnly ? "A exibir apenas suspeitas de duplicação (Remover filtro)" : "Filtrar por suspeitas de duplicação"}
          </Link>
        </div>
      </div>

      {/* Tabela de Inscrições */}
      <div className="bg-[#F1F5F9] rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {registrations && registrations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4">Nome / Perfil Etário</th>
                  <th className="py-3 px-4">Telefone / E-mail</th>
                  <th className="py-3 px-4">Cargo Pastoral / Intendência</th>
                  <th className="py-3 px-4">Categoria / Função</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {(registrations as unknown as Registration[]).map((reg) => (
                  <tr key={reg.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                      {reg.registration_code}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">{reg.full_name}</span>
                        {reg.is_suspected_duplicate && (
                          <span
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300"
                            title="Submetido com telefone idêntico a outro registo"
                          >
                            Duplicado?
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {formatGender(reg.sex)}
                        {reg.age_group ? ` • ${reg.age_group}` : ""}
                        {reg.marital_status ? ` • ${reg.marital_status}` : ""}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-mono text-slate-600">{reg.phone}</div>
                      {reg.email && (
                        <div className="text-[11px] text-slate-400 truncate max-w-[180px]" title={reg.email}>
                          {reg.email}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-medium text-slate-800">{reg.local_church}</p>
                      <p className="text-[11px] text-slate-400">
                        {reg.ecclesiastical_district} • {reg.municipality}
                        {reg.member_category ? ` • ${reg.member_category}` : ""}
                      </p>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-medium text-slate-800">{reg.participant_category}</p>
                      <p className="text-[11px] text-slate-400">
                        {formatOrganizationalRole(reg.organizational_role, reg.custom_role)}
                      </p>
                    </td>
                    <td className="py-3.5 px-4">
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
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/admin/inscricoes/${reg.id}`}
                        className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        Detalhes
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-slate-400">
            Nenhuma inscrição encontrada com os critérios selecionados.
          </div>
        )}

        {/* Paginação no Servidor */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
            <span>
              Página {currentPage} de {totalPages} ({totalCount} resultados)
            </span>

            <div className="flex items-center gap-2">
              {currentPage > 1 ? (
                <Link
                  href={buildPaginationHref(currentPage - 1)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-300 bg-[#F1F5F9] hover:bg-slate-50 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Anterior
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed">
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Anterior
                </span>
              )}

              {currentPage < totalPages ? (
                <Link
                  href={buildPaginationHref(currentPage + 1)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-300 bg-[#F1F5F9] hover:bg-slate-50 transition-colors"
                >
                  Seguinte
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed">
                  Seguinte
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
