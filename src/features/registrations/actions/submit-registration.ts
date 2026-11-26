"use server";

import { createClient } from "@/lib/supabase/server";
import { CONFERENCE_CONFIG } from "@/lib/config";
import {
  publicRegistrationSchema,
  type PublicRegistrationInput,
} from "@/lib/validations/registration.schema";

export type SubmitRegistrationResult =
  | {
      success: true;
      registrationCode: string;
      fullName: string;
      submittedAt: string;
      message?: string;
    }
  | {
      success: false;
      error: string;
      fieldErrors?: Record<string, string[]>;
    };

export async function submitRegistration(
  rawInput: PublicRegistrationInput
): Promise<SubmitRegistrationResult> {
  // 1. Defesa Honeypot contra robôs de spam
  if (rawInput.website_url && rawInput.website_url.trim().length > 0) {
    return {
      success: true,
      registrationCode: `${CONFERENCE_CONFIG.codePrefix}-BOT-OK`,
      fullName: rawInput.fullName || "Participante",
      submittedAt: new Date().toISOString(),
    };
  }

  // 2. Defesa contra submissão instantânea por automação (< 1.8 segundos)
  if (rawInput.formLoadedAt && Date.now() - rawInput.formLoadedAt < 1800) {
    return {
      success: false,
      error:
        "O formulário foi submetido com demasiada rapidez. Por favor, reveja os dados e tente novamente.",
    };
  }

  // 3. Validação rigorosa no servidor com Zod
  //    (data de nascimento, idade 11-30, derivação de faixa-etária, estado civil,
  //     escolaridade, intendência ↔ cargo pastoral, categoria de membro e função)
  const validation = publicRegistrationSchema.safeParse(rawInput);
  if (!validation.success) {
    const flatErrors = validation.error.flatten().fieldErrors;
    return {
      success: false,
      error: "Existem campos obrigatórios em falta ou com valores inválidos.",
      fieldErrors: flatErrors as Record<string, string[]>,
    };
  }

  const data = validation.data;

  try {
    const supabase = await createClient();

    // 4. Obtenção da conferência ativa oficial
    const { data: conference, error: confError } = await supabase
      .from("conferences")
      .select("*")
      .eq("slug", CONFERENCE_CONFIG.slug)
      .maybeSingle();

    if (confError || !conference) {
      return {
        success: false,
        error:
          "A conferência selecionada não foi encontrada ou não está configurada.",
      };
    }

    if (!conference.registration_open) {
      return {
        success: false,
        error:
          "As inscrições para esta edição da Conferência encontram-se temporariamente encerradas.",
      };
    }

    // 5. Chamada à Stored Procedure atómica actualizada (migração 00010)
    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      "submit_public_registration",
      {
        p_conference_id: conference.id,
        p_idempotency_key: data.idempotencyKey,
        p_full_name: data.fullName,
        p_sex: data.sex,
        p_phone: data.phone,
        p_email: data.email,
        p_marital_status: data.maritalStatus,
        p_birth_date: data.birthDate,
        p_age_group: data.ageGroup,
        p_education_level: data.educationLevel,
        p_local_church: data.localChurch,
        p_ecclesiastical_district: data.ecclesiasticalDistrict,
        p_municipality: data.municipality,
        p_member_category: data.memberCategory,
        p_organizational_role: data.organizationalRole,
        p_custom_role: null,
        p_participant_category: data.participantCategory,
        p_delegation_responsible: data.delegationResponsible ?? null,
        p_organization_id: null,
      }
    );

    if (rpcError) {
      if (
        rpcError.message.includes("CAPACITY_REACHED") ||
        rpcError.code === "P0004"
      ) {
        return {
          success: false,
          error:
            `A capacidade limite de ${CONFERENCE_CONFIG.capacity} participantes para esta Conferência foi atingida. As novas inscrições estão bloqueadas.`,
        };
      }

      if (
        rpcError.message.includes("REGISTRATIONS_CLOSED") ||
        rpcError.code === "P0003"
      ) {
        return {
          success: false,
          error: "As inscrições para esta Conferência foram encerradas.",
        };
      }

      if (
        rpcError.message.includes("AGE_OUT_OF_RANGE") ||
        rpcError.message.includes("FUTURE_BIRTH_DATE") ||
        rpcError.message.includes("INVALID_BIRTH_DATE") ||
        rpcError.code === "P0013"
      ) {
        return {
          success: false,
          error:
            "A data de nascimento é inválida ou a idade calculada não se enquadra nas faixas etárias definidas (11 a 30 anos).",
          fieldErrors: {
            birthDate: [
              "Verifique a data de nascimento: a idade deve estar entre 11 e 30 anos.",
            ],
          },
        };
      }

      if (
        rpcError.message.includes("INVALID_PASTORAL_CHARGE") ||
        rpcError.message.includes("INVALID_INTENDENCIA") ||
        rpcError.code === "P0014"
      ) {
        return {
          success: false,
          error:
            "Os dados submetidos não passaram na validação de integridade do servidor.",
        };
      }

      return {
        success: false,
        error: `Erro ao processar a inscrição no servidor: ${rpcError.message}`,
      };
    }

    const typedResult = rpcResult as {
      status: string;
      registration_code: string;
      submitted_at: string;
      message?: string;
    };

    return {
      success: true,
      registrationCode: typedResult.registration_code,
      fullName: data.fullName,
      submittedAt: typedResult.submitted_at || new Date().toISOString(),
      message: typedResult.message,
    };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Ocorreu um erro inesperado de comunicação. Por favor, tente novamente.",
    };
  }
}
