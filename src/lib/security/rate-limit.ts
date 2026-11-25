import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { CONFERENCE_CONFIG } from "@/lib/config";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
  error?: string;
}

/**
 * Rate limiting persistente apoiado na tabela `audit_logs` do Supabase.
 * Adequado para ambientes serverless/distribuídos porque não depende de memória local de instância.
 */
export async function checkExportRateLimit(
  adminClient: SupabaseClient<Database>,
  userId: string,
  action: "EXPORT_REGISTRATIONS_CSV" | "EXPORT_ATTENDANCE_CSV",
  options?: {
    maxRequests?: number;
    windowMinutes?: number;
    now?: Date;
  }
): Promise<RateLimitResult> {
  const maxRequests =
    options?.maxRequests ?? CONFERENCE_CONFIG.exportRateLimit.maxRequests;
  const windowMinutes =
    options?.windowMinutes ?? CONFERENCE_CONFIG.exportRateLimit.windowMinutes;
  const now = options?.now ?? new Date();
  const windowStart = new Date(now.getTime() - windowMinutes * 60 * 1000);

  try {
    const { data, count, error } = await adminClient
      .from("audit_logs")
      .select("created_at", { count: "exact" })
      .eq("actor_user_id", userId)
      .eq("action", action)
      .gte("created_at", windowStart.toISOString())
      .order("created_at", { ascending: true });

    if (error) {
      // Fail-closed em erro de verificação para proteger exportações em massa
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: 60,
        error:
          "Não foi possível validar o limite de exportações neste momento. Tente novamente dentro de instantes.",
      };
    }

    const used = count ?? data?.length ?? 0;

    if (used >= maxRequests) {
      const oldestTimestamp = data?.[0]?.created_at
        ? new Date(data[0].created_at).getTime()
        : windowStart.getTime();
      const resetAt = oldestTimestamp + windowMinutes * 60 * 1000;
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((resetAt - now.getTime()) / 1000)
      );

      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds,
        error: `Limite de ${maxRequests} exportações em ${windowMinutes} minutos atingido. Aguarde ${retryAfterSeconds} segundos antes de tentar novamente.`,
      };
    }

    return {
      allowed: true,
      remaining: Math.max(0, maxRequests - used - 1),
      retryAfterSeconds: 0,
    };
  } catch {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: 60,
      error: "Erro ao verificar o limite de taxa de exportação.",
    };
  }
}
