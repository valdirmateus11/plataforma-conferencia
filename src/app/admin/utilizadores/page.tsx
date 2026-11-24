import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAdmin } from "@/features/administration/actions/auth-actions";
import { Shield, ShieldAlert, Users, CheckCircle, Ban } from "lucide-react";
import { CreateAdminForm } from "@/components/forms/create-admin-form";
import { ToggleAdminButton } from "@/components/forms/toggle-admin-button";
import type { AdminRoleName } from "@/types/database.types";

export const dynamic = "force-dynamic";

const ROLE_BADGES: Record<AdminRoleName, { label: string; class: string }> = {
  super_admin: { label: "Superadmin", class: "bg-purple-50 text-purple-700 border-purple-200" },
  registration_admin: { label: "Coordenação / Registo", class: "bg-blue-50 text-blue-700 border-blue-200" },
  validator: { label: "Validador", class: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  accreditation_operator: { label: "Credenciamento", class: "bg-amber-50 text-amber-700 border-amber-200" },
  attendance_operator: { label: "Presenças", class: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  consultant: { label: "Consultor / Auditor", class: "bg-slate-100 text-slate-700 border-slate-300" },
};

export default async function AdminUtilizadoresPage() {
  const currentAdmin = await getCurrentAdmin();

  if (!currentAdmin || !currentAdmin.isSuperAdmin) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl shadow-sm border border-slate-200 max-w-xl mx-auto my-12 space-y-4">
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900">Acesso Restrito a Superadministradores</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          O módulo de gestão de utilizadores e atribuição de permissões operacionais é reservado
          exclusivamente ao perfil de Superadministrador.
        </p>
      </div>
    );
  }

  const adminClient = createAdminClient();

  // 1. Obter todos os perfis administrativos
  const { data: profiles } = await adminClient
    .from("admin_profiles")
    .select("id, display_name, email, is_active, created_at")
    .order("created_at", { ascending: false });

  // 2. Obter todas as atribuições de papéis
  const { data: userRoles } = await adminClient
    .from("admin_user_roles")
    .select("user_id, role_id, admin_roles(name)");

  // Mapear funções por utilizador
  const rolesByUser: Record<string, AdminRoleName[]> = {};
  (userRoles || []).forEach((ur) => {
    const roleName = (ur as unknown as { admin_roles: { name: AdminRoleName } | null })?.admin_roles?.name;
    if (roleName) {
      if (!rolesByUser[ur.user_id]) rolesByUser[ur.user_id] = [];
      rolesByUser[ur.user_id].push(roleName);
    }
  });

  const allProfiles = profiles || [];
  const activeCount = allProfiles.filter((p) => p.is_active).length;
  const inactiveCount = allProfiles.filter((p) => !p.is_active).length;
  const superAdminCount = allProfiles.filter((p) =>
    (rolesByUser[p.id] || []).includes("super_admin")
  ).length;

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" />
            Utilizadores & Funções RBAC
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Gestão de contas de acesso administrativo e atribuição de permissões para a conferência.
          </p>
        </div>
        <CreateAdminForm />
      </div>

      {/* Cartões de Indicadores */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
            <Users className="w-4 h-4 text-blue-600" />
            Total Contas
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{allProfiles.length}</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            Contas Ativas
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">{activeCount}</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
            <Ban className="w-4 h-4 text-slate-400" />
            Contas Inativas
          </div>
          <div className="text-2xl font-black text-slate-500 mt-2">{inactiveCount}</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
            <Shield className="w-4 h-4 text-purple-600" />
            Superadmins
          </div>
          <div className="text-2xl font-black text-purple-600 mt-2">{superAdminCount}</div>
        </div>
      </div>

      {/* Tabela de Utilizadores */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-600" />
            Administradores e Operadores Registados ({allProfiles.length})
          </h2>
          <span className="text-[11px] text-slate-400">
            RBAC estrito controlado por funções na base de dados
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-slate-600 font-semibold text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">Utilizador</th>
                <th className="py-3 px-4">Funções RBAC</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4">Data Criação</th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allProfiles.map((user) => {
                const userRoleList = rolesByUser[user.id] || [];
                const isSelf = user.id === currentAdmin.id;

                return (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 text-xs">
                        {user.display_name}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {user.email}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {userRoleList.map((r) => {
                          const badge = ROLE_BADGES[r] || {
                            label: r,
                            class: "bg-slate-100 text-slate-700 border-slate-300",
                          };
                          return (
                            <span
                              key={r}
                              className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded-md border ${badge.class}`}
                            >
                              {badge.label}
                            </span>
                          );
                        })}
                        {userRoleList.length === 0 && (
                          <span className="text-[11px] text-slate-400 italic">
                            Sem papéis atribuídos
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {user.is_active ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          Inativo
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {new Date(user.created_at).toLocaleDateString("pt-PT", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <ToggleAdminButton
                        userId={user.id}
                        isActive={user.is_active}
                        isSelf={isSelf}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
