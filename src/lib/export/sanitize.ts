/**
 * Módulo de Exportação e Proteção Rigorosa Contra CSV/Excel Formula Injection
 * Plataforma da III Sessão Bienal da Conferência Distrital da Juventude de Luanda
 */

/**
 * Sanitiza valores de texto para exportação em CSV ou folhas de cálculo (Excel, LibreOffice, Google Sheets).
 * Neutraliza qualquer fórmula maliciosa iniciada por '=', '+', '-', '@',
 * mesmo que precedida por espaços em branco, tabulações (\t), quebras de linha (\r, \n)
 * ou espaços sem quebra (\u00A0).
 */
export function sanitizeSpreadsheetCell(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  const str = String(value);

  // Regex cobrindo espaços iniciais, tabulações, quebras de linha e caracteres de controlo antes de =, +, -, @
  const dangerousFormulaRegex = /^[\s\t\r\n\u00A0]*[=+\-@]/;

  if (dangerousFormulaRegex.test(str)) {
    // Prefixar com apóstrofo (') força o software de folha de cálculo a tratar a célula estritamente como texto literal
    return `'${str}`;
  }

  return str;
}

/**
 * Formata uma linha individual de CSV respeitando RFC 4180:
 * - Aplica sanitizeSpreadsheetCell a cada campo
 * - Envolve os campos em aspas duplas se contiverem vírgulas, ponto-e-vírgula, quebras de linha ou aspas
 * - Escapa aspas duplas internas duplicando-as (" -> "")
 */
export function formatCsvRow(fields: unknown[], delimiter: string = ";"): string {
  return fields
    .map((field) => {
      const sanitized = sanitizeSpreadsheetCell(field);
      // Se contiver delimitador, quebras de linha ou aspas, colocar entre aspas
      if (
        sanitized.includes(delimiter) ||
        sanitized.includes('"') ||
        sanitized.includes("\n") ||
        sanitized.includes("\r")
      ) {
        return `"${sanitized.replace(/"/g, '""')}"`;
      }
      return `"${sanitized}"`;
    })
    .join(delimiter);
}

/**
 * Gera o documento CSV completo incluindo o caractere UTF-8 BOM (\uFEFF)
 * para garantir que o Microsoft Excel no Windows renderiza acentuação da língua portuguesa (ã, ç, é, í, ó)
 * corretamente sem falhas de codificação.
 */
export function generateCsvContent(
  headers: string[],
  rows: unknown[][],
  delimiter: string = ";"
): string {
  const UTF8_BOM = "\uFEFF";
  const headerLine = formatCsvRow(headers, delimiter);
  const dataLines = rows.map((row) => formatCsvRow(row, delimiter));

  return UTF8_BOM + [headerLine, ...dataLines].join("\r\n");
}
