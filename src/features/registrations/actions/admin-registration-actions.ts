"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { RegistrationStatus } from "@/types/database.types";

export type AdminStatusChangeResult =
  | { success: true; message: string; newStatus: RegistrationStatus }
  | { success: false; error: string };

/**
 * Altera o estado de uma inscrição utilizando a Stored Procedure atómica com lock de capacidade.
 */
export async function updateRegistrationStatus(
  registrationId: string,
  newStatus: RegistrationStatus,
  reason: string = ""
): Promise<AdminStatusChangeResult> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("change_registration_status", {
    p_registration_id: registrationId,
    p_new_status: newStatus,
    p_reason: reason.trim() || `Alteração para ${newStatus} pelo painel administrativo`,
  });

  if (error) {
    if (error.message.includes("CAPACITY_EXCEEDED_CANNOT_REACTIVATE") || error.code === "P0005") {
      return {
        success: false,
        error:
          "Não é possível reativar esta inscrição pois a capacidade limite de 500 participantes foi atingida. Para reativar, aumente a capacidade da conferência nas configurações ou aguarde a libertação de uma vaga.",
      };
    }

    if (error.message.includes("FORBIDDEN_INSUFFICIENT_PERMISSIONS") || error.code === "42501") {
      return {
        success: false,
        error: "Não tem permissões suficientes para alterar o estado desta inscrição.",
      };
    }

    return {
      success: false,
      error: `Erro ao atualizar estado: ${error.message}`,
    };
  }

  // Revalidação dos caminhos Next.js
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/inscricoes");
  revalidatePath(`/admin/inscricoes/${registrationId}`);

  const statusLabel =
    newStatus === "approved"
      ? "aprovada"
      : newStatus === "rejected"
      ? "rejeitada"
      : newStatus === "cancelled"
      ? "cancelada"
      : "colocada em análise pendente";

  return {
    success: true,
    message: `A inscrição foi ${statusLabel} com sucesso.`,
    newStatus,
  };
}
