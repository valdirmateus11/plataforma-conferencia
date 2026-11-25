import { z } from "zod";
import {
  LUANDA_MUNICIPALITIES,
  INTENDENCIAS,
  CARGOS_PASTORAIS,
  PARTICIPANT_CATEGORIES,
  ORGANIZATIONAL_ROLES,
  isValidCargoParaIntendencia,
  type Intendencia,
} from "@/lib/constants/conference-data";

// Re-exporta as constantes para retrocompatibilidade com componentes que importam daqui
export {
  LUANDA_MUNICIPALITIES,
  PARTICIPANT_CATEGORIES,
  ORGANIZATIONAL_ROLES,
} from "@/lib/constants/conference-data";

// Exporta INTENDENCIAS como PROVISIONAL_DISTRICTS para retrocompatibilidade
export { INTENDENCIAS as PROVISIONAL_DISTRICTS } from "@/lib/constants/conference-data";

export { CARGOS_PASTORAIS } from "@/lib/constants/conference-data";

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
      .min(1, { message: "O endereço de e-mail é obrigatório." })
      .email({ message: "Introduza um endereço de e-mail válido (ex.: nome@dominio.com)." })
      .max(254, { message: "O endereço de e-mail é demasiado longo." })
      .transform((val) => val.trim().toLowerCase()),

    // -----------------------------------------------------------------------
    // Dados Eclesiásticos
    // -----------------------------------------------------------------------
    municipality: z
      .string()
      .refine((val) => (LUANDA_MUNICIPALITIES as readonly string[]).includes(val), {
        message: "Selecione um município válido da lista.",
      }),

    ecclesiasticalDistrict: z
      .string()
      .refine((val) => (INTENDENCIAS as readonly string[]).includes(val), {
        message: "Selecione uma Intendência válida da lista.",
      }),

    localChurch: z
      .string()
      .min(1, { message: "Selecione o Cargo Pastoral." }),

    // -----------------------------------------------------------------------
    // Função e Participação
    // -----------------------------------------------------------------------
    organizationalRole: z
      .string()
      .refine(
        (val) => (ORGANIZATIONAL_ROLES as readonly string[]).includes(val),
        { message: "Selecione uma função válida da lista." }
      ),

    customRole: z
      .string()
      .max(80, { message: "A especificação da função não pode exceder 80 caracteres." })
      .optional()
      .nullable()
      .transform((val) => (val ? val.trim() : null)),

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
  // Validação cruzada: customRole obrigatório quando função = "Outro"
  .superRefine((data, ctx) => {
    if (
      data.organizationalRole === "Outro" &&
      (!data.customRole || data.customRole.trim().length < 2)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Por favor, especifique a sua função (mínimo 2 caracteres).",
        path: ["customRole"],
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
  );

export type PublicRegistrationInput = z.infer<typeof publicRegistrationSchema>;
