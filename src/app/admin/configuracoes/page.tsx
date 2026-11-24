import { createClient } from "@/lib/supabase/server";
import { getCurrentAdmin } from "@/features/administration/actions/auth-actions";
import { Settings, ShieldAlert, Info, ShieldCheck } from "lucide-react";
import { ConferenceSettingsForm } from "@/components/forms/conference-settings-form";

export const dynamic = "force-dynamic";

export default async function AdminConfiguracoesPage() {
  const currentAdmin = await getCurrentAdmin();

  const isAllowed = currentAdmin && (currentAdmin.isSuperAdmin || currentAdmin.roles.includes("registration_admin"));

  if (!isAllowed) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl shadow-sm border border-slate-200 max-w-xl mx-auto my-12 space-y-4">
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900">Acesso Restrito a Configurações</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          A alteração dos parâmetros estruturais da conferência é restrita ao Superadministrador e à
          Coordenação Geral.
        </p>
      </div>
    );
  }

  const supabase = await createClient();

  const { data: conference } = await supabase
    .from("conferences")
    .select("id, name, capacity, registration_open, code_prefix, description, start_date, end_date")
    .eq("slug", "iii-conferencia-distrital-luanda-2026")
    .single();

  if (!conference) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-base font-bold text-slate-900">Conferência não encontrada</h2>
        <p className="text-xs text-slate-500 mt-1">Execute o script de seed inicial da base de dados.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-blue-600" />
          Configurações da Conferência
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Gestão centralizada de parâmetros, controlo de teto de capacidade e disponibilidade do portal público.
        </p>
      </div>

      {/* Formulário Interativo de Configurações */}
      <ConferenceSettingsForm
        conference={{
          id: conference.id,
          name: conference.name,
          capacity: conference.capacity,
          registration_open: conference.registration_open,
          code_prefix: conference.code_prefix || "CDJ26",
          description: conference.description || "Luanda, Angola",
          start_date: conference.start_date,
          end_date: conference.end_date,
        }}
      />

      {/* Cartão de Informação de Segurança & Procedimentos de Continuidade */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <Info className="w-4 h-4 text-blue-600" />
            Trava Transacional de Lotação
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Ao atingir o teto estipulado (ex.: 500 participantes), o PostgreSQL ativa um bloqueio atómico com
            <code className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded font-mono font-bold">FOR UPDATE</code>.
            Nenhuma nova inscrição pública é aceite e nenhuma reativação de inscrição cancelada pode ser
            efetuada sem vagas disponíveis.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Auditoria em Todas as Modificações
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Qualquer alteração efetuada nesta página (seja alteração de lotação ou abertura/encerramento de inscrições)
            é imediatamente gravada de forma permanente na trilha de auditoria imutável com a identificação do autor.
          </p>
        </div>
      </div>
    </div>
  );
}
