"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAdmin } from "@/features/administration/actions/auth-actions";
import { CONFERENCE_CONFIG } from "@/lib/config";

export interface AttendanceActionResult {
  success?: boolean;
  error?: string;
  data?: unknown;
}

/**
 * Regista a presença presencial de um participante credenciado numa sessão aberta.
 * Invoca a RPC atómica `record_session_attendance` com todas as validações de autorização e unicidade.
 */
export async function recordAttendance(
  sessionId: string,
  registrationId: string
): Promise<AttendanceActionResult> {
  const currentAdmin = await getCurrentAdmin();
  if (
    !currentAdmin ||
    (!currentAdmin.isSuperAdmin && !currentAdmin.roles.includes("attendance_operator"))
  ) {
    return {
      error: "Acesso negado: apenas operadores de presenças e o Superadministrador podem registar presenças.",
    };
  }

  const supabase = await createClient();

  // 1. Obter conferência ativa
  const { data: conference } = await supabase
    .from("conferences")
    .select("id")
    .eq("slug", CONFERENCE_CONFIG.slug)
    .single();

  if (!conference) {
    return { error: "Conferência ativa não encontrada." };
  }

  // 2. Chamar RPC atómica record_session_attendance
  const { data, error } = await supabase.rpc("record_session_attendance", {
    p_conference_id: conference.id,
    p_session_id: sessionId,
    p_registration_id: registrationId,
  });

  if (error) {
    if (error.code === "P0010" || error.message.includes("SESSION_NOT_OPEN")) {
      return { error: "A sessão selecionada não se encontra aberta para registo de presenças." };
    }
    if (error.code === "P0011" || error.message.includes("PARTICIPANT_NOT_CREDENTIALED")) {
      return {
        error: "O participante ainda não foi credenciado no secretariado. Apenas participantes credenciados podem registar presença.",
      };
    }
    if (error.code === "P0012" || error.message.includes("ALREADY_RECORDED_PRESENT")) {
      return { error: "Presença já registada anteriormente para este participante nesta sessão." };
    }
    if (error.code === "42501" || error.message.includes("FORBIDDEN")) {
      return { error: "A sua conta não tem permissão para registar presenças." };
    }
    return { error: `Erro ao registar presença: ${error.message}` };
  }

  revalidatePath("/admin/presencas");
  revalidatePath("/admin/sessoes");
  revalidatePath("/admin/dashboard");
  revalidatePath(`/admin/inscricoes/${registrationId}`);

  return { success: true, data };
}

/**
 * Anula um registo de presença (operação sensível restrita a Superadministrador, com motivo e auditoria).
 */
export async function voidAttendance(
  attendanceId: string,
  registrationId: string,
  reason: string
): Promise<AttendanceActionResult> {
  const currentAdmin = await getCurrentAdmin();
  if (!currentAdmin || !currentAdmin.isSuperAdmin) {
    return { error: "Apenas o Superadministrador pode anular um registo de presença." };
  }

  if (!reason || reason.trim().length < 5) {
    return { error: "A justificação de anulação é obrigatória e deve ter pelo menos 5 caracteres." };
  }

  const adminClient = createAdminClient();

  // 1. Obter registo atual
  const { data: currentAtt, error: fetchErr } = await adminClient
    .from("attendance_records")
    .select("id, conference_id, session_id, registration_id, status")
    .eq("id", attendanceId)
    .single();

  if (fetchErr || !currentAtt) {
    return { error: "Registo de presença não encontrado." };
  }

  if (currentAtt.status === "voided") {
    return { error: "Este registo de presença já se encontra anulado." };
  }

  // 2. Atualizar estado para voided
  const { error: updateErr } = await adminClient
    .from("attendance_records")
    .update({
      status: "voided",
      voided_at: new Date().toISOString(),
      voided_by: currentAdmin.id,
      reason: reason.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", attendanceId);

  if (updateErr) {
    return { error: `Erro ao anular presença: ${updateErr.message}` };
  }

  // 3. Registo na auditoria imutável
  await adminClient.from("audit_logs").insert({
    actor_user_id: currentAdmin.id,
    conference_id: currentAtt.conference_id,
    action: "ATTENDANCE_VOIDED",
    entity_type: "attendance_records",
    entity_id: attendanceId,
    before_data: currentAtt,
    after_data: { status: "voided", voided_by: currentAdmin.id, reason: reason.trim() },
    reason: reason.trim(),
  });

  revalidatePath("/admin/presencas");
  revalidatePath("/admin/sessoes");
  revalidatePath("/admin/dashboard");
  revalidatePath(`/admin/inscricoes/${registrationId}`);

  return { success: true };
}
