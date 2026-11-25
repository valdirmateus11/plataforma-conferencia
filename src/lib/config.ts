/**
 * Configuração Centralizada da Conferência
 *
 * Todas as constantes de negócio da conferência residem aqui.
 * Importa a partir deste ficheiro em vez de usar strings literais dispersas.
 */

export const CONFERENCE_CONFIG = {
  /** Nome oficial completo */
  name: "IIIª Sessão Bienal Ordinária da Conferência Distrital da Juventude de Luanda",
  /** Título curto para UI */
  shortName: "Conferência Distrital da Juventude de Luanda",
  /** Edição / Sessão */
  editionLabel: "IIIª Sessão Bienal Ordinária",
  /** Slug da conferência na base de dados (identificador histórico — não alterar) */
  slug: "iii-conferencia-distrital-luanda-2026",
  /** Prefixo dos códigos de inscrição */
  codePrefix: "CDJ26",
  /** Capacidade máxima de participantes */
  capacity: 500,
  /** Data legível para apresentação ao público */
  dateRange: "21 a 24 de Janeiro de 2027",
  /** Data curta para badges */
  shortDateBadge: "21-24 JAN 2027",
  /** Data de início (ISO 8601) */
  startDate: "2027-01-21",
  /** Data de fim (ISO 8601) */
  endDate: "2027-01-24",
  /** Local do evento */
  venue: "Cargo Pastoral Monte Sinai",
  /** Distrito Eclesiástico */
  district: "Distrito Eclesiástico de Luanda",
  /** Cidade */
  city: "Luanda, Angola",
  /** Fuso horário */
  timezone: "Africa/Luanda",
  /** Sigla da organização */
  orgAcronym: "DDJL",
  /** Nome completo da organização */
  orgName: "Direção Distrital da Juventude de Luanda",
  /** Igreja */
  churchName: "Igreja Metodista Unida",
  /** Conferência Anual */
  annualConference: "Conferência Anual do Oeste de Angola",
  /** Lema / tema central */
  theme:
    "Avivados e Santificados em Cristo, Sejamos a Carta para o Mundo",
  /** Referência bíblica do tema */
  themeRef: "Actos 2:42-47, I Coríntios 3:2-3",
  /** Chave do sessionStorage para confirmação de inscrição */
  successStorageKey: "cdj26_registration_success",
  /** Limite de exportações CSV por janela de tempo (por utilizador) */
  exportRateLimit: {
    maxRequests: 5,
    windowMinutes: 5,
  },
} as const;
