import { z } from "zod";
import {
  MARITAL_STATUSES,
  EDUCATION_LEVELS,
  LUANDA_MUNICIPALITIES,
  INTENDENCIAS,
  MEMBER_CATEGORIES,
  PARTICIPANT_CATEGORIES,
  ORGANIZATIONAL_ROLES,
  isValidCargoParaIntendencia,
  evaluateBirthDateAndAgeGroup,
} from "@/lib/constants/conference-data";

// Re-exporta as constantes para retrocompatibilidade e conveniência dos componentes
export {
  MARITAL_STATUSES,
  AGE_GROUPS,
  EDUCATION_LEVELS,
  LUANDA_MUNICIPALITIES,
  MEMBER_CATEGORIES,
  PARTICIPANT_CATEGORIES,
  ORGANIZATIONAL_ROLES,
  CARGOS_PASTORAIS,
} from "@/lib/constants/conference-data";

// Exporta INTENDENCIAS como PROVISIONAL_DISTRICTS para retrocompatibilidade
export { INTENDENCIAS as PROVISIONAL_DISTRICTS } from "@/lib/constants/conference-data";

export const publicRegistrationSchema = z
  .object({
    idempotencyKey: z.string().uuid({
      message: "Chave de submissão inválida.",
    }),

    // -----------------------------------------------------------------------
    // Dados Pessoais
    // -----------------------------------------------------------------------
    fullName: z
      .string()
      .min(3, { message: "O nome completo deve ter pelo menos 3 caracteres." })
      .max(120, { message: "O nome completo não pode exceder 120 caracteres." })
      .transform((val) => val.trim()),

    sex: z.enum(["Masculino", "Feminino"], {
      errorMap: () => ({ message: "Selecione o sexo." }),
    }),

    maritalStatus: z
      .string()
      .refine((val) => (MARITAL_STATUSES as readonly string[]).includes(val), {
        message: "Seleccione o estado civil (Solteiro ou Casado).",
      }),

    birthDate: z
      .string()
      .trim()
      .min(1, { message: "A data de nascimento é obrigatória." }),

    ageGroup: z
      .string()
      .optional()
      .nullable()
      .transform((val) => (val ? val.trim() : null)),

    educationLevel: z
      .string()
      .refine((val) => (EDUCATION_LEVELS as readonly string[]).includes(val), {
        message: "Seleccione um grau de escolaridade válido da lista.",
      }),

    phone: z
      .string()
      .min(9, { message: "O telefone deve ter pelo menos 9 dígitos." })
      .max(20, { message: "O número de telefone é demasiado longo." })
      .transform((val) => val.trim().replace(/\s+/g, ""))
      .refine(
        (val) => {
          const clean = val.replace(/\D/g, "");
          return (
            clean.length === 9 ||
            (clean.length === 12 && clean.startsWith("2449"))
          );
        },
        {
          message:
            "Introduza um número de telefone válido (ex.: 9XXXXXXXX ou +244 9XXXXXXXX).",
        }
      ),

    email: z
      .string()
      .trim()
      .min(1, { message: "O endereço de e-mail é obrigatório." })
      .email({
        message: "Introduza um endereço de e-mail válido (ex.: nome@dominio.com).",
      })
      .max(254, { message: "O endereço de e-mail é demasiado longo." })
      .transform((val) => val.toLowerCase()),

    // -----------------------------------------------------------------------
    // Dados Eclesiásticos e Localização
    // -----------------------------------------------------------------------
    municipality: z
      .string()
      .refine((val) => (LUANDA_MUNICIPALITIES as readonly string[]).includes(val), {
        message: "Selecione um município válido da lista.",
      }),

    ecclesiasticalDistrict: z
      .string()
      .refine((val) => (INTENDENCIAS as readonly string[]).includes(val), {
        message: "Seleccione uma Intendência válida (LC, VC ou TBKK).",
      }),

    localChurch: z
      .string()
      .min(1, { message: "Seleccione o Cargo Pastoral." }),

    memberCategory: z
      .string()
      .refine((val) => (MEMBER_CATEGORIES as readonly string[]).includes(val), {
        message: "Seleccione uma categoria de membro válida.",
      }),

    // -----------------------------------------------------------------------
    // Função e Participação
    // -----------------------------------------------------------------------
    organizationalRole: z
      .string()
      .refine(
        (val) => (ORGANIZATIONAL_ROLES as readonly string[]).includes(val),
        { message: "Seleccione uma função válida da lista." }
      ),

    customRole: z
      .string()
      .max(80)
      .optional()
      .nullable()
      .transform(() => null),

    participantCategory: z
      .string()
      .refine(
        (val) => (PARTICIPANT_CATEGORIES as readonly string[]).includes(val),
        { message: "Selecione uma categoria de participação válida." }
      ),

    delegationResponsible: z
      .string()
      .max(120, {
        message: "O nome do responsável não pode exceder 120 caracteres.",
      })
      .optional()
      .nullable()
      .transform((val) => (val ? val.trim() : null)),

    // -----------------------------------------------------------------------
    // Campos de segurança (anti-bot)
    // -----------------------------------------------------------------------
    website_url: z
      .string()
      .max(0, { message: "Submissão rejeitada." })
      .optional(),

    formLoadedAt: z.number().optional(),
  })
  // Validação da Data de Nascimento, Cálculo Exacto da Idade e Faixa-etária
  .superRefine((data, ctx) => {
    const evalResult = evaluateBirthDateAndAgeGroup(data.birthDate);

    if (!evalResult.validDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          evalResult.message || "Introduza uma data de nascimento válida.",
        path: ["birthDate"],
      });
      return;
    }

    if (!evalResult.isWithinAllowedRange || !evalResult.ageGroup) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          evalResult.message ||
          "A idade não se enquadra nas faixas etárias definidas (11 a 30 anos).",
        path: ["birthDate"],
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Idade fora das faixas etárias definidas (11 a 17: Adolescente; 18 a 30: Jovem Regular).",
        path: ["ageGroup"],
      });
      return;
    }

    // Se ageGroup foi enviado manualmente e não corresponde ao calculado, rejeitar adulteração
    if (
      data.ageGroup &&
      data.ageGroup.trim().length > 0 &&
      data.ageGroup.trim() !== evalResult.ageGroup
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "A faixa-etária não corresponde à data de nascimento indicada.",
        path: ["ageGroup"],
      });
    }
  })
  // Validação cruzada: Cargo Pastoral deve pertencer à Intendência seleccionada
  .superRefine((data, ctx) => {
    if (
      data.ecclesiasticalDistrict &&
      data.localChurch &&
      !isValidCargoParaIntendencia(data.ecclesiasticalDistrict, data.localChurch)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "O Cargo Pastoral seleccionado não pertence à Intendência escolhida.",
        path: ["localChurch"],
      });
    }
  })
  // Validação cruzada: Responsável da Delegação obrigatório para Delegados
  .refine(
    (data) => {
      if (
        data.participantCategory === "Delegado" &&
        !data.delegationResponsible
      ) {
        return false;
      }
      return true;
    },
    {
      message:
        "Para a categoria 'Delegado', é obrigatório indicar o Responsável da Delegação.",
      path: ["delegationResponsible"],
    }
  )
  // Derivação final garantida no servidor: calcula ageGroup oficial a partir de birthDate
  .transform((data) => {
    const evalResult = evaluateBirthDateAndAgeGroup(data.birthDate);
    return {
      ...data,
      ageGroup: evalResult.ageGroup!,
      customRole: null,
    };
  });

export type PublicRegistrationInput = z.input<typeof publicRegistrationSchema>;
export type ParsedPublicRegistrationInput = z.output<
  typeof publicRegistrationSchema
>;
