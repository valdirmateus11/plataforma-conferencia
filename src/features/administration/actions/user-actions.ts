"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAdmin } from "./auth-actions";
import type { AdminRoleName } from "@/types/database.types";

export async function createAdminUser(formData: FormData) {
  const currentAdmin = await getCurrentAdmin();
  if (!currentAdmin || !currentAdmin.isSuperAdmin) {
    return { error: "Apenas o Superadministrador pode criar novos utilizadores administrativos." };
  }

  const displayName = formData.get("displayName")?.toString().trim();
  const email = formData.get("email")?.toString().trim().toLowerCase();
  const password = formData.get("password")?.toString();
  const selectedRoles = formData.getAll("roles").map((r) => r.toString()) as AdminRoleName[];

  if (!displayName || !email || !password || selectedRoles.length === 0) {
    return { error: "Nome, e-mail, palavra-passe e pelo menos uma função são obrigatórios." };
  }

  if (password.length < 6) {
    return { error: "A palavra-passe deve conter pelo menos 6 caracteres." };
  }

  try {
    const adminClient = createAdminClient();

    // 1. Criação do utilizador no Supabase Auth
    const { data: authUser, error: authErr } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: displayName },
    });

    if (authErr || !authUser.user) {
      return { error: `Erro ao criar utilizador no Auth: ${authErr?.message}` };
    }

    const newUserId = authUser.user.id;

    // 2. Criação do perfil em admin_profiles
    const { error: profileErr } = await adminClient.from("admin_profiles").insert({
      id: newUserId,
      display_name: displayName,
      email,
      is_active: true,
    });

    if (profileErr) {
      // Reverte criação se perfil falhar
      await adminClient.auth.admin.deleteUser(newUserId);
      return { error: `Erro ao criar perfil administrativo: ${profileErr.message}` };
    }

    // 3. Obter IDs dos papéis selecionados
    const { data: roleRecords } = await adminClient
      .from("admin_roles")
      .select("id, name")
      .in("name", selectedRoles);

    if (roleRecords && roleRecords.length > 0) {
      const userRolesPayload = roleRecords.map((r) => ({
        user_id: newUserId,
        role_id: r.id,
      }));
      await adminClient.from("admin_user_roles").insert(userRolesPayload);
    }

    // 4. Registo na Trilha de Auditoria
    await adminClient.from("audit_logs").insert({
      actor_user_id: currentAdmin.id,
      action: "ADMIN_USER_CREATED",
      entity_type: "admin_profiles",
      entity_id: newUserId,
      after_data: { email, displayName, roles: selectedRoles },
      reason: "Criação de utilizador administrativo pelo Superadmin",
    });

    revalidatePath("/admin/utilizadores");
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro desconhecido ao criar utilizador." };
  }
}

export async function toggleAdminStatus(userId: string, newStatus: boolean) {
  const currentAdmin = await getCurrentAdmin();
  if (!currentAdmin || !currentAdmin.isSuperAdmin) {
    return { error: "Acesso negado: apenas o Superadministrador pode alterar o estado de contas." };
  }

  if (currentAdmin.id === userId) {
    return { error: "Não é permitido desativar a sua própria conta de Superadministrador." };
  }

  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from("admin_profiles")
    .update({ is_active: newStatus, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) {
    return { error: `Erro ao atualizar estado: ${error.message}` };
  }

  await adminClient.from("audit_logs").insert({
    actor_user_id: currentAdmin.id,
    action: newStatus ? "ADMIN_USER_ACTIVATED" : "ADMIN_USER_DEACTIVATED",
    entity_type: "admin_profiles",
    entity_id: userId,
    after_data: { is_active: newStatus },
    reason: "Alteração de estado operacional pelo Superadministrador",
  });

  revalidatePath("/admin/utilizadores");
  return { success: true };
}
