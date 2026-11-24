import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAdmin } from "@/features/administration/actions/auth-actions";
import { generateCsvContent } from "@/lib/export/sanitize";
import type { RegistrationStatus } from "@/types/database.types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const currentAdmin = await getCurrentAdmin();
  if (!currentAdmin) {
    return new NextResponse("Não autorizado.", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status") || "all";
  const districtFilter = searchParams.get("district") || "all";
  const municipalityFilter = searchParams.get("municipality") || "all";
  const categoryFilter = searchParams.get("category") || "all";

  const supabase = await createClient();
  const adminClient = createAdminClient();

  // 1. Obter conferência ativa
  const { data: conference } = await supabase
    .from("conferences")
    .select("id, name")
    .eq("slug", "iii-conferencia-distrital-luanda-2026")
    .single();

  if (!conference) {
    return new NextResponse("Conferência não encontrada.", { status: 404 });
  }

  // 2. Construir query de inscrições
  let query = adminClient
    .from("registrations")
    .select(`
      id,
      registration_code,
      full_name,
      sex,
      phone,
      local_church,
      ecclesiastical_district,
      municipality,
      organizational_role,
      participant_category,
      delegation_responsible,
      status,
      submitted_at,
      accreditations (
        status
      )
    `)
    .eq("conference_id", conference.id);

  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter as RegistrationStatus);
  }
  if (districtFilter !== "all") {
    query = query.eq("ecclesiastical_district", districtFilter);
  }
  if (municipalityFilter !== "all") {
    query = query.eq("municipality", municipalityFilter);
  }
  if (categoryFilter !== "all") {
    query = query.eq("participant_category", categoryFilter);
  }

  query = query.order("full_name", { ascending: true });

  const { data: registrations, error } = await query;

  if (error || !registrations) {
    return new NextResponse(`Erro ao obter inscrições: ${error?.message}`, { status: 500 });
  }

  // 3. Montar linhas com sanitização contra Formula Injection
  const headers = [
    "Código de Inscrição",
    "Nome Completo",
    "Sexo",
    "Telefone",
    "Igreja Local",
    "Distrito Eclesiástico",
    "Município",
    "Função Organizacional",
    "Categoria",
    "Responsável Delegação",
    "Estado da Inscrição",
    "Credenciamento Presencial",
    "Data de Submissão",
  ];

  const rows = registrations.map((r) => {
    const accList = (r.accreditations as unknown as Array<{ status: string }>) || [];
    const isCredentialed = accList.some((a) => a.status === "credentialed");

    const statusPt: Record<string, string> = {
      approved: "Aprovada",
      pending: "Pendente",
      rejected: "Rejeitada",
      cancelled: "Cancelada",
    };

    return [
      r.registration_code,
      r.full_name,
      r.sex === "M" ? "Masculino" : "Feminino",
      r.phone,
      r.local_church,
      r.ecclesiastical_district,
      r.municipality,
      r.organizational_role,
      r.participant_category,
      r.delegation_responsible || "—",
      statusPt[r.status] || r.status,
      isCredentialed ? "Credenciado" : "Não Credenciado",
      new Date(r.submitted_at).toLocaleString("pt-PT"),
    ];
  });

  const csvContent = generateCsvContent(headers, rows);

  // 4. Registar auditoria da exportação
  await adminClient.from("audit_logs").insert({
    actor_user_id: currentAdmin.id,
    conference_id: conference.id,
    action: "EXPORT_REGISTRATIONS_CSV",
    entity_type: "registrations",
    entity_id: conference.id,
    after_data: {
      totalExported: rows.length,
      filters: { statusFilter, districtFilter, municipalityFilter, categoryFilter },
    },
    reason: `Exportação de folha de cálculo CSV de ${rows.length} inscrições pelo utilizador ${currentAdmin.displayName}`,
  });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `inscricoes_cdj2026_${timestamp}.csv`;

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
