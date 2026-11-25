/**
 * Constantes Centralizadas da Conferência Distrital de Jovens de Luanda
 *
 * Fonte única de verdade para todas as listas de opções utilizadas no formulário,
 * validações, componentes administrativos, relatórios e exportações.
 *
 * IMPORTANTE: Não dupliques estas listas noutros ficheiros.
 * Importa sempre a partir deste módulo.
 */

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

export const INTENDENCIAS = ["CRISH", "MVC", "BTS2M", "C3K"] as const;

export type Intendencia = (typeof INTENDENCIAS)[number];

// ===========================================================================
// CARGOS PASTORAIS POR INTENDÊNCIA
// ===========================================================================

export const CARGOS_PASTORAIS: Record<Intendencia, readonly string[]> = {
  CRISH: [
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
  ],
  MVC: [
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
  BTS2M: [
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
  ],
  C3K: [
    "António Rocha",
    "Arca de Noé",
    "Bispo Gaspar João Domingos",
    "Bispo Ralph Dodge",
    "Canaã",
    "Castro Catungo",
    "Emaús",
    "Josué Sapu",
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
  "Membro da Direção Local",
  "Membro de Base",
  "Membro da Direção Geral",
  "Membro da Direção Distrital",
  "Outro",
] as const;

export type OrganizationalRole = (typeof ORGANIZATIONAL_ROLES)[number];

// ===========================================================================
// HELPERS DE VALIDAÇÃO
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
