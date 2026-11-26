const fs = require("fs");
const path = require("path");
const Module = require("module");
const ts = require("typescript");
const { createClient } = require("@supabase/supabase-js");

const ROOT_DIR = path.resolve(__dirname, "..");

// Loader leve para executar os módulos TypeScript reais de src/ com suporte ao alias @/
function loadTsModule(relPath) {
  const fullPath = path.join(ROOT_DIR, relPath);
  const source = fs.readFileSync(fullPath, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
    fileName: fullPath,
  });

  const mod = new Module(fullPath, module);
  mod.filename = fullPath;
  mod.paths = Module._nodeModulePaths(path.dirname(fullPath));

  const originalRequire = mod.require.bind(mod);
  mod.require = (id) => {
    if (id.startsWith("@/")) {
      const targetRel = path.join("src", id.slice(2));
      const candidateTs = targetRel + ".ts";
      const candidateIndexTs = path.join(targetRel, "index.ts");
      if (fs.existsSync(path.join(ROOT_DIR, candidateTs))) {
        return loadTsModule(candidateTs);
      }
      if (fs.existsSync(path.join(ROOT_DIR, candidateIndexTs))) {
        return loadTsModule(candidateIndexTs);
      }
    }
    return originalRequire(id);
  };

  mod._compile(transpiled.outputText, fullPath);
  return mod.exports;
}

const constants = loadTsModule("src/lib/constants/conference-data.ts");
const schemaMod = loadTsModule("src/lib/validations/registration.schema.ts");
const utilsMod = loadTsModule("src/lib/utils/index.ts");

const {
  MARITAL_STATUSES,
  AGE_GROUPS,
  EDUCATION_LEVELS,
  LUANDA_MUNICIPALITIES,
  INTENDENCIAS,
  CARGOS_PASTORAIS,
  MEMBER_CATEGORIES,
  PARTICIPANT_CATEGORIES,
  ORGANIZATIONAL_ROLES,
  isValidCargoParaIntendencia,
  evaluateBirthDateAndAgeGroup,
  getTodayInLuandaParts,
} = constants;
const { publicRegistrationSchema } = schemaMod;
const {
  formatGender,
  isMaleSex,
  isFemaleSex,
  formatOrganizationalRole,
  formatBirthDate,
} = utilsMod;

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    passed++;
    console.log(`  ✅ ${label}`);
  } else {
    failed++;
    console.error(`  ❌ FALHA: ${label}`);
  }
}

function formatISODate(year, month, day) {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function addDaysToParts(parts, deltaDays) {
  const dt = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + deltaDays));
  return {
    year: dt.getUTCFullYear(),
    month: dt.getUTCMonth() + 1,
    day: dt.getUTCDate(),
  };
}

function birthDateForExactAge(yearsAgo, dayOffsetFromToday = 0) {
  const today = getTodayInLuandaParts();
  const base = { year: today.year - yearsAgo, month: today.month, day: today.day };
  // Handle Feb 29 safely when shifting years
  const probe = new Date(Date.UTC(base.year, base.month - 1, base.day));
  const shifted = addDaysToParts(
    {
      year: probe.getUTCFullYear(),
      month: probe.getUTCMonth() + 1,
      day: probe.getUTCDate(),
    },
    dayOffsetFromToday
  );
  return formatISODate(shifted.year, shifted.month, shifted.day);
}

function baseValidPayload(overrides = {}) {
  return {
    idempotencyKey: "550e8400-e29b-41d4-a716-446655440000",
    fullName: "João Paulo Manuel",
    sex: "Masculino",
    maritalStatus: "Solteiro",
    birthDate: birthDateForExactAge(22),
    ageGroup: "Jovem Regular",
    educationLevel: "Licenciado",
    phone: "923456789",
    email: "joao.manuel@exemplo.ao",
    municipality: "Belas",
    ecclesiasticalDistrict: "LC",
    localChurch: "São Paulo",
    memberCategory: "Efectivo",
    organizationalRole: "Delegado(a)",
    customRole: null,
    participantCategory: "Convidado",
    delegationResponsible: null,
    website_url: "",
    formLoadedAt: Date.now() - 5000,
    ...overrides,
  };
}

async function runTests() {
  console.log("================================================================");
  console.log("🧪 SUITE DE TESTES: ACTUALIZAÇÃO DE CAMPOS DE INSCRIÇÃO (00010 v2)");
  console.log("================================================================\n");

  // 1. Estado Civil
  console.log("[1] Estado Civil:");
  assert(
    MARITAL_STATUSES.length === 2 &&
      MARITAL_STATUSES[0] === "Solteiro" &&
      MARITAL_STATUSES[1] === "Casado",
    "Estado Civil tem exactamente Solteiro e Casado"
  );
  for (const ms of MARITAL_STATUSES) {
    assert(
      publicRegistrationSchema.safeParse(baseValidPayload({ maritalStatus: ms })).success,
      `Aceita Estado Civil válido: ${ms}`
    );
  }
  assert(
    !publicRegistrationSchema.safeParse(baseValidPayload({ maritalStatus: "Divorciado" })).success,
    "Rejeita Estado Civil não autorizado ('Divorciado')"
  );

  // 2. Data de Nascimento e Faixa-etária automática (considerando dia e mês)
  console.log("\n[2] Data de Nascimento & Faixa-etária Automática:");
  assert(
    AGE_GROUPS.length === 2 &&
      AGE_GROUPS.includes("Adolescente") &&
      AGE_GROUPS.includes("Jovem Regular"),
    "Faixas-etárias exactas: Adolescente e Jovem Regular"
  );

  const dob11 = birthDateForExactAge(11, 0);
  const eval11 = evaluateBirthDateAndAgeGroup(dob11);
  assert(
    eval11.isWithinAllowedRange && eval11.age === 11 && eval11.ageGroup === "Adolescente",
    "Idade exacta 11 anos hoje -> Adolescente"
  );

  const dob10Almost11 = birthDateForExactAge(11, 1); // aniversário amanhã -> ainda 10 anos
  const eval10 = evaluateBirthDateAndAgeGroup(dob10Almost11);
  assert(
    !eval10.isWithinAllowedRange && eval10.age === 10 && eval10.ageGroup === null,
    "11 anos só amanhã (10 anos hoje) -> rejeitado por dia/mês"
  );
  assert(
    !publicRegistrationSchema.safeParse(baseValidPayload({ birthDate: dob10Almost11, ageGroup: "" })).success,
    "Schema rejeita menor de 11 anos (10 anos)"
  );

  const dob17 = birthDateForExactAge(17, 0);
  const eval17 = evaluateBirthDateAndAgeGroup(dob17);
  assert(
    eval17.isWithinAllowedRange && eval17.age === 17 && eval17.ageGroup === "Adolescente",
    "Idade exacta 17 anos -> Adolescente"
  );

  const dob18 = birthDateForExactAge(18, 0);
  const eval18 = evaluateBirthDateAndAgeGroup(dob18);
  assert(
    eval18.isWithinAllowedRange && eval18.age === 18 && eval18.ageGroup === "Jovem Regular",
    "Idade exacta 18 anos hoje -> Jovem Regular"
  );

  const dob17Almost18 = birthDateForExactAge(18, 1); // faz 18 amanhã -> ainda 17
  const eval17b = evaluateBirthDateAndAgeGroup(dob17Almost18);
  assert(
    eval17b.isWithinAllowedRange && eval17b.age === 17 && eval17b.ageGroup === "Adolescente",
    "Faz 18 amanhã -> ainda 17 anos (Adolescente)"
  );

  const dob30 = birthDateForExactAge(30, 0);
  const eval30 = evaluateBirthDateAndAgeGroup(dob30);
  assert(
    eval30.isWithinAllowedRange && eval30.age === 30 && eval30.ageGroup === "Jovem Regular",
    "Idade exacta 30 anos -> Jovem Regular"
  );

  const dob31 = birthDateForExactAge(31, 0);
  const eval31 = evaluateBirthDateAndAgeGroup(dob31);
  assert(
    !eval31.isWithinAllowedRange && eval31.age === 31 && eval31.ageGroup === null,
    "Idade 31 anos -> fora da faixa definida"
  );
  assert(
    !publicRegistrationSchema.safeParse(baseValidPayload({ birthDate: dob31, ageGroup: "" })).success,
    "Schema rejeita maior de 30 anos (31 anos)"
  );

  const tomorrowParts = addDaysToParts(getTodayInLuandaParts(), 1);
  const futureDob = formatISODate(tomorrowParts.year, tomorrowParts.month, tomorrowParts.day);
  const evalFuture = evaluateBirthDateAndAgeGroup(futureDob);
  assert(evalFuture.isFuture && !evalFuture.validDate, "Rejeita data de nascimento futura");
  assert(
    !publicRegistrationSchema.safeParse(baseValidPayload({ birthDate: futureDob })).success,
    "Schema rejeita data futura"
  );
  assert(
    !publicRegistrationSchema.safeParse(baseValidPayload({ birthDate: "2005-02-30" })).success,
    "Schema rejeita data de calendário inválida (2005-02-30)"
  );

  // Recálculo automático server-side no schema mesmo se ageGroup vier vazio/divergente
  const parsedAuto = publicRegistrationSchema.parse(
    baseValidPayload({ birthDate: dob17, ageGroup: "" })
  );
  assert(
    parsedAuto.ageGroup === "Adolescente",
    "Schema deriva automaticamente ageGroup = 'Adolescente' a partir de birthDate"
  );

  // 3. Grau de Escolaridade (23 opções exactas)
  console.log("\n[3] Grau de Escolaridade:");
  assert(EDUCATION_LEVELS.length === 23, "Existem exactamente 23 graus de escolaridade");
  assert(
    EDUCATION_LEVELS[0] === "1ª Classe" &&
      EDUCATION_LEVELS[12] === "13ª Classe" &&
      EDUCATION_LEVELS[13] === "1º Ano" &&
      EDUCATION_LEVELS[18] === "6º Ano" &&
      EDUCATION_LEVELS[19] === "Licenciado" &&
      EDUCATION_LEVELS[20] === "Pós-Graduando" &&
      EDUCATION_LEVELS[21] === "Mestrando" &&
      EDUCATION_LEVELS[22] === "Nenhum",
    "Ordem exacta das 23 opções de Grau de Escolaridade"
  );
  assert(
    EDUCATION_LEVELS.every(
      (edu) => publicRegistrationSchema.safeParse(baseValidPayload({ educationLevel: edu })).success
    ),
    "Todos os 23 graus de escolaridade passam na validação"
  );
  assert(
    !publicRegistrationSchema.safeParse(baseValidPayload({ educationLevel: "Doutoramento" })).success,
    "Rejeita grau de escolaridade fora da lista oficial"
  );

  // 4. E-mail e Municípios de Luanda
  console.log("\n[4] E-mail e Municípios de Luanda:");
  const normalized = publicRegistrationSchema.parse(
    baseValidPayload({ email: "  Ana.Silva@Gmail.COM " })
  );
  assert(normalized.email === "ana.silva@gmail.com", "E-mail normalizado em minúsculas");
  assert(
    !publicRegistrationSchema.safeParse(baseValidPayload({ email: "" })).success,
    "Rejeita e-mail vazio (obrigatório)"
  );
  assert(LUANDA_MUNICIPALITIES.length === 16, "Existem exactamente 16 municípios autorizados");
  assert(
    LUANDA_MUNICIPALITIES.every(
      (m) => publicRegistrationSchema.safeParse(baseValidPayload({ municipality: m })).success
    ),
    "Todos os 16 municípios autorizados passam na validação"
  );

  // 5. Intendências e Cargos Pastorais Dependentes (LC, VC, TBKK)
  console.log("\n[5] Intendências (LC, VC, TBKK) e Cargos Pastorais Dependentes:");
  assert(
    INTENDENCIAS.length === 3 &&
      INTENDENCIAS[0] === "LC" &&
      INTENDENCIAS[1] === "VC" &&
      INTENDENCIAS[2] === "TBKK",
    "Existem exactamente 3 Intendências (LC, VC, TBKK)"
  );
  assert(CARGOS_PASTORAIS.LC.length === 42, "LC contém exactamente 42 cargos pastorais");
  assert(CARGOS_PASTORAIS.VC.length === 28, "VC contém exactamente 28 cargos pastorais");
  assert(CARGOS_PASTORAIS.TBKK.length === 32, "TBKK contém exactamente 32 cargos pastorais");

  for (const intendencia of INTENDENCIAS) {
    const cargos = CARGOS_PASTORAIS[intendencia];
    const allValid = cargos.every((cargo) =>
      publicRegistrationSchema.safeParse(
        baseValidPayload({ ecclesiasticalDistrict: intendencia, localChurch: cargo })
      ).success
    );
    assert(
      allValid,
      `Todos os ${cargos.length} cargos pastorais de ${intendencia} passam na validação`
    );
  }

  assert(
    !publicRegistrationSchema.safeParse(
      baseValidPayload({ ecclesiasticalDistrict: "CRISH", localChurch: "São Paulo" })
    ).success,
    "Rejeita Intendência antiga ('CRISH') nas novas inscrições"
  );

  const mismatch = publicRegistrationSchema.safeParse(
    baseValidPayload({ ecclesiasticalDistrict: "VC", localChurch: "São Paulo" }) // São Paulo pertence a LC
  );
  assert(!mismatch.success, "Rejeita Cargo Pastoral de outra Intendência (São Paulo em VC)");
  assert(
    isValidCargoParaIntendencia("LC", "Monte Sinai") &&
      !isValidCargoParaIntendencia("TBKK", "Monte Sinai"),
    "Helper isValidCargoParaIntendencia valida LC vs TBKK correctamente"
  );

  // 6. Categoria de Membro, Categoria de Participação e Função na Organização
  console.log("\n[6] Categoria de Membro, Participação e Funções na Organização:");
  assert(
    MEMBER_CATEGORIES.length === 3 &&
      MEMBER_CATEGORIES[0] === "Catecúmeno" &&
      MEMBER_CATEGORIES[1] === "À Prova" &&
      MEMBER_CATEGORIES[2] === "Efectivo",
    "Categoria de Membro tem exactamente Catecúmeno, À Prova e Efectivo"
  );
  for (const mc of MEMBER_CATEGORIES) {
    assert(
      publicRegistrationSchema.safeParse(baseValidPayload({ memberCategory: mc })).success,
      `Categoria de Membro aceite: ${mc}`
    );
  }
  assert(
    !publicRegistrationSchema.safeParse(baseValidPayload({ memberCategory: "Visitante" })).success,
    "Rejeita Categoria de Membro inválida"
  );

  assert(PARTICIPANT_CATEGORIES.length === 3, "Existem 3 Categorias de Participação exactas");
  for (const cat of PARTICIPANT_CATEGORIES) {
    const res = publicRegistrationSchema.safeParse(
      baseValidPayload({
        participantCategory: cat,
        delegationResponsible: cat === "Delegado" ? "Pastor António" : null,
      })
    );
    assert(res.success, `Categoria de participação aceite: ${cat}`);
  }
  assert(
    !publicRegistrationSchema.safeParse(
      baseValidPayload({ participantCategory: "Delegado", delegationResponsible: null })
    ).success,
    "Exige Responsável da Delegação quando Categoria = 'Delegado'"
  );

  assert(
    ORGANIZATIONAL_ROLES.length === 3 &&
      ORGANIZATIONAL_ROLES[0] === "Diretor(a) Local" &&
      ORGANIZATIONAL_ROLES[1] === "Delegado(a)" &&
      ORGANIZATIONAL_ROLES[2] === "Membro da Direção Distrital",
    "Existem exactamente 3 Funções na Organização (sem 'Outro')"
  );
  for (const role of ORGANIZATIONAL_ROLES) {
    assert(
      publicRegistrationSchema.safeParse(baseValidPayload({ organizationalRole: role })).success,
      `Função na Organização aceite: ${role}`
    );
  }
  assert(
    !publicRegistrationSchema.safeParse(baseValidPayload({ organizationalRole: "Outro" })).success,
    "Rejeita opção antiga 'Outro' em Função na Organização"
  );
  const cleanedCustomRole = publicRegistrationSchema.parse(
    baseValidPayload({ organizationalRole: "Delegado(a)", customRole: "Texto residual" })
  );
  assert(cleanedCustomRole.customRole === null, "Schema força customRole = null");

  // 7. Verificações no componente de formulário UI
  console.log("\n[7] Comportamento de UI no formulário público:");
  const formSource = fs.readFileSync(
    path.join(ROOT_DIR, "src/components/forms/registration-form.tsx"),
    "utf8"
  );
  assert(
    formSource.includes('if (name === "ecclesiasticalDistrict")') &&
      formSource.includes('localChurch: ""'),
    "Alterar Intendência limpa automaticamente o Cargo Pastoral seleccionado"
  );
  assert(
    formSource.includes("disabled={isSubmitting || !formData.ecclesiasticalDistrict}"),
    "Select Cargo Pastoral fica desactivado até a Intendência ser seleccionada"
  );
  assert(
    formSource.includes('id="birthDate"') &&
      formSource.includes('id="ageGroup"') &&
      formSource.includes("readOnly"),
    "Campos birthDate e ageGroup (readOnly/automático) presentes no formulário"
  );

  // 8. Helpers de compatibilidade com registos históricos
  console.log("\n[8] Compatibilidade com Registos Históricos:");
  assert(formatGender("M") === "Masculino" && isMaleSex("M"), "Registo antigo 'M' tratado como Masculino");
  assert(formatGender("F") === "Feminino" && isFemaleSex("F"), "Registo antigo 'F' tratado como Feminino");
  assert(
    formatOrganizationalRole("Outro", "Técnico de Som") === "Outro (Técnico de Som)",
    "Formatação histórica de função 'Outro' preservada para registos antigos"
  );
  assert(formatBirthDate("2004-05-19") === "19/05/2004", "Formatação pt-PT de data de nascimento");

  // 9. Verificação real no Supabase Cloud (leitura de registos antigos + estado da migração 00010)
  console.log("\n[9] Verificação de Persistência & Compatibilidade no Supabase Cloud:");
  const envPath = path.join(ROOT_DIR, ".env.local");
  if (!fs.existsSync(envPath)) {
    console.log("  ⚠️  .env.local não encontrado — verificação cloud ignorada.");
  } else {
    const envContent = fs.readFileSync(envPath, "utf8");
    const env = {};
    envContent.split("\n").forEach((line) => {
      const m = line.trim().match(/^([^#=]+)=(.*)$/);
      if (m) env[m[1].trim()] = m[2].trim();
    });

    const adminClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const anonClient = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const { data: legacyRows, error: legacyErr } = await adminClient
      .from("registrations")
      .select("id, registration_code, sex, local_church, ecclesiastical_district")
      .limit(5);

    assert(
      !legacyErr && Array.isArray(legacyRows),
      `Registos históricos legíveis (${legacyRows?.length || 0} consultados)`
    );

    const { error: colCheckErr } = await adminClient
      .from("registrations")
      .select("marital_status, birth_date, age_group, education_level, member_category")
      .limit(1);

    if (colCheckErr) {
      console.log(`  ⚠️  MIGRAÇÃO 00010 PENDENTE NO SUPABASE CLOUD: ${colCheckErr.message}`);
      console.log(
        "     → Aplique 'supabase/migrations/00010_registration_fields_v2.sql' no SQL Editor do Supabase para activar os novos campos em produção."
      );
    } else {
      assert(true, "Colunas v2 presentes no Supabase Cloud");
      const { data: conf } = await anonClient
        .from("conferences")
        .select("id")
        .eq("slug", "iii-conferencia-distrital-luanda-2026")
        .single();

      if (conf) {
        const testBirthDate = birthDateForExactAge(16);
        const idempKey = `test-00010-${Date.now()}`;
        const { data: rpcRes, error: rpcErr } = await anonClient.rpc(
          "submit_public_registration",
          {
            p_conference_id: conf.id,
            p_idempotency_key: idempKey,
            p_full_name: "Teste Integração 00010",
            p_sex: "Feminino",
            p_phone: "+244923888777",
            p_email: "teste.00010@cdjluanda.ao",
            p_marital_status: "Solteiro",
            p_birth_date: testBirthDate,
            p_age_group: "Adolescente",
            p_education_level: "11ª Classe",
            p_local_church: "Monte Sinai",
            p_ecclesiastical_district: "LC",
            p_municipality: "Belas",
            p_member_category: "À Prova",
            p_organizational_role: "Delegado(a)",
            p_custom_role: null,
            p_participant_category: "Convidado",
            p_delegation_responsible: null,
            p_organization_id: null,
          }
        );

        assert(
          !rpcErr && rpcRes?.registration_code,
          "Persistência completa via RPC (19 parâmetros) com todos os novos campos"
        );

        if (rpcRes?.registration_code) {
          const { data: persisted } = await adminClient
            .from("registrations")
            .select(
              "marital_status, birth_date, age_group, education_level, member_category, local_church, ecclesiastical_district, organizational_role"
            )
            .eq("registration_code", rpcRes.registration_code)
            .single();

          assert(
            persisted?.marital_status === "Solteiro" &&
              persisted?.birth_date === testBirthDate &&
              persisted?.age_group === "Adolescente" &&
              persisted?.education_level === "11ª Classe" &&
              persisted?.member_category === "À Prova" &&
              persisted?.local_church === "Monte Sinai" &&
              persisted?.ecclesiastical_district === "LC" &&
              persisted?.organizational_role === "Delegado(a)",
            "Valores v2 persistidos integralmente na tabela registrations"
          );

          await adminClient
            .from("registrations")
            .delete()
            .eq("registration_code", rpcRes.registration_code);
        }
      }
    }
  }

  console.log("\n================================================================");
  console.log(`RESULTADO: ${passed} asserções aprovadas | ${failed} falhas`);
  console.log("================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("❌ Erro fatal na suíte de testes:", err);
  process.exit(1);
});
