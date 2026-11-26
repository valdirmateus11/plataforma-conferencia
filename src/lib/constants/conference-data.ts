/**
 * Constantes Centralizadas da Conferência Distrital da Juventude de Luanda
 *
 * Fonte única de verdade para todas as listas de opções utilizadas no formulário,
 * validações, componentes administrativos, relatórios e exportações.
 *
 * IMPORTANTE: Não dupliques estas listas noutros ficheiros.
 * Importa sempre a partir deste módulo.
 */

// ===========================================================================
// ESTADO CIVIL
// ===========================================================================

export const MARITAL_STATUSES = ["Solteiro", "Casado"] as const;

export type MaritalStatus = (typeof MARITAL_STATUSES)[number];

// ===========================================================================
// FAIXA-ETÁRIA (CALCULADA AUTOMATICAMENTE A PARTIR DA DATA DE NASCIMENTO)
// ===========================================================================

export const AGE_GROUPS = ["Adolescente", "Jovem Regular"] as const;

export type AgeGroup = (typeof AGE_GROUPS)[number];

export const MIN_REGISTRATION_AGE = 11;
export const MAX_REGISTRATION_AGE = 30;

// ===========================================================================
// GRAU DE ESCOLARIDADE
// ===========================================================================

export const EDUCATION_LEVELS = [
  "1ª Classe",
  "2ª Classe",
  "3ª Classe",
  "4ª Classe",
  "5ª Classe",
  "6ª Classe",
  "7ª Classe",
  "8ª Classe",
  "9ª Classe",
  "10ª Classe",
  "11ª Classe",
  "12ª Classe",
  "13ª Classe",
  "1º Ano",
  "2º Ano",
  "3º Ano",
  "4º Ano",
  "5º Ano",
  "6º Ano",
  "Licenciado",
  "Pós-Graduando",
  "Mestrando",
  "Nenhum",
] as const;

export type EducationLevel = (typeof EDUCATION_LEVELS)[number];

// ===========================================================================
// MUNICÍPIOS DE LUANDA
// ===========================================================================

export const LUANDA_MUNICIPALITIES = [
  "Belas",
  "Cacuaco",
  "Camama",
  "Cazenga",
  "Hoji Ya Henda",
  "Ingombota",
  "Kilamba",
  "Kilamba Kiaxi",
  "Maianga",
  "Mulenvos",
  "Mussulo",
  "Rangel",
  "Samba",
  "Sambizanga",
  "Talatona",
  "Viana",
] as const;

export type LuandaMunicipality = (typeof LUANDA_MUNICIPALITIES)[number];

// ===========================================================================
// INTENDÊNCIAS ECLESIÁSTICAS
// ===========================================================================

export const INTENDENCIAS = ["LC", "VC", "TBKK"] as const;

export type Intendencia = (typeof INTENDENCIAS)[number];

// ===========================================================================
// CARGOS PASTORAIS POR INTENDÊNCIA
// ===========================================================================

export const CARGOS_PASTORAIS: Record<Intendencia, readonly string[]> = {
  LC: [
    "São Paulo",
    "Ruth",
    "Rev. Sousa Lucas Virgílio",
    "Rev. Joaquim Bernardo",
    "Rev. Jacinto Manuel Culeca",
    "Rev. Eduardo Afonso",
    "Rev. Augusto Magalhães",
    "Nova Jerusalém",
    "Nova Estrela",
    "Magos do Oriente",
    "Moisés",
    "Maria Madalena",
    "Monte das Oliveiras",
    "Júlia Romano",
    "João Baptista",
    "Israel",
    "Galileia",
    "Ester",
    "Emanuel",
    "Central",
    "Catumbela Lima",
    "Catarina Assís",
    "Boa Esperança",
    "Betânia",
    "Sião",
    "Samuel",
    "Bethel",
    "Bernardo Panzo",
    "Belém",
    "Amós",
    "São Tiago",
    "Bispo Emílio de Carvalho",
    "Calemba",
    "Fonte de Água Viva",
    "Icolo e Bengo",
    "João Mateus",
    "Noé",
    "Redentor",
    "Rev. Adão Mateus Miguel",
    "Monte Sinai",
    "Luz",
    "Rev.ª Rita Webba",
  ],
  VC: [
    "Bispo Escrivão Zunguze",
    "Bispo Moisés D. Fernandes",
    "Rev. Gaspar de Almeida",
    "Jerusalém Viana",
    "Rev. Timóteo Baia",
    "Adelino Cosme",
    "Hosana",
    "Rev Alfredo Ganga",
    "Ezequiel",
    "Rev. Francisco Mateus",
    "Filadélfia",
    "Rev. Paulo Ferreira Nicolau",
    "Sofonias",
    "Rev. Jerónimo Domingos",
    "Isaac",
    "Belo Monte",
    "Esperança José",
    "Rev. Ferreira da Silva",
    "Rev. António Jorge",
    "Isaías",
    "Rev. Benjamim Manuel",
    "Santo Estevão",
    "Rev. Luís Correia Kizembe",
    "Job",
    "São Pedro",
    "Nova Jerusalém (Paraíso)",
    "Deus é Amor",
    "Domingos João António",
  ],
  TBKK: [
    "Abel da Silva",
    "Adriano Sebastião",
    "Carlos Kitongo",
    "Conceição Dembo",
    "Ebenezer",
    "Fernando Kibuba",
    "John Wesley",
    "Rev. Paiva João Damião",
    "Rev. Panzo Malundo",
    "Rev. João Luís",
    "Manuel Mendonça",
    "Suzana Wesley",
    "Bispo Moisés D. Fernandes",
    "Deus de Abraão",
    "António Rocha",
    "Arca de Noé",
    "Bispo Gaspar João Domingos",
    "Bispo Ralph Dodge",
    "Canaã",
    "Castro Catungo",
    "Emaús",
    "Josué Sapú",
    "Professora Juliana de Almeida",
    "Rev. Adriano dos Santos",
    "Rev. Bartolomeu Diogo Pascoal",
    "Rev. Frederico Ngongolo",
    "Rev. Jacinto Mutela",
    "Rev. João de Carvalho",
    "Rev. Joaquim Cristiano",
    "Rev. Marcos de Almeida",
    "Josué Capolo 1 e 2",
    "Rev. Ribeiro Calenji",
  ],
};

/** Conjunto plano de todos os cargos pastorais válidos (usado em validação server-side) */
export const ALL_CARGOS_PASTORAIS: string[] = Object.values(CARGOS_PASTORAIS).flat();

// ===========================================================================
// CATEGORIA DE MEMBRO
// ===========================================================================

export const MEMBER_CATEGORIES = ["Catecúmeno", "À Prova", "Efectivo"] as const;

export type MemberCategory = (typeof MEMBER_CATEGORIES)[number];

// ===========================================================================
// CATEGORIAS DE PARTICIPAÇÃO
// ===========================================================================

export const PARTICIPANT_CATEGORIES = [
  "Delegado",
  "Comissão Organizadora",
  "Convidado",
] as const;

export type ParticipantCategory = (typeof PARTICIPANT_CATEGORIES)[number];

// ===========================================================================
// FUNÇÕES NA ORGANIZAÇÃO
// ===========================================================================

export const ORGANIZATIONAL_ROLES = [
  "Diretor(a) Local",
  "Delegado(a)",
  "Membro da Direção Distrital",
] as const;

export type OrganizationalRole = (typeof ORGANIZATIONAL_ROLES)[number];

// ===========================================================================
// HELPERS DE VALIDAÇÃO E CÁLCULO DE IDADE / FAIXA-ETÁRIA
// ===========================================================================

/**
 * Verifica se um cargo pastoral pertence à intendência indicada.
 * Usado na validação server-side para impedir manipulação de selects.
 */
export function isValidCargoParaIntendencia(
  intendencia: string,
  cargo: string
): boolean {
  if (!INTENDENCIAS.includes(intendencia as Intendencia)) return false;
  const cargos = CARGOS_PASTORAIS[intendencia as Intendencia];
  return cargos.includes(cargo);
}

/**
 * Obtém ano, mês (1-12) e dia (1-31) actuais no fuso horário Africa/Luanda.
 */
export function getTodayInLuandaParts(referenceDate: Date = new Date()): {
  year: number;
  month: number;
  day: number;
} {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Luanda",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const iso = formatter.format(referenceDate); // YYYY-MM-DD
  const [y, m, d] = iso.split("-").map(Number);
  return { year: y, month: m, day: d };
}

/**
 * Retorna a data de hoje em formato YYYY-MM-DD no fuso Africa/Luanda.
 */
export function getTodayInLuandaISO(referenceDate: Date = new Date()): string {
  const { year, month, day } = getTodayInLuandaParts(referenceDate);
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * Faz o parse estrito de uma data ISO (YYYY-MM-DD), garantindo que existe no calendário
 * (evita rollover automático do JavaScript como 2025-02-30 -> 2025-03-02).
 */
export function parseISOCalendarDate(
  dateStr: string | null | undefined
): { year: number; month: number; day: number } | null {
  if (!dateStr || typeof dateStr !== "string") return null;
  const trimmed = dateStr.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (year < 1900 || month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  const probe = new Date(Date.UTC(year, month - 1, day));
  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() !== month - 1 ||
    probe.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
}

export interface AgeGroupEvaluation {
  validDate: boolean;
  isFuture: boolean;
  age: number | null;
  ageGroup: AgeGroup | null;
  isWithinAllowedRange: boolean;
  message: string | null;
}

/**
 * Calcula a idade exacta considerando dia e mês de nascimento no fuso Africa/Luanda
 * e determina a Faixa-etária oficial (Adolescente: 11-17 | Jovem Regular: 18-30).
 */
export function evaluateBirthDateAndAgeGroup(
  birthDateStr: string | null | undefined,
  referenceDate: Date = new Date()
): AgeGroupEvaluation {
  if (!birthDateStr || !birthDateStr.trim()) {
    return {
      validDate: false,
      isFuture: false,
      age: null,
      ageGroup: null,
      isWithinAllowedRange: false,
      message: null,
    };
  }

  const birth = parseISOCalendarDate(birthDateStr);
  if (!birth) {
    return {
      validDate: false,
      isFuture: false,
      age: null,
      ageGroup: null,
      isWithinAllowedRange: false,
      message: "A data de nascimento introduzida é inválida.",
    };
  }

  const today = getTodayInLuandaParts(referenceDate);

  // Verificar se a data é futura em relação a hoje (Africa/Luanda)
  if (
    birth.year > today.year ||
    (birth.year === today.year && birth.month > today.month) ||
    (birth.year === today.year && birth.month === today.month && birth.day > today.day)
  ) {
    return {
      validDate: false,
      isFuture: true,
      age: null,
      ageGroup: null,
      isWithinAllowedRange: false,
      message: "A data de nascimento não pode ser uma data futura.",
    };
  }

  let age = today.year - birth.year;
  if (
    today.month < birth.month ||
    (today.month === birth.month && today.day < birth.day)
  ) {
    age -= 1;
  }

  if (age >= 11 && age <= 17) {
    return {
      validDate: true,
      isFuture: false,
      age,
      ageGroup: "Adolescente",
      isWithinAllowedRange: true,
      message: null,
    };
  }

  if (age >= 18 && age <= 30) {
    return {
      validDate: true,
      isFuture: false,
      age,
      ageGroup: "Jovem Regular",
      isWithinAllowedRange: true,
      message: null,
    };
  }

  return {
    validDate: true,
    isFuture: false,
    age,
    ageGroup: null,
    isWithinAllowedRange: false,
    message: `A idade calculada (${age} ${age === 1 ? "ano" : "anos"}) não se enquadra nas faixas etárias definidas para a conferência (11 a 17 anos: Adolescente; 18 a 30 anos: Jovem Regular).`,
  };
}
