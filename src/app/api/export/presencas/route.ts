import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAdmin } from "@/features/administration/actions/auth-actions";
import { generateCsvContent } from "@/lib/export/sanitize";
import { formatGender, formatOrganizationalRole, formatBirthDate } from "@/lib/utils";
import { CONFERENCE_CONFIG } from "@/lib/config";
import { checkExportRateLimit } from "@/lib/security/rate-limit";
import type { Registration } from "@/types/database.types";

export const dynamic = "force-dynamic";

const ALLOWED_EXPORT_ROLES = new Set([
  "super_admin",
  "registration_admin",
  "consultant",
]);

export async function GET(request: NextRequest) {
  const currentAdmin = await getCurrentAdmin();
  if (!currentAdmin) {
    return new NextResponse("Não autorizado.", { status: 401 });
  }

  const hasPermission =
    currentAdmin.isSuperAdmin ||
    currentAdmin.roles.some((role) => ALLOWED_EXPORT_ROLES.has(role));

  if (!hasPermission) {
    return new NextResponse(
      "Acesso negado: apenas Coordenação, Consultores e Superadministrador podem exportar presenças.",
      { status: 403 }
    );
  }

  const adminClient = createAdminClient();

  // Rate limiting persistente por utilizador via audit_logs
  const rateLimit = await checkExportRateLimit(
    adminClient,
    currentAdmin.id,
    "EXPORT_ATTENDANCE_CSV"
  );
  if (!rateLimit.allowed) {
    return new NextResponse(rateLimit.error || "Muitas exportações em curto período.", {
      status: 429,
      headers: {
        "Retry-After": String(rateLimit.retryAfterSeconds),
        "Cache-Control": "no-store",
      },
    });
  }

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session");

  const supabase = await createClient();

  // 1. Obter conferência ativa
  const { data: conference } = await supabase
    .from("conferences")
    .select("id, name")
    .eq("slug", CONFERENCE_CONFIG.slug)
    .single();

  if (!conference) {
    return new NextResponse("Conferência não encontrada.", { status: 404 });
  }

  // 2. Query de presenças
  let query = adminClient
    .from("attendance_records")
    .select(`
      id,
      status,
      recorded_at,
      sessions (
        name,
        session_date
      ),
      registrations (
        *
      )
    `)
    .eq("conference_id", conference.id)
    .eq("status", "present");

  if (sessionId) {
    query = query.eq("session_id", sessionId);
  }

  query = query.order("recorded_at", { ascending: true });

  const { data: attendances, error } = await query;

  if (error || !attendances) {
    return new NextResponse(`Erro ao obter presenças: ${error?.message}`, { status: 500 });
  }

  // 3. Montar linhas CSV
  const headers = [
    "Sessão Plenária",
    "Data da Sessão",
    "Código do Participante",
    "Nome Completo",
    "Sexo",
    "Estado Civil",
    "Data de Nascimento",
    "Faixa-etária",
    "Grau de Escolaridade",
    "E-mail",
    "Intendência",
    "Cargo Pastoral",
    "Município de Residência",
    "Categoria de Membro",
    "Função Organizacional",
    "Categoria de Participação",
    "Estado de Presença",
    "Data/Hora de Registo",
  ];

  const rows = attendances.map((att) => {
    const session = att.sessions as unknown as { name: string; session_date: string } | null;
    const reg = att.registrations as unknown as Registration | null;

    return [
      session?.name || "Sessão",
      session?.session_date || "—",
      reg?.registration_code || "—",
      reg?.full_name || "—",
      formatGender(reg?.sex),
      reg?.marital_status || "—",
      formatBirthDate(reg?.birth_date),
      reg?.age_group || "—",
      reg?.education_level || "—",
      reg?.email || "—",
      reg?.ecclesiastical_district || "—",
      reg?.local_church || "—",
      reg?.municipality || "—",
      reg?.member_category || "—",
      formatOrganizationalRole(reg?.organizational_role, reg?.custom_role),
      reg?.participant_category || "—",
      "Presente",
      new Date(att.recorded_at).toLocaleString("pt-PT"),
    ];
  });

  const csvContent = generateCsvContent(headers, rows);

  // 4. Registar auditoria
  await adminClient.from("audit_logs").insert({
    actor_user_id: currentAdmin.id,
    conference_id: conference.id,
    action: "EXPORT_ATTENDANCE_CSV",
    entity_type: "attendance_records",
    entity_id: sessionId || conference.id,
    after_data: { totalExported: rows.length, sessionId },
    reason: `Exportação de folha de cálculo CSV de ${rows.length} presenças pelo utilizador ${currentAdmin.displayName}`,
  });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `presencas_cdj2027_${timestamp}.csv`;

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
