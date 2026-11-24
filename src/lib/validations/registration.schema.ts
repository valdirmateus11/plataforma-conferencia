import { z } from "zod";

export const publicRegistrationSchema = z
  .object({
    idempotencyKey: z.string().uuid({
      message: "Chave de submissão inválida.",
    }),
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
          // Remove prefixos para validação do núcleo do número angolano
          const clean = val.replace(/\D/g, "");
          return clean.length === 9 || (clean.length === 12 && clean.startsWith("2449"));
        },
        {
          message:
            "Introduza um número de telefone válido (ex.: 9XXXXXXXX ou +244 9XXXXXXXX).",
        }
      ),
    ecclesiasticalDistrict: z
      .string()
      .min(2, { message: "Selecione o distrito eclesiástico." })
      .max(100, { message: "Distrito inválido." })
      .transform((val) => val.trim()),
    municipality: z
      .string()
      .min(2, { message: "Selecione o município." })
      .max(100, { message: "Município inválido." })
      .transform((val) => val.trim()),
    localChurch: z
      .string()
      .min(2, { message: "Indique o nome da igreja local / congregação." })
      .max(120, { message: "Nome da igreja demasiado longo (máx. 120 caracteres)." })
      .transform((val) => val.trim()),
    organizationalRole: z
      .string()
      .min(2, { message: "Selecione ou indique a sua função na organização." })
      .max(80, { message: "Função demasiado longa." })
      .transform((val) => val.trim()),
    participantCategory: z
      .string()
      .min(2, { message: "Selecione a categoria de participação." })
      .max(60, { message: "Categoria inválida." })
      .transform((val) => val.trim()),
    delegationResponsible: z
      .string()
      .max(120, { message: "O nome do responsável não pode exceder 120 caracteres." })
      .optional()
      .nullable()
      .transform((val) => (val ? val.trim() : null)),
    // Campo Honeypot para neutralização de bots sem atrito
    website_url: z.string().max(0, { message: "Submissão rejeitada." }).optional(),
    // Timestamp para proteção contra preenchimento instantâneo por bots
    formLoadedAt: z.number().optional(),
  })
  .refine(
    (data) => {
      // Se for delegado, o responsável de delegação é obrigatório se definido pela organização
      if (data.participantCategory === "Delegado" && !data.delegationResponsible) {
        return false;
      }
      return true;
    },
    {
      message: "Para a categoria 'Delegado', é obrigatório indicar o Responsável da Delegação.",
      path: ["delegationResponsible"],
    }
  );

export type PublicRegistrationInput = z.infer<typeof publicRegistrationSchema>;

/**
 * Listas Provisórias Homologadas (Fase 0/3)
 * Até que a organização confirme a lista oficial do ANEXO B,
 * estas opções são utilizadas na interface identificadas como provisórias.
 */
export const PROVISIONAL_DISTRICTS = [
  "Distrito Central de Luanda [Provisório]",
  "Distrito Norte de Luanda [Provisório]",
  "Distrito Sul de Luanda [Provisório]",
  "Distrito Leste de Luanda [Provisório]",
  "Distrito Eclesiástico de Belas [Provisório]",
  "Distrito Eclesiástico de Viana [Provisório]",
  "Distrito Eclesiástico de Cacuaco [Provisório]",
  "Outro Distrito Eclesiástico [Provisório]",
];

export const LUANDA_MUNICIPALITIES = [
  "Luanda",
  "Cazenga",
  "Viana",
  "Cacuaco",
  "Kilamba Kiaxi",
  "Talatona",
  "Belas",
  "Icolo e Bengo",
  "Quiçama",
];

export const PARTICIPANT_CATEGORIES = [
  "Delegado",
  "Convidado",
  "Equipa de Apoio",
  "Participante Geral",
];

export const ORGANIZATIONAL_ROLES = [
  "Líder da Juventude",
  "Vice-Líder da Juventude",
  "Secretário(a) da Juventude",
  "Coordenador(a) de Departamento",
  "Membro da Direção",
  "Membro do Grupo de Jovens",
  "Outro",
];
