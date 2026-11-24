"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createOrganization(formData: FormData) {
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
      return { error: "Esta igreja/organização já se encontra registada nesta jurisdição." };
    }
    return { error: `Erro ao registar organização: ${error.message}` };
  }

  revalidatePath("/admin/organizacoes");
  return { success: true, organization: data };
}
