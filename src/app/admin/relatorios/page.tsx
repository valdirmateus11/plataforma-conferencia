import { createClient } from "@/lib/supabase/server";
import { getCurrentAdmin } from "@/features/administration/actions/auth-actions";
import {
  FileSpreadsheet,
  ShieldCheck,
  ShieldAlert,
  Users,
  CheckCircle2,
  PieChart,
  Building2,
  MapPin,
  Calendar,
  Layers,
} from "lucide-react";
import { ExportFilterCard } from "@/components/reports/export-filter-card";

export const dynamic = "force-dynamic";

export default async function AdminRelatoriosPage() {
  const currentAdmin = await getCurrentAdmin();

  const allowedRoles = ["super_admin", "registration_admin", "consultant"];
  const hasAccess = currentAdmin?.roles.some((r) => allowedRoles.includes(r));

  if (!currentAdmin || !hasAccess) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl shadow-sm border border-slate-200 max-w-xl mx-auto my-12 space-y-4">
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900">Acesso Restrito a Relatórios</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          O módulo de relatórios estatísticos e exportação é reservado à Coordenação Geral,
          Auditores e Superadministradores da conferência.
        </p>
      </div>
    );
  }

  const supabase = await createClient();

  // 1. Obter conferência ativa
  const { data: conference } = await supabase
    .from("conferences")
    .select("id, name, capacity")
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

  // 2. Obter todas as sessões para o seletor de exportação
  const { data: sessions } = await supabase
    .from("sessions")
    .select("id, name, session_date, status")
    .eq("conference_id", confId)
    .order("session_date", { ascending: true });

  const sessionList = (sessions || []).map((s) => ({ id: s.id, name: s.name }));

  // 3. Obter contagens agregadas da base de dados
  const { count: totalRegs } = await supabase
    .from("registrations")
    .select("id", { count: "exact", head: true })
    .eq("conference_id", confId);

  const { count: approvedRegs } = await supabase
    .from("registrations")
    .select("id", { count: "exact", head: true })
    .eq("conference_id", confId)
    .eq("status", "approved");

  const { count: credentialedCount } = await supabase
    .from("accreditations")
    .select("id", { count: "exact", head: true })
    .eq("conference_id", confId)
    .eq("status", "credentialed");

  const { count: totalAttendance } = await supabase
    .from("attendance_records")
    .select("id", { count: "exact", head: true })
    .eq("conference_id", confId)
    .eq("status", "present");

  // 4. Obter dados demográficos dos inscritos
  const { data: allRegistrations } = await supabase
    .from("registrations")
    .select("sex, ecclesiastical_district, municipality, participant_category")
    .eq("conference_id", confId);

  const regs = allRegistrations || [];

  // Agregações por Distrito
  const districtCounts: Record<string, number> = {};
  // Agregações por Município
  const municipalityCounts: Record<string, number> = {};
  // Agregações por Categoria
  const categoryCounts: Record<string, number> = {};
  // Agregações por Sexo
  let maleCount = 0;
  let femaleCount = 0;

  regs.forEach((r) => {
    if (r.ecclesiastical_district) {
      districtCounts[r.ecclesiastical_district] =
        (districtCounts[r.ecclesiastical_district] || 0) + 1;
    }
    if (r.municipality) {
      municipalityCounts[r.municipality] = (municipalityCounts[r.municipality] || 0) + 1;
    }
    if (r.participant_category) {
      categoryCounts[r.participant_category] =
        (categoryCounts[r.participant_category] || 0) + 1;
    }
    if (r.sex === "M") maleCount++;
    if (r.sex === "F") femaleCount++;
  });

  const sortedDistricts = Object.entries(districtCounts).sort((a, b) => b[1] - a[1]);
  const sortedMunicipalities = Object.entries(municipalityCounts).sort((a, b) => b[1] - a[1]);
  const sortedCategories = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
            Relatórios & Exportações Oficiais
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Geração de folhas de cálculo seguras (CSV) e visualização de indicadores demográficos da conferência.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-slate-900 text-slate-200 text-xs font-mono font-medium flex items-center gap-2 shadow-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Proteção Formula Injection Ativa
          </span>
        </div>
      </div>

      {/* Alerta de Segurança de Exportações */}
      <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-emerald-950 text-xs flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Blindagem Rigorosa Contra CSV/Excel Formula Injection:</span>
          <p className="text-emerald-900 text-[11px] mt-0.5 leading-relaxed">
            Todos os ficheiros CSV gerados por esta plataforma são sanitizados pelo módulo{" "}
            <code className="bg-emerald-100 px-1 py-0.5 rounded font-mono font-bold">sanitizeSpreadsheetCell</code>.
            Qualquer entrada de texto iniciada por <code className="bg-emerald-100 px-1 py-0.5 rounded font-mono font-bold">=</code>,{" "}
            <code className="bg-emerald-100 px-1 py-0.5 rounded font-mono font-bold">+</code>,{" "}
            <code className="bg-emerald-100 px-1 py-0.5 rounded font-mono font-bold">-</code> ou{" "}
            <code className="bg-emerald-100 px-1 py-0.5 rounded font-mono font-bold">@</code> (mesmo com espaços ou
            caracteres de controlo prévios) é prefixada com apóstrofo para impedir execução de código arbitrário ao abrir
            no Excel ou LibreOffice. Os ficheiros incluem ainda a assinatura UTF-8 BOM para preservação de acentos portugueses.
          </p>
        </div>
      </div>

      {/* Cartões de Indicadores Gerais */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
            <Users className="w-4 h-4 text-blue-600" />
            Total Inscrições
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{totalRegs || 0}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Capacidade: {conference.capacity}</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Inscrições Aprovadas
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">{approvedRegs || 0}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Aptos ao credenciamento</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
            <PieChart className="w-4 h-4 text-purple-600" />
            Credenciados
          </div>
          <div className="text-2xl font-black text-purple-600 mt-2">{credentialedCount || 0}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Crachás entregues no local</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
            <Calendar className="w-4 h-4 text-cyan-600" />
            Presenças Totais
          </div>
          <div className="text-2xl font-black text-cyan-600 mt-2">{totalAttendance || 0}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Check-ins em plenárias</div>
        </div>
      </div>

      {/* Componente Interativo de Exportação de Ficheiros */}
      <ExportFilterCard sessions={sessionList} />

      {/* Relatórios Demográficos e Distribuição Territorial */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Distribuição por Distrito Eclesiástico */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            Por Distrito Eclesiástico ({sortedDistricts.length})
          </h2>

          <div className="space-y-2">
            {sortedDistricts.map(([district, count]) => {
              const pct = regs.length > 0 ? Math.round((count / regs.length) * 100) : 0;
              return (
                <div key={district} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium text-slate-700">
                    <span className="truncate max-w-[180px]">{district}</span>
                    <span className="font-bold text-slate-900 font-mono">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}

            {sortedDistricts.length === 0 && (
              <p className="text-xs text-slate-400 italic">Sem inscrições registadas.</p>
            )}
          </div>
        </div>

        {/* Distribuição por Município */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-600" />
            Por Município de Luanda ({sortedMunicipalities.length})
          </h2>

          <div className="space-y-2">
            {sortedMunicipalities.map(([mun, count]) => {
              const pct = regs.length > 0 ? Math.round((count / regs.length) * 100) : 0;
              return (
                <div key={mun} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium text-slate-700">
                    <span className="truncate max-w-[180px]">{mun}</span>
                    <span className="font-bold text-slate-900 font-mono">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}

            {sortedMunicipalities.length === 0 && (
              <p className="text-xs text-slate-400 italic">Sem inscrições registadas.</p>
            )}
          </div>
        </div>

        {/* Distribuição por Categoria & Género */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-600" />
            Categoria & Género
          </h2>

          {/* Género */}
          <div className="p-3 bg-slate-50 rounded-xl space-y-2">
            <div className="text-[11px] font-semibold text-slate-600">Distribuição por Sexo:</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-white border border-slate-200">
                <span className="text-slate-400 text-[10px]">Masculino:</span>
                <div className="font-bold text-slate-900 font-mono text-sm">{maleCount}</div>
                <div className="text-[10px] text-slate-400">
                  {regs.length > 0 ? Math.round((maleCount / regs.length) * 100) : 0}%
                </div>
              </div>

              <div className="p-2 rounded-lg bg-white border border-slate-200">
                <span className="text-slate-400 text-[10px]">Feminino:</span>
                <div className="font-bold text-slate-900 font-mono text-sm">{femaleCount}</div>
                <div className="text-[10px] text-slate-400">
                  {regs.length > 0 ? Math.round((femaleCount / regs.length) * 100) : 0}%
                </div>
              </div>
            </div>
          </div>

          {/* Categorias */}
          <div className="space-y-2">
            <div className="text-[11px] font-semibold text-slate-600">Por Categoria:</div>
            {sortedCategories.map(([cat, count]) => {
              const pct = regs.length > 0 ? Math.round((count / regs.length) * 100) : 0;
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium text-slate-700">
                    <span className="truncate max-w-[170px]">{cat}</span>
                    <span className="font-bold text-slate-900 font-mono">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-purple-600 h-full rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
