"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentAdmin } from "@/features/administration/actions/auth-actions";
import type { SessionStatus } from "@/types/database.types";

export interface SessionActionResult {
  success?: boolean;
  error?: string;
  data?: unknown;
}

/**
 * Cria uma nova sessão plenária da conferência.
 */
export async function createSession(formData: FormData): Promise<SessionActionResult> {
  const currentAdmin = await getCurrentAdmin();
  if (!currentAdmin || (!currentAdmin.isSuperAdmin && !currentAdmin.roles.includes("registration_admin"))) {
    return { error: "Apenas o Superadministrador e a Coordenação podem criar sessões plenárias." };
  }

  const name = formData.get("name")?.toString().trim();
  const description = formData.get("description")?.toString().trim() || null;
  const sessionDate = formData.get("sessionDate")?.toString().trim();
  const startsAt = formData.get("startsAt")?.toString().trim() || null;
  const endsAt = formData.get("endsAt")?.toString().trim() || null;
  const sortOrderStr = formData.get("sortOrder")?.toString().trim() || "0";
  const sortOrder = parseInt(sortOrderStr, 10) || 0;

  if (!name || !sessionDate) {
    return { error: "Nome da sessão e data são obrigatórios." };
  }

  const supabase = await createClient();

  // 1. Obter a conferência ativa
  const { data: conference } = await supabase
    .from("conferences")
    .select("id")
    .eq("slug", "iii-conferencia-distrital-luanda-2026")
    .single();

  if (!conference) {
    return { error: "Conferência ativa não encontrada." };
  }

  // 2. Inserir a sessão
  const { data: session, error: insertErr } = await supabase
    .from("sessions")
    .insert({
      conference_id: conference.id,
      name,
      description,
      session_date: sessionDate,
      starts_at: startsAt,
      ends_at: endsAt,
      sort_order: sortOrder,
      status: "planned",
    })
    .select()
    .single();

  if (insertErr || !session) {
    return { error: `Erro ao criar sessão: ${insertErr?.message}` };
  }

  // 3. Registar na auditoria imutável
  await supabase.from("audit_logs").insert({
    actor_user_id: currentAdmin.id,
    conference_id: conference.id,
    action: "SESSION_CREATED",
    entity_type: "sessions",
    entity_id: session.id,
    after_data: session,
    reason: `Criação da sessão plenária "${name}"`,
  });

  revalidatePath("/admin/sessoes");
  revalidatePath("/admin/presencas");
  revalidatePath("/admin/dashboard");

  return { success: true, data: session };
}

/**
 * Altera o estado de uma sessão (planned, open, closed, cancelled).
 */
export async function updateSessionStatus(
  sessionId: string,
  newStatus: SessionStatus,
  reason?: string
): Promise<SessionActionResult> {
  const currentAdmin = await getCurrentAdmin();
  if (!currentAdmin || (!currentAdmin.isSuperAdmin && !currentAdmin.roles.includes("registration_admin"))) {
    return { error: "Sem permissão para alterar o estado da sessão." };
  }

  const supabase = await createClient();

  // 1. Obter estado atual
  const { data: currentSession, error: fetchErr } = await supabase
    .from("sessions")
    .select("id, conference_id, name, status")
    .eq("id", sessionId)
    .single();

  if (fetchErr || !currentSession) {
    return { error: "Sessão não encontrada." };
  }

  // 2. Atualizar estado
  const { error: updateErr } = await supabase
    .from("sessions")
    .update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sessionId);

  if (updateErr) {
    return { error: `Erro ao atualizar estado: ${updateErr.message}` };
  }

  // 3. Registo de auditoria
  await supabase.from("audit_logs").insert({
    actor_user_id: currentAdmin.id,
    conference_id: currentSession.conference_id,
    action: `SESSION_STATUS_${newStatus.toUpperCase()}`,
    entity_type: "sessions",
    entity_id: sessionId,
    before_data: { status: currentSession.status },
    after_data: { status: newStatus },
    reason: reason || `Alteração de estado da sessão "${currentSession.name}" para ${newStatus}`,
  });

  revalidatePath("/admin/sessoes");
  revalidatePath("/admin/presencas");
  revalidatePath("/admin/dashboard");

  return { success: true };
}
