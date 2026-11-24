import { createClient } from "./server";
import { getSupabaseEnvDiagnostics } from "./env";

export interface ConnectionTestResult {
  timestamp: string;
  success: boolean;
  latencyMs: number;
  env: {
    urlConfigured: boolean;
    maskedUrl: string;
    anonKeyConfigured: boolean;
    anonKeyLength: number;
    serviceRoleConfigured: boolean;
    serviceRolePlaceholder: boolean;
  };
  authService: {
    reachable: boolean;
    status: "connected" | "error" | "unreachable";
    message: string;
  };
  databaseService: {
    reachable: boolean;
    status: "connected" | "ready_for_schema" | "error";
    message: string;
  };
}

/**
 * Executa um teste de conectividade seguro e não destrutivo com o projeto Supabase.
 * Nunca expõe chaves secretas ou dados sensíveis.
 */
export async function testSupabaseConnection(): Promise<ConnectionTestResult> {
  const startTime = Date.now();
  const envDiag = getSupabaseEnvDiagnostics();

  const result: ConnectionTestResult = {
    timestamp: new Date().toISOString(),
    success: false,
    latencyMs: 0,
    env: {
      urlConfigured: envDiag.supabaseUrl.defined && envDiag.supabaseUrl.validFormat,
      maskedUrl: envDiag.supabaseUrl.maskedValue,
      anonKeyConfigured: envDiag.supabaseAnonKey.defined && !envDiag.supabaseAnonKey.isPlaceholder,
      anonKeyLength: envDiag.supabaseAnonKey.length,
      serviceRoleConfigured: envDiag.supabaseServiceRoleKey.defined,
      serviceRolePlaceholder: envDiag.supabaseServiceRoleKey.isPlaceholder,
    },
    authService: {
      reachable: false,
      status: "unreachable",
      message: "Não testado",
    },
    databaseService: {
      reachable: false,
      status: "error",
      message: "Não testado",
    },
  };

  if (!envDiag.readyForServer) {
    result.authService.message = "Variáveis de ambiente ausentes ou com valores placeholder.";
    result.databaseService.message = "Variáveis de ambiente ausentes ou com valores placeholder.";
    result.latencyMs = Date.now() - startTime;
    return result;
  }

  try {
    const supabase = await createClient();

    // 1. Teste de Comunicação com o Supabase Auth (GoTrue)
    try {
      const { error: authError } = await supabase.auth.getSession();
      if (!authError) {
        result.authService.reachable = true;
        result.authService.status = "connected";
        result.authService.message = "Comunicação com o serviço Auth (GoTrue) estabelecida com sucesso.";
      } else {
        result.authService.reachable = true;
        result.authService.status = "error";
        result.authService.message = `Erro retornado pelo Auth: ${authError.message}`;
      }
    } catch (authErr) {
      result.authService.status = "error";
      result.authService.message = authErr instanceof Error ? authErr.message : "Falha na requisição Auth.";
    }

    // 2. Teste de Comunicação com a API REST / PostgREST
    try {
      // Fazemos uma consulta à tabela conferences
      // Como as tabelas ainda não foram criadas nesta fase, esperamos erro PGRST205 (tabela não encontrada no schema cache)
      const { error: dbError } = await supabase.from("conferences").select("count").limit(1);

      if (!dbError) {
        result.databaseService.reachable = true;
        result.databaseService.status = "connected";
        result.databaseService.message = "Comunicação com a base de dados ativa e tabela disponível.";
      } else if (dbError.code === "PGRST205" || dbError.message.includes("schema cache") || dbError.code === "42P01") {
        // Confirmação segura de que a API PostgREST autenticou a chave e respondeu ativamente
        result.databaseService.reachable = true;
        result.databaseService.status = "ready_for_schema";
        result.databaseService.message =
          "PostgREST contactado com sucesso (código aceito). Schema pronto para migrações da Fase 2.";
      } else {
        result.databaseService.reachable = true;
        result.databaseService.status = "error";
        result.databaseService.message = `Resposta PostgREST: [${dbError.code}] ${dbError.message}`;
      }
    } catch (dbErr) {
      result.databaseService.status = "error";
      result.databaseService.message = dbErr instanceof Error ? dbErr.message : "Falha na requisição PostgREST.";
    }

    result.latencyMs = Date.now() - startTime;
    result.success =
      result.authService.reachable &&
      (result.databaseService.status === "connected" || result.databaseService.status === "ready_for_schema");

    return result;
  } catch (err) {
    result.latencyMs = Date.now() - startTime;
    result.authService.message = err instanceof Error ? err.message : "Erro desconhecido ao instanciar Supabase.";
    result.databaseService.message = err instanceof Error ? err.message : "Erro desconhecido ao instanciar Supabase.";
    return result;
  }
}
