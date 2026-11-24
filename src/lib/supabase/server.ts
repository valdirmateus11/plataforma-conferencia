import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/types/database.types";
import { validatePublicSupabaseEnv } from "./env";

/**
 * Cria o cliente Supabase para execução no Servidor (Server Components, Server Actions e Route Handlers).
 * Utiliza o armazenamento de cookies HTTP-only do Next.js para leitura e escrita seguras de tokens JWT.
 */
export async function createClient(): Promise<SupabaseClient<Database>> {
  const cookieStore = await cookies();
  const { url, anonKey } = validatePublicSupabaseEnv();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(
        cookiesToSet: {
          name: string;
          value: string;
          options?: CookieOptions;
        }[]
      ) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // O método `setAll` foi chamado a partir de um Server Component.
          // O middleware trata do refresh e gravação das sessões.
        }
      },
    },
  }) as unknown as SupabaseClient<Database>;
}
