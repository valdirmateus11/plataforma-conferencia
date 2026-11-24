const fs = require('fs');

// Função de sanitização espelhada de src/lib/export/sanitize.ts
function sanitizeSpreadsheetCell(value) {
  if (value === null || value === undefined) {
    return "";
  }

  const str = String(value);
  const dangerousFormulaRegex = /^[\s\t\r\n\u00A0]*[=+\-@]/;

  if (dangerousFormulaRegex.test(str)) {
    return `'${str}`;
  }

  return str;
}

function formatCsvRow(fields, delimiter = ";") {
  return fields
    .map((field) => {
      const sanitized = sanitizeSpreadsheetCell(field);
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

function generateCsvContent(headers, rows, delimiter = ";") {
  const UTF8_BOM = "\uFEFF";
  const headerLine = formatCsvRow(headers, delimiter);
  const dataLines = rows.map((row) => formatCsvRow(row, delimiter));

  return UTF8_BOM + [headerLine, ...dataLines].join("\r\n");
}

async function runExportTests() {
  console.log("================================================================");
  console.log("🧪 TESTES DE SEGURANÇA CONTRA FORMULA INJECTION (Fase 7)");
  console.log("================================================================\n");

  const testCases = [
    // 1. Fórmulas clássicas com =
    { input: "=1+1", expected: "'=1+1", desc: "Fórmula aritmética com =" },
    { input: "=cmd|' /C calc'!A0", expected: "'=cmd|' /C calc'!A0", desc: "DDE Execution Payload com =" },

    // 2. Fórmulas com +
    { input: "+2+5", expected: "'+2+5", desc: "Expressão iniciada por +" },
    { input: "+cmd|'/C calc'!A0", expected: "'+cmd|'/C calc'!A0", desc: "Payload iniciado por +" },

    // 3. Fórmulas com -
    { input: "-2+3", expected: "'-2+3", desc: "Expressão iniciada por -" },
    { input: "-cmd|'/C notepad'!A0", expected: "'-cmd|'/C notepad'!A0", desc: "Payload iniciado por -" },

    // 4. Fórmulas com @
    { input: "@SUM(A1:B10)", expected: "'@SUM(A1:B10)", desc: "Função iniciada por @" },

    // 5. Tentativas de evasão com espaços, tabulações e quebras de linha
    { input: "   =cmd|'/C calc'!A0", expected: "'   =cmd|'/C calc'!A0", desc: "Evasão com espaços iniciais" },
    { input: "\t=1+1", expected: "'\t=1+1", desc: "Evasão com tabulação inicial" },
    { input: "\r\n-malicious", expected: "'\r\n-malicious", desc: "Evasão com CRLF inicial" },
    { input: "\u00A0@calc", expected: "'\u00A0@calc", desc: "Evasão com Non-Breaking Space" },

    // 6. Dados legítimos comuns
    { input: "António João Manuel", expected: "António João Manuel", desc: "Nome português legítimo com acento" },
    { input: "Congregação da Graça", expected: "Congregação da Graça", desc: "Igreja legítima com ç e ã" },
    { input: null, expected: "", desc: "Valor nulo" },
    { input: undefined, expected: "", desc: "Valor indefinido" },
  ];

  let passedCases = 0;

  testCases.forEach((tc, idx) => {
    const result = sanitizeSpreadsheetCell(tc.input);
    if (result === tc.expected) {
      console.log(`   ✅ Caso ${idx + 1}: ${tc.desc} -> Neutralizado com sucesso`);
      passedCases++;
    } else {
      console.error(`   ❌ Caso ${idx + 1} FALHOU: ${tc.desc}`);
      console.error(`      Esperado: "${tc.expected}"`);
      console.error(`      Obtido:   "${result}"`);
      process.exit(1);
    }
  });

  console.log(`\n✅ ${passedCases} de ${testCases.length} testes de sanitização aprovados!\n`);

  // 7. Teste de Geração de CSV Completo com UTF-8 BOM
  console.log("8. Testando estrutura de ficheiro CSV com UTF-8 BOM e acentuação...");
  const headers = ["Código", "Nome", "Distrito", "Função"];
  const rows = [
    ["CDJ26-10001", "João Baptista", "Distrito Eclesiástico de Belas", "Líder de Juventude"],
    ["CDJ26-10002", "=cmd|' /C calc'!A0", "Distrito Central", "Delegado"],
    ["CDJ26-10003", "Graça & Vitória", 'Igreja "Central"', "Coordenador"],
  ];

  const csvOutput = generateCsvContent(headers, rows);

  // Verificar BOM
  if (csvOutput.charCodeAt(0) !== 0xfeff) {
    console.error("❌ FALHA: Ficheiro CSV não contém UTF-8 BOM no primeiro caractere.");
    process.exit(1);
  }
  console.log("   ✅ UTF-8 BOM (\\uFEFF) detectado no cabeçalho do ficheiro.");

  // Verificar que a injeção foi neutralizada na linha 2
  if (csvOutput.includes('"\'=cmd|')) {
    console.log("   ✅ Payload de injeção na tabela devidamente neutralizado: \"'=cmd|...\"");
  } else {
    console.error("❌ FALHA: Payload não foi neutralizado no CSV final:", csvOutput);
    process.exit(1);
  }

  // Verificar escape de aspas
  if (csvOutput.includes('""Central""')) {
    console.log("   ✅ Aspas duplas internas devidamente escapadas: \"\"Central\"\"");
  } else {
    console.error("❌ FALHA: Escape de aspas duplas falhou.");
    process.exit(1);
  }

  console.log("\n================================================================");
  console.log("🎉 TODOS OS TESTES DE SEGURANÇA E EXPORTAÇÃO CSV APROVADOS A 100%!");
  console.log("================================================================\n");
}

runExportTests().catch((err) => {
  console.error("❌ Erro fatal:", err);
  process.exit(1);
});
