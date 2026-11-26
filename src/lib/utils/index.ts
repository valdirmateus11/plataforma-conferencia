import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Verifica se o valor armazenado na coluna `sex` corresponde ao género masculino
 * (compatível com registos históricos 'M' e registos actuais 'Masculino').
 */
export function isMaleSex(sex: string | null | undefined): boolean {
  if (!sex) return false;
  const normalized = sex.trim().toLowerCase();
  return normalized === "m" || normalized === "masculino";
}

/**
 * Verifica se o valor armazenado na coluna `sex` corresponde ao género feminino
 * (compatível com registos históricos 'F' e registos actuais 'Feminino').
 */
export function isFemaleSex(sex: string | null | undefined): boolean {
  if (!sex) return false;
  const normalized = sex.trim().toLowerCase();
  return normalized === "f" || normalized === "feminino";
}

/**
 * Formata o valor de género para apresentação uniforme em português.
 */
export function formatGender(sex: string | null | undefined): string {
  if (isMaleSex(sex)) return "Masculino";
  if (isFemaleSex(sex)) return "Feminino";
  return sex?.trim() || "—";
}

/**
 * Formata a função organizacional incluindo a especificação quando `Outro` é seleccionado.
 */
export function formatOrganizationalRole(
  role: string | null | undefined,
  customRole?: string | null
): string {
  const base = role?.trim() || "—";
  const custom = customRole?.trim();
  if (base === "Outro" && custom) {
    return `${base} (${custom})`;
  }
  return base;
}

/**
 * Formata uma data ISO YYYY-MM-DD para DD/MM/YYYY sem deslocamento de fuso horário.
 */
export function formatBirthDate(birthDate: string | null | undefined): string {
  if (!birthDate) return "—";
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(birthDate.trim());
  if (!match) return birthDate;
  return `${match[3]}/${match[2]}/${match[1]}`;
}
