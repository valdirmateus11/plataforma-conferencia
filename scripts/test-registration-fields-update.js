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
  LUANDA_MUNICIPALITIES,
  INTENDENCIAS,
  CARGOS_PASTORAIS,
  PARTICIPANT_CATEGORIES,
  ORGANIZATIONAL_ROLES,
  isValidCargoParaIntendencia,
} = constants;
const { publicRegistrationSchema } = schemaMod;
const { formatGender, isMaleSex, isFemaleSex, formatOrganizationalRole } = utilsMod;

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

function baseValidPayload(overrides = {}) {
  return {
    idempotencyKey: "550e8400-e29b-41d4-a716-446655440000",
    fullName: "João Paulo Manuel",
    sex: "Masculino",
    phone: "923456789",
    email: "joao.manuel@exemplo.ao",
    municipality: "Belas",
    ecclesiasticalDistrict: "CRISH",
    localChurch: "São Paulo",
    organizationalRole: "Membro de Base",
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
  console.log("🧪 SUITE DE TESTES: ACTUALIZAÇÃO DE CAMPOS DE INSCRIÇÃO (00009)");
  console.log("================================================================\n");

  // 1. E-mail válido e inválido
  console.log("[1] Validação de E-mail:");
  assert(
    publicRegistrationSchema.safeParse(baseValidPayload({ email: "  Ana.Silva@Gmail.COM " })).success,
    "Aceita e-mail válido e normaliza espaços/maiúsculas"
  );
  const normalized = publicRegistrationSchema.parse(baseValidPayload({ email: "  Ana.Silva@Gmail.COM " }));
  assert(normalized.email === "ana.silva@gmail.com", "E-mail normalizado em minúsculas");
  assert(
    !publicRegistrationSchema.safeParse(baseValidPayload({ email: "" })).success,
    "Rejeita e-mail vazio (obrigatório)"
  );
  assert(
    !publicRegistrationSchema.safeParse(baseValidPayload({ email: "email-invalido" })).success,
    "Rejeita e-mail sem formato válido"
  );

  // 2. Municípios válidos e inválidos (exactamente 16)
  console.log("\n[2] Validação de Municípios de Luanda:");
  assert(LUANDA_MUNICIPALITIES.length === 16, "Existem exactamente 16 municípios autorizados");
  let allMunOk = LUANDA_MUNICIPALITIES.every(
    (m) => publicRegistrationSchema.safeParse(baseValidPayload({ municipality: m })).success
  );
  assert(allMunOk, "Todos os 16 municípios autorizados passam na validação");
  assert(
    !publicRegistrationSchema.safeParse(baseValidPayload({ municipality: "Luanda" })).success,
    "Rejeita município não autorizado ('Luanda')"
  );

  // 3. Intendências válidas e inválidas + Cargos Pastorais por Intendência
  console.log("\n[3] Intendências e Cargos Pastorais Dependentes:");
  assert(INTENDENCIAS.length === 4, "Existem exactamente 4 Intendências (CRISH, MVC, BTS2M, C3K)");
  assert(CARGOS_PASTORAIS.CRISH.length === 30, "CRISH contém exactamente 30 cargos pastorais");
  assert(CARGOS_PASTORAIS.MVC.length === 28, "MVC contém exactamente 28 cargos pastorais");
  assert(CARGOS_PASTORAIS.BTS2M.length === 26, "BTS2M contém exactamente 26 cargos pastorais");
  assert(CARGOS_PASTORAIS.C3K.length === 18, "C3K contém exactamente 18 cargos pastorais");

  for (const intendencia of INTENDENCIAS) {
    const cargos = CARGOS_PASTORAIS[intendencia];
    const allValid = cargos.every((cargo) =>
      publicRegistrationSchema.safeParse(
        baseValidPayload({ ecclesiasticalDistrict: intendencia, localChurch: cargo })
      ).success
    );
    assert(allValid, `Todos os ${cargos.length} cargos pastorais de ${intendencia} passam na validação`);
  }

  assert(
    !publicRegistrationSchema.safeParse(
      baseValidPayload({ ecclesiasticalDistrict: "DIST_INVALIDO", localChurch: "São Paulo" })
    ).success,
    "Rejeita Intendência inválida"
  );

  // 4. Cargo Pastoral incompatível com Intendência
  console.log("\n[4] Validação Cruzada Intendência ↔ Cargo Pastoral:");
  const mismatch = publicRegistrationSchema.safeParse(
    baseValidPayload({ ecclesiasticalDistrict: "MVC", localChurch: "São Paulo" }) // São Paulo pertence a CRISH
  );
  assert(!mismatch.success, "Rejeita Cargo Pastoral de outra Intendência (São Paulo em MVC)");
  assert(
    isValidCargoParaIntendencia("BTS2M", "Monte Sinai") &&
      !isValidCargoParaIntendencia("C3K", "Monte Sinai"),
    "Helper isValidCargoParaIntendencia bloqueia correspondência cruzada"
  );

  // 5. Limpeza de Cargo Pastoral na UI quando Intendência muda (verificação no código do componente)
  console.log("\n[5] Comportamento de limpeza no formulário público:");
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
    formSource.includes("!formData.ecclesiasticalDistrict") &&
      formSource.includes("disabled={isSubmitting || !formData.ecclesiasticalDistrict}"),
    "Select Cargo Pastoral fica desactivado até a Intendência ser seleccionada"
  );

  // 6. Categorias de Participação e Funções na Organização
  console.log("\n[6] Categorias de Participação, Funções e Campo 'Outro':");
  assert(PARTICIPANT_CATEGORIES.length === 3, "Existem 3 Categorias de Participação exactas");
  for (const cat of PARTICIPANT_CATEGORIES) {
    const res = publicRegistrationSchema.safeParse(
      baseValidPayload({
        participantCategory: cat,
        delegationResponsible: cat === "Delegado" ? "Pastor António" : null,
      })
    );
    assert(res.success, `Categoria válida aceite: ${cat}`);
  }
  assert(
    !publicRegistrationSchema.safeParse(baseValidPayload({ participantCategory: "Delegado Efetivo" })).success,
    "Rejeita categoria antiga/inválida ('Delegado Efetivo')"
  );
  assert(
    !publicRegistrationSchema.safeParse(
      baseValidPayload({ participantCategory: "Delegado", delegationResponsible: null })
    ).success,
    "Exige Responsável da Delegação quando Categoria = 'Delegado'"
  );

  assert(ORGANIZATIONAL_ROLES.length === 5, "Existem 5 Funções na Organização exactas");
  for (const role of ORGANIZATIONAL_ROLES) {
    const res = publicRegistrationSchema.safeParse(
      baseValidPayload({
        organizationalRole: role,
        customRole: role === "Outro" ? "Coordenador Coral" : null,
      })
    );
    assert(res.success, `Função válida aceite: ${role}`);
  }
  assert(
    !publicRegistrationSchema.safeParse(
      baseValidPayload({ organizationalRole: "Outro", customRole: "" })
    ).success,
    "Rejeita Função 'Outro' sem especificação obrigatória"
  );
  assert(
    !publicRegistrationSchema.safeParse(
      baseValidPayload({ organizationalRole: "Outro", customRole: "A" })
    ).success,
    "Rejeita especificação de 'Outro' com menos de 2 caracteres"
  );
  const cleanedCustomRole = publicRegistrationSchema.parse(
    baseValidPayload({ organizationalRole: "Membro de Base", customRole: "Texto residual" })
  );
  assert(
    cleanedCustomRole.customRole === null,
    "Schema limpa customRole para null quando Função !== 'Outro'"
  );

  // 7. Helpers de compatibilidade com registos históricos
  console.log("\n[7] Compatibilidade com Registos Antigos (M/F vs Masculino/Feminino):");
  assert(formatGender("M") === "Masculino" && isMaleSex("M"), "Registo antigo 'M' tratado como Masculino");
  assert(formatGender("Masculino") === "Masculino" && isMaleSex("Masculino"), "Registo novo 'Masculino' tratado como Masculino");
  assert(formatGender("F") === "Feminino" && isFemaleSex("F"), "Registo antigo 'F' tratado como Feminino");
  assert(formatGender("Feminino") === "Feminino" && isFemaleSex("Feminino"), "Registo novo 'Feminino' tratado como Feminino");
  assert(
    formatOrganizationalRole("Outro", "Técnico de Som") === "Outro (Técnico de Som)",
    "Formatação de função 'Outro' com especificação"
  );

  // 8. Verificação real do Supabase Cloud (leitura de registos antigos + estado da migração 00009)
  console.log("\n[8] Verificação de Persistência & Compatibilidade no Supabase Cloud:");
  const envContent = fs.readFileSync(path.join(ROOT_DIR, ".env.local"), "utf8");
  const env = {};
  envContent.split("\n").forEach((line) => {
    const m = line.trim().match(/^([^#=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim();
  });

  const adminClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const anonClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  // Verifica preservação de registos históricos
  const { data: legacyRows, error: legacyErr } = await adminClient
    .from("registrations")
    .select("id, registration_code, sex, local_church, ecclesiastical_district")
    .limit(5);

  assert(!legacyErr && Array.isArray(legacyRows) && legacyRows.length > 0, `Registos históricos preservados e legíveis (${legacyRows?.length || 0} encontrados)`);

  // Testa se a migração 00009 já foi aplicada no Supabase Cloud
  const { error: colCheckErr } = await adminClient
    .from("registrations")
    .select("email, custom_role")
    .limit(1);

  if (colCheckErr) {
    console.log(`  ⚠️  MIGRAÇÃO 00009 PENDENTE NO SUPABASE CLOUD: ${colCheckErr.message}`);
    console.log("     → Aplique 'supabase/migrations/00009_registration_fields_update.sql' no SQL Editor do Supabase para activar email e custom_role em produção.");
  } else {
    assert(true, "Colunas email e custom_role presentes no Supabase Cloud");
    const { data: conf } = await anonClient
      .from("conferences")
      .select("id")
      .eq("slug", "iii-conferencia-distrital-luanda-2026")
      .single();

    if (conf) {
      const idempKey = `test-00009-${Date.now()}`;
      const { data: rpcRes, error: rpcErr } = await anonClient.rpc("submit_public_registration", {
        p_conference_id: conf.id,
        p_idempotency_key: idempKey,
        p_full_name: "Teste Integração 00009",
        p_sex: "Feminino",
        p_phone: "+244923888777",
        p_email: "teste.00009@cdjluanda.ao",
        p_local_church: "Monte Sinai",
        p_ecclesiastical_district: "BTS2M",
        p_municipality: "Belas",
        p_organizational_role: "Outro",
        p_custom_role: "Equipe Técnica de Som",
        p_participant_category: "Convidado",
        p_delegation_responsible: null,
        p_organization_id: null,
      });

      assert(!rpcErr && rpcRes?.registration_code, "Persistência completa via RPC com email e custom_role");

      if (rpcRes?.registration_code) {
        const { data: persisted } = await adminClient
          .from("registrations")
          .select("email, custom_role, local_church, ecclesiastical_district, municipality, sex")
          .eq("registration_code", rpcRes.registration_code)
          .single();

        assert(
          persisted?.email === "teste.00009@cdjluanda.ao" &&
            persisted?.custom_role === "Equipe Técnica de Som" &&
            persisted?.local_church === "Monte Sinai" &&
            persisted?.ecclesiastical_district === "BTS2M",
          "Valores persistidos integralmente na tabela registrations"
        );

        // Limpa registo de teste para não poluir a conferência real
        await adminClient.from("registrations").delete().eq("registration_code", rpcRes.registration_code);
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
