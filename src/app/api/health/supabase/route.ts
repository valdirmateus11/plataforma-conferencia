import { NextResponse } from "next/server";
import { testSupabaseConnection } from "@/lib/supabase/test-connection";

export const dynamic = "force-dynamic";

/**
 * Endpoint de diagnóstico seguro para testar a comunicação entre o Next.js e o Supabase.
 * Retorna apenas o estado de conectividade, sem expor chaves ou dados sensíveis.
 */
export async function GET() {
  const result = await testSupabaseConnection();
  const statusCode = result.success ? 200 : 503;

  return NextResponse.json(result, {
    status: statusCode,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
