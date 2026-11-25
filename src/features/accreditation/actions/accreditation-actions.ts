"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAdmin } from "@/features/administration/actions/auth-actions";
import { CONFERENCE_CONFIG } from "@/lib/config";

export interface AccreditationActionResult {
  success?: boolean;
  error?: string;
  data?: unknown;
}

/**
 * Confirma o credenciamento presencial de um participante elegível.
 * Invoca a RPC atómica `process_accreditation` com verificação de autorização e lock de unicidade.
 */
export async function confirmAccreditation(
  registrationId: string,
  notes: string = ""
): Promise<AccreditationActionResult> {
  const currentAdmin = await getCurrentAdmin();
  if (
    !currentAdmin ||
    (!currentAdmin.isSuperAdmin && !currentAdmin.roles.includes("accreditation_operator"))
  ) {
    return {
      error: "Acesso negado: apenas operadores de credenciamento e o Superadministrador podem credenciar participantes.",
    };
  }

  const supabase = await createClient();

  // 1. Obter a conferência ativa
  const { data: conference } = await supabase
    .from("conferences")
    .select("id")
    .eq("slug", CONFERENCE_CONFIG.slug)
    .single();

  if (!conference) {
    return { error: "Conferência ativa não encontrada." };
  }

  // 2. Chamar RPC atómica process_accreditation
  const { data, error } = await supabase.rpc("process_accreditation", {
    p_conference_id: conference.id,
    p_registration_id: registrationId,
    p_notes: notes.trim() || null,
  });

  if (error) {
    if (error.code === "P0007" || error.message.includes("REGISTRATION_NOT_APPROVED")) {
      return {
        error: "Este participante não pode ser credenciado porque a sua inscrição não está aprovada.",
      };
    }
    if (error.code === "P0008" || error.message.includes("ALREADY_CREDENTIALED")) {
      return {
        error: "Este participante já se encontra credenciado no sistema.",
      };
    }
    if (error.code === "42501" || error.message.includes("FORBIDDEN")) {
      return {
        error: "A sua conta não possui permissão ativa para registar credenciamentos.",
      };
    }
    return { error: `Erro no credenciamento: ${error.message}` };
  }

  revalidatePath("/admin/credenciamento");
  revalidatePath("/admin/dashboard");
  revalidatePath(`/admin/inscricoes/${registrationId}`);

  return { success: true, data };
}

/**
 * Revoga um credenciamento ativo (operação exclusiva de Superadministrador, com motivo e auditoria).
 */
export async function revokeAccreditation(
  accreditationId: string,
  registrationId: string,
  reason: string
): Promise<AccreditationActionResult> {
  const currentAdmin = await getCurrentAdmin();
  if (!currentAdmin || !currentAdmin.isSuperAdmin) {
    return {
      error: "Apenas o Superadministrador pode revogar um credenciamento já realizado.",
    };
  }

  if (!reason || reason.trim().length < 5) {
    return {
      error: "A justificação de revogação é obrigatória e deve ter pelo menos 5 caracteres.",
    };
  }

  const adminClient = createAdminClient();

  // 1. Obter credenciamento atual
  const { data: currentAcc, error: fetchErr } = await adminClient
    .from("accreditations")
    .select("id, conference_id, registration_id, status")
    .eq("id", accreditationId)
    .single();

  if (fetchErr || !currentAcc) {
    return { error: "Registo de credenciamento não encontrado." };
  }

  if (currentAcc.status === "revoked") {
    return { error: "Este credenciamento já se encontra revogado." };
  }

  // 2. Atualizar estado para 'revoked'
  const { error: updateErr } = await adminClient
    .from("accreditations")
    .update({
      status: "revoked",
      revoked_at: new Date().toISOString(),
      revoked_by: currentAdmin.id,
      reason: reason.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", accreditationId);

  if (updateErr) {
    return { error: `Erro ao revogar credenciamento: ${updateErr.message}` };
  }

  // 3. Registo na Trilha de Auditoria Imutável
  await adminClient.from("audit_logs").insert({
    actor_user_id: currentAdmin.id,
    conference_id: currentAcc.conference_id,
    action: "ACCREDITATION_REVOKED",
    entity_type: "accreditations",
    entity_id: accreditationId,
    before_data: currentAcc,
    after_data: { status: "revoked", revoked_by: currentAdmin.id, reason: reason.trim() },
    reason: reason.trim(),
  });

  revalidatePath("/admin/credenciamento");
  revalidatePath("/admin/dashboard");
  revalidatePath(`/admin/inscricoes/${registrationId}`);

  return { success: true };
}
