import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/**
 * Cliente Supabase com chave privilegiada (service_role).
 * ATENÇÃO DE SEGURANÇA:
 * NUNCA utilize este cliente no navegador nem em código acessível ao cliente.
 * O uso é restrito a rotas de servidor estritamente privadas ou scripts de manutenção.
 */
export function createAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error(
      "VIOLAÇÃO DE SEGURANÇA: O cliente admin do Supabase (service_role) nunca pode ser executado no navegador."
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "As variáveis NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias para o cliente administrativo."
    );
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
