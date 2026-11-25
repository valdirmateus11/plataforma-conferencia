"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentAdmin } from "@/features/administration/actions/auth-actions";

export interface OrganizationActionResult {
  success?: boolean;
  error?: string;
  organization?: unknown;
}

export async function createOrganization(
  formData: FormData
): Promise<OrganizationActionResult> {
  // SEGURANÇA: Verifica autenticação e autorização antes de qualquer operação
  const admin = await getCurrentAdmin();
  if (!admin) {
    return { error: "Acesso negado. Autenticação obrigatória." };
  }
  if (!admin.isSuperAdmin && !admin.roles.includes("registration_admin")) {
    return { error: "Acesso negado. Não tem permissão para criar organizações." };
  }

  const name = formData.get("name")?.toString().trim();
  const municipality = formData.get("municipality")?.toString().trim();
  const district = formData.get("district")?.toString().trim();

  if (!name || !municipality || !district) {
    return { error: "Todos os campos da organização são obrigatórios." };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("organizations")
    .insert({
      name,
      municipality,
      ecclesiastical_district: district,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        error: "Esta igreja/organização já se encontra registada nesta jurisdição.",
      };
    }
    return { error: `Erro ao registar organização: ${error.message}` };
  }

  revalidatePath("/admin/organizacoes");
  return { success: true, organization: data };
}

export async function createOrganizationAction(
  _prevState: OrganizationActionResult | null,
  formData: FormData
): Promise<OrganizationActionResult> {
  return createOrganization(formData);
}
