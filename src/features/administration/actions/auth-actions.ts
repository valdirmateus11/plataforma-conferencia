"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AdminRoleName } from "@/types/database.types";

export interface AdminUserSession {
  id: string;
  email: string;
  displayName: string;
  isActive: boolean;
  roles: AdminRoleName[];
  isSuperAdmin: boolean;
}

/**
 * Autentica o utilizador administrativo com email e palavra-passe.
 * Valida a existência do perfil e se este se encontra ativo.
 */
export async function signInAdmin(
  prevState: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  const email = formData.get("email")?.toString().trim();
  const password = formData.get("password")?.toString();

  if (!email || !password) {
    return { error: "Por favor, introduza o e-mail e a palavra-passe." };
  }

  const supabase = await createClient();

  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (authError || !authData.user) {
    return { error: "Credenciais inválidas. Verifique o e-mail e a palavra-passe." };
  }

  // Verifica o perfil em admin_profiles
  const { data: profile, error: profileError } = await supabase
    .from("admin_profiles")
    .select("id, is_active, display_name")
    .eq("id", authData.user.id)
    .single();

  if (profileError || !profile) {
    await supabase.auth.signOut();
    return {
      error:
        "Este utilizador não possui um perfil administrativo registado na plataforma.",
    };
  }

  if (!profile.is_active) {
    await supabase.auth.signOut();
    return {
      error:
        "A sua conta administrativa foi desativada. Contacte o Superadministrador.",
    };
  }

  const redirectTo = formData.get("redirectTo")?.toString() || "/admin/dashboard";
  redirect(redirectTo);
}

/**
 * Termina a sessão do utilizador administrativo.
 */
export async function signOutAdmin(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

/**
 * Obtém a sessão do administrador autenticado atual com as suas funções RBAC.
 */
export async function getCurrentAdmin(): Promise<AdminUserSession | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
      .from("admin_profiles")
      .select("id, display_name, email, is_active")
      .eq("id", user.id)
      .single();

    if (!profile || !profile.is_active) return null;

    // Obtém as funções atribuídas ao utilizador
    const { data: userRoles } = await supabase
      .from("admin_user_roles")
      .select("role_id, admin_roles(name)")
      .eq("user_id", user.id);

    const roles: AdminRoleName[] = (userRoles || [])
      .map((ur) => (ur as unknown as { admin_roles: { name: AdminRoleName } | null })?.admin_roles?.name)
      .filter((n): n is AdminRoleName => Boolean(n));

    return {
      id: profile.id,
      email: profile.email,
      displayName: profile.display_name,
      isActive: profile.is_active,
      roles,
      isSuperAdmin: roles.includes("super_admin"),
    };
  } catch {
    return null;
  }
}
