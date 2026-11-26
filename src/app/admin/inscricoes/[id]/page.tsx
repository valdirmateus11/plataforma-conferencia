import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  ArrowLeft,
  User,
  Phone,
  Church,
  MapPin,
  Briefcase,
  Users,
  ShieldCheck,
  Clock,
  ShieldAlert,
  CheckCircle2,
} from "lucide-react";
import { RegistrationApprovalCard } from "@/components/forms/registration-approval-card";
import { formatGender, formatBirthDate, formatOrganizationalRole } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function RegistrationDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Obter a inscrição
  const { data: registration, error } = await supabase
    .from("registrations")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !registration) {
    notFound();
  }

  // 2. Obter o perfil do revisor se houver
  let reviewerName: string | null = null;
  if (registration.reviewed_by) {
    const { data: reviewer } = await supabase
      .from("admin_profiles")
      .select("display_name")
      .eq("id", registration.reviewed_by)
      .single();
    reviewerName = reviewer?.display_name || null;
  }

  // 3. Obter estado de credenciamento
  const { data: accreditation } = await supabase
    .from("accreditations")
    .select("status, credentialed_at")
    .eq("registration_id", id)
    .eq("status", "credentialed")
    .maybeSingle();

  // 4. Obter registos de presença por sessão
  const { data: attendances } = await supabase
    .from("attendance_records")
    .select("id, status, recorded_at, sessions(name, session_date)")
    .eq("registration_id", id)
    .eq("status", "present");

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Navegação e Cabeçalho */}
      <div>
        <Link
          href="/admin/inscricoes"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Voltar à Lista de Inscrições
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xl sm:text-2xl font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-xl border border-blue-200">
                {registration.registration_code}
              </span>

              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                  registration.status === "approved"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : registration.status === "pending"
                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                    : "bg-rose-50 text-rose-700 border border-rose-200"
                }`}
              >
                {registration.status === "approved"
                  ? "Inscrição Aprovada"
                  : registration.status === "pending"
                  ? "Pendente de Análise"
                  : registration.status === "rejected"
                  ? "Inscrição Rejeitada"
                  : "Cancelada"}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
              {registration.full_name}
            </h1>
          </div>

          <div className="text-xs text-slate-400">
            Submetida em:{" "}
            <span className="font-medium text-slate-700">
              {new Date(registration.submitted_at).toLocaleString("pt-PT")}
            </span>
          </div>
        </div>
      </div>

      {/* Alerta de Suspeita de Duplicação */}
      {registration.is_suspected_duplicate && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 flex items-start gap-3 shadow-sm">
          <ShieldAlert className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-bold">Aviso de Suspeita de Duplicação</p>
            <p className="text-amber-800 mt-0.5 leading-relaxed">
              Esta inscrição foi sinalizada automaticamente porque o número de telefone coincide
              com outro registo ativo na Conferência. Verifique se se trata de familiares que partilham
              o mesmo número ou de submissão repetida.
            </p>
          </div>
        </div>
      )}

      {/* Grid de Informações Detalhadas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Bloco 1: Dados Pessoais */}
        <div className="bg-[#F1F5F9] rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <User className="w-4 h-4 text-blue-600" />
            Dados Pessoais
          </h2>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400">Nome Completo:</span>
              <p className="font-semibold text-slate-900 mt-0.5">{registration.full_name}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400">Sexo:</span>
                <p className="font-semibold text-slate-900 mt-0.5">{formatGender(registration.sex)}</p>
              </div>

              <div>
                <span className="text-slate-400">Estado Civil:</span>
                <p className="font-semibold text-slate-900 mt-0.5">
                  {registration.marital_status || (
                    <span className="text-slate-400 font-normal italic">Registo anterior</span>
                  )}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400">Data de Nascimento:</span>
                <p className="font-semibold text-slate-900 mt-0.5">
                  {registration.birth_date ? (
                    formatBirthDate(registration.birth_date)
                  ) : (
                    <span className="text-slate-400 font-normal italic">Registo anterior</span>
                  )}
                </p>
              </div>

              <div>
                <span className="text-slate-400">Faixa-etária:</span>
                <p className="font-semibold text-slate-900 mt-0.5">
                  {registration.age_group ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {registration.age_group}
                    </span>
                  ) : (
                    <span className="text-slate-400 font-normal italic">Registo anterior</span>
                  )}
                </p>
              </div>
            </div>

            <div>
              <span className="text-slate-400">Grau de Escolaridade:</span>
              <p className="font-semibold text-slate-900 mt-0.5">
                {registration.education_level || (
                  <span className="text-slate-400 font-normal italic">Registo anterior</span>
                )}
              </p>
            </div>

            <div>
              <span className="text-slate-400">Telefone:</span>
              <p className="font-mono font-semibold text-blue-600 mt-0.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {registration.phone}
              </p>
            </div>

            <div>
              <span className="text-slate-400">E-mail:</span>
              <p className="font-semibold text-slate-900 mt-0.5 break-all">
                {registration.email || (
                  <span className="text-slate-400 font-normal italic">
                    Não informado (registo anterior)
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Bloco 2: Origem Eclesiástica */}
        <div className="bg-[#F1F5F9] rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Church className="w-4 h-4 text-blue-600" />
            Origem Eclesiástica
          </h2>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400">Intendência:</span>
              <p className="font-semibold text-slate-900 mt-0.5">
                {registration.ecclesiastical_district}
              </p>
            </div>

            <div>
              <span className="text-slate-400">Cargo Pastoral:</span>
              <p className="font-semibold text-slate-900 mt-0.5">{registration.local_church}</p>
            </div>

            <div>
              <span className="text-slate-400">Categoria de Membro:</span>
              <p className="font-semibold text-slate-900 mt-0.5">
                {registration.member_category || (
                  <span className="text-slate-400 font-normal italic">Registo anterior</span>
                )}
              </p>
            </div>

            <div>
              <span className="text-slate-400">Município de Residência:</span>
              <p className="font-semibold text-slate-900 mt-0.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {registration.municipality}
              </p>
            </div>
          </div>
        </div>

        {/* Bloco 3: Função e Delegação */}
        <div className="bg-[#F1F5F9] rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-blue-600" />
            Função e Participação
          </h2>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400">Categoria de Participação:</span>
              <p className="font-semibold text-slate-900 mt-0.5">
                {registration.participant_category}
              </p>
            </div>

            <div>
              <span className="text-slate-400">Função na Organização:</span>
              <p className="font-semibold text-slate-900 mt-0.5">
                {formatOrganizationalRole(registration.organizational_role, registration.custom_role)}
              </p>
            </div>

            {registration.delegation_responsible && (
              <div>
                <span className="text-slate-400">Responsável da Delegação:</span>
                <p className="font-semibold text-blue-900 mt-0.5 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                  {registration.delegation_responsible}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Bloco 4: Estado de Credenciamento e Presenças */}
        <div className="bg-[#F1F5F9] rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            Credenciamento & Presenças
          </h2>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400">Credenciamento Presencial:</span>
              <div className="mt-1">
                {accreditation ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Credenciado em {new Date(accreditation.credentialed_at).toLocaleDateString("pt-PT")}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Não Credenciado
                  </span>
                )}
              </div>
            </div>

            <div>
              <span className="text-slate-400">Presenças Registadas:</span>
              {attendances && attendances.length > 0 ? (
                <div className="mt-1 space-y-1">
                  {attendances.map((att) => (
                    <div
                      key={att.id}
                      className="px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-medium text-slate-800"
                    >
                      ✓ {(att.sessions as unknown as { name: string } | null)?.name || "Sessão"} (
                      {new Date(att.recorded_at).toLocaleTimeString("pt-PT", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      )
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-[11px] mt-0.5">Sem presenças registadas.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bloco 5: Histórico de Validação */}
      {registration.reviewed_at && (
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 text-xs text-slate-700 space-y-1.5">
          <p className="font-semibold text-slate-900">Histórico de Decisão:</p>
          <p className="text-slate-600">
            Revisto por: <strong>{reviewerName || "Administrador"}</strong> em{" "}
            {new Date(registration.reviewed_at).toLocaleString("pt-PT")}
          </p>
          {registration.review_reason && (
            <p className="text-slate-600 italic">
              Motivo: &quot;{registration.review_reason}&quot;
            </p>
          )}
        </div>
      )}

      {/* Bloco 6: Card Interativo de Validação (Aprovar, Rejeitar, Cancelar, Reativar) */}
      <RegistrationApprovalCard
        registrationId={registration.id}
        currentStatus={registration.status}
      />
    </div>
  );
}
