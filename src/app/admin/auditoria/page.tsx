import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAdmin } from "@/features/administration/actions/auth-actions";
import {
  FileText,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  User,
  Clock,
  ArrowRight,
  Database,
} from "lucide-react";
import { AuditJsonViewer } from "@/components/ui/audit-json-viewer";
import type { AdminRoleName } from "@/types/database.types";

export const dynamic = "force-dynamic";

interface SearchProps {
  searchParams: Promise<{
    action?: string;
    entity?: string;
  }>;
}

export default async function AdminAuditoriaPage({ searchParams }: SearchProps) {
  const currentAdmin = await getCurrentAdmin();

  const allowedRoles: AdminRoleName[] = ["super_admin", "registration_admin", "consultant"];
  const hasAccess = currentAdmin?.roles.some((r) => allowedRoles.includes(r));

  if (!currentAdmin || !hasAccess) {
    return (
      <div className="p-8 text-center bg-[#F1F5F9] rounded-2xl shadow-sm border border-slate-200 max-w-xl mx-auto my-12 space-y-4">
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900">Acesso Restrito à Trilha de Auditoria</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Apenas os perfis de Superadministrador, Coordenador Geral e Auditor possuem autorização
          para aceder aos registos de auditoria do sistema.
        </p>
      </div>
    );
  }

  const params = await searchParams;
  const actionFilter = params.action || "all";
  const entityFilter = params.entity || "all";

  const adminClient = createAdminClient();

  // 1. Construção da query de auditoria
  let query = adminClient
    .from("audit_logs")
    .select("id, actor_user_id, action, entity_type, entity_id, before_data, after_data, reason, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (actionFilter !== "all") {
    query = query.ilike("action", `%${actionFilter}%`);
  }

  if (entityFilter !== "all") {
    query = query.eq("entity_type", entityFilter);
  }

  const { data: logs } = await query;
  const auditLogs = logs || [];

  // 2. Obter mapa de nomes dos utilizadores/atores
  const actorIds = Array.from(
    new Set(auditLogs.map((l) => l.actor_user_id).filter((id): id is string => Boolean(id)))
  );
  const actorMap: Record<string, { name: string; email: string }> = {};

  if (actorIds.length > 0) {
    const { data: actors } = await adminClient
      .from("admin_profiles")
      .select("id, display_name, email")
      .in("id", actorIds);

    (actors || []).forEach((a) => {
      actorMap[a.id] = { name: a.display_name, email: a.email };
    });
  }

  // 3. Contadores agregados
  const { count: totalLogsCount } = await adminClient
    .from("audit_logs")
    .select("id", { count: "exact", head: true });

  function getActionBadge(action: string) {
    if (action.includes("APPROVED")) {
      return {
        label: "Aprovação",
        class: "bg-emerald-50 text-emerald-700 border-emerald-200",
        icon: CheckCircle2,
      };
    }
    if (action.includes("REJECTED")) {
      return {
        label: "Rejeição",
        class: "bg-rose-50 text-rose-700 border-rose-200",
        icon: XCircle,
      };
    }
    if (action.includes("ACCREDITATION")) {
      return {
        label: "Credenciamento",
        class: "bg-amber-50 text-amber-700 border-amber-200",
        icon: ShieldCheck,
      };
    }
    if (action.includes("USER")) {
      return {
        label: "Gestão Utilizador",
        class: "bg-purple-50 text-purple-700 border-purple-200",
        icon: User,
      };
    }
    return {
      label: action,
      class: "bg-slate-100 text-slate-700 border-slate-300",
      icon: Database,
    };
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            Trilha de Auditoria Imutável
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Histórico cronológico rigoroso de todas as operações sensíveis, validações e alterações de estado.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-slate-900 text-slate-200 text-xs font-mono font-medium flex items-center gap-2 shadow-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Trigger protect_audit_logs ativo
          </span>
        </div>
      </div>

      {/* Alerta de Imutabilidade */}
      <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Garantia Criptográfica e Imutabilidade na Base de Dados:</span>
          <p className="text-amber-800 text-[11px] mt-0.5 leading-relaxed">
            Esta tabela é protegida diretamente a nível de PostgreSQL por um trigger de segurança. Nenhuma
            operação de <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">UPDATE</code> ou{" "}
            <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">DELETE</code> é permitida,
            mesmo para superadministradores. Todas as ações gravadas são permanentes e auditáveis.
          </p>
        </div>
      </div>

      {/* Tabela de Registos */}
      <div className="bg-[#F1F5F9] rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-600" />
            Registos Recentes ({auditLogs.length} de {totalLogsCount || 0})
          </h2>
          <span className="text-[11px] text-slate-400">Ordenado por data decrescente</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-slate-600 font-semibold text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">Data / Hora (Luanda)</th>
                <th className="py-3 px-4">Operação / Ação</th>
                <th className="py-3 px-4">Ator Responsável</th>
                <th className="py-3 px-4">Entidade Afetada</th>
                <th className="py-3 px-4">Motivo / Justificação</th>
                <th className="py-3 px-4 text-right">Payload Detalhado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLogs.map((log) => {
                const badge = getActionBadge(log.action);
                const Icon = badge.icon;
                const actor = log.actor_user_id ? actorMap[log.actor_user_id] : null;

                return (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition">
                    {/* Timestamp */}
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleDateString("pt-PT", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}{" "}
                      <span className="text-slate-400 font-medium">
                        {new Date(log.created_at).toLocaleTimeString("pt-PT", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </span>
                    </td>

                    {/* Ação */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${badge.class}`}
                      >
                        <Icon className="w-3 h-3" />
                        {badge.label}
                      </span>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                        {log.action}
                      </div>
                    </td>

                    {/* Ator */}
                    <td className="py-3 px-4">
                      {actor ? (
                        <div>
                          <div className="font-semibold text-slate-900 text-xs">{actor.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{actor.email}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Sistema / Automático</span>
                      )}
                    </td>

                    {/* Entidade */}
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-700 capitalize text-xs">
                        {log.entity_type}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 truncate max-w-[120px]">
                        {log.entity_id ? log.entity_id.substring(0, 8) + "..." : "—"}
                      </div>
                      {log.entity_type === "registrations" && log.entity_id && (
                        <Link
                          href={`/admin/inscricoes/${log.entity_id}`}
                          className="inline-flex items-center gap-0.5 text-[10px] text-blue-600 hover:underline mt-0.5"
                        >
                          Ver Inscrição <ArrowRight className="w-2.5 h-2.5" />
                        </Link>
                      )}
                    </td>

                    {/* Motivo */}
                    <td className="py-3 px-4 text-slate-600 text-xs max-w-xs">
                      {log.reason ? (
                        <span className="italic font-medium">&ldquo;{log.reason}&rdquo;</span>
                      ) : (
                        <span className="text-slate-400 italic">Sem justificação manual</span>
                      )}
                    </td>

                    {/* Payload JSON */}
                    <td className="py-3 px-4 text-right">
                      <AuditJsonViewer
                        beforeData={log.before_data}
                        afterData={log.after_data}
                      />
                    </td>
                  </tr>
                );
              })}

              {auditLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                    Nenhum registo de auditoria encontrado com os filtros aplicados.
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
