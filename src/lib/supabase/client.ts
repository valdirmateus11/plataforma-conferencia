import { createBrowserClient } from "@supabase/ssr";
import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { validatePublicSupabaseEnv } from "./env";

/**
 * Cria o cliente Supabase para execução no Browser (Client Components).
 * Opera sob proteção rigorosa de Row Level Security (RLS) e chave pública (anon).
 */
export function createClient(): SupabaseClient<Database> {
  const { url, anonKey } = validatePublicSupabaseEnv();
  return createBrowserClient(url, anonKey) as unknown as SupabaseClient<Database>;
}
