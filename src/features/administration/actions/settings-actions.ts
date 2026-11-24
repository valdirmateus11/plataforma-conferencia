"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentAdmin } from "./auth-actions";

export interface SettingsUpdateResult {
  success?: boolean;
  error?: string;
}

export async function updateConferenceSettings(
  formData: FormData
): Promise<SettingsUpdateResult> {
  const currentAdmin = await getCurrentAdmin();
  if (!currentAdmin || (!currentAdmin.isSuperAdmin && !currentAdmin.roles.includes("registration_admin"))) {
    return { error: "Apenas o Superadministrador e a Coordenação Geral podem alterar os parâmetros da conferência." };
  }

  const conferenceId = formData.get("conferenceId")?.toString();
  const capacityStr = formData.get("capacity")?.toString();
  const registrationOpen = formData.get("registrationOpen") === "true";
  const location = formData.get("location")?.toString().trim();
  const codePrefix = formData.get("codePrefix")?.toString().trim().toUpperCase();

  if (!conferenceId || !capacityStr) {
    return { error: "ID da conferência e capacidade são obrigatórios." };
  }

  const capacity = parseInt(capacityStr, 10);
  if (isNaN(capacity) || capacity < 1) {
    return { error: "A capacidade deve ser um número inteiro positivo." };
  }

  const supabase = await createClient();

  // 1. Obter dados atuais antes da alteração
  const { data: currentConf } = await supabase
    .from("conferences")
    .select("capacity, registration_open, code_prefix, description")
    .eq("id", conferenceId)
    .single();

  // 2. Atualizar tabela conferences
  const { error } = await supabase
    .from("conferences")
    .update({
      capacity,
      registration_open: registrationOpen,
      code_prefix: codePrefix || "CDJ26",
      description: location || "Plataforma oficial da III Sessão Bienal da Conferência Distrital da Juventude de Luanda.",
      updated_at: new Date().toISOString(),
    })
    .eq("id", conferenceId);

  if (error) {
    return { error: `Erro ao atualizar parâmetros: ${error.message}` };
  }

  // 3. Registo na Trilha de Auditoria Imutável
  await supabase.from("audit_logs").insert({
    actor_user_id: currentAdmin.id,
    conference_id: conferenceId,
    action: "CONFERENCE_SETTINGS_UPDATED",
    entity_type: "conferences",
    entity_id: conferenceId,
    before_data: currentConf,
    after_data: { capacity, registration_open: registrationOpen, location, codePrefix },
    reason: "Atualização dos parâmetros gerais da conferência no painel administrativo",
  });

  revalidatePath("/admin/configuracoes");
  revalidatePath("/admin/dashboard");
  revalidatePath("/");

  return { success: true };
}
