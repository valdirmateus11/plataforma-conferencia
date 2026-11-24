const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Carrega .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const m = line.trim().match(/^([^#=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
});

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

const anonClient = createClient(url, anonKey);
const adminClient = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function runCapacityConcurrencyTest() {
  console.log('================================================================');
  console.log('🔒 TESTE DE CONCORRÊNCIA E LIMITE ATÓMICO DE CAPACIDADE');
  console.log('   Validação do Bloqueio FOR UPDATE e Prevenção de Overflow');
  console.log('================================================================\n');

  const testSlug = `test-capacity-conf-${Date.now()}`;
  const testCapacity = 2; // Teste rigoroso com limite de 2 vagas

  console.log(`[ETAPA 1] Criando conferência temporária com limite estrito de ${testCapacity} vagas...`);
  const { data: testConf, error: confErr } = await adminClient
    .from('conferences')
    .insert({
      name: 'Conferência Teste Concorrência',
      slug: testSlug,
      code_prefix: 'TC26',
      capacity: testCapacity,
      registration_open: true,
    })
    .select()
    .single();

  if (confErr || !testConf) {
    console.error('❌ Falha ao criar conferência de teste:', confErr?.message);
    process.exit(1);
  }
  console.log(`          ✅ Conferência criada (ID: ${testConf.id}, Vagas: ${testConf.capacity})`);

  try {
    // 2. Disparar 5 inscrições simultâneas em paralelo (concorrência total)
    console.log(`\n[ETAPA 2] Disparando 5 inscrições concorrentes simultâneas (Promise.all)...`);
    const concurrentAttempts = [1, 2, 3, 4, 5].map(idx => {
      return anonClient.rpc('submit_public_registration', {
        p_conference_id: testConf.id,
        p_idempotency_key: `idemp-conc-${Date.now()}-${idx}`,
        p_full_name: `Candidato Concorrente ${idx}`,
        p_sex: idx % 2 === 0 ? 'F' : 'M',
        p_phone: `+244923000${String(idx).padStart(3, '0')}`,
        p_local_church: 'Igreja Teste',
        p_ecclesiastical_district: 'Distrito Teste',
        p_municipality: 'Luanda',
        p_organizational_role: 'Líder',
        p_participant_category: 'Delegado Efetivo',
        p_delegation_responsible: null,
        p_organization_id: null,
      });
    });

    const results = await Promise.all(concurrentAttempts);

    let successCount = 0;
    let capacityBlockedCount = 0;
    let otherErrors = 0;

    results.forEach((res, i) => {
      if (res.data && res.data.registration_code) {
        successCount++;
        console.log(`          [Tentativa ${i + 1}] ✅ SUCESSO: Inscrito com código ${res.data.registration_code}`);
      } else if (res.error && (res.error.code === 'P0003' || res.error.message.includes('CAPACITY_REACHED') || res.error.message.includes('limite máximo'))) {
        capacityBlockedCount++;
        console.log(`          [Tentativa ${i + 1}] 🔒 BLOQUEIO ATÓMICO: Capacidade Esgotada (${res.error.message})`);
      } else {
        otherErrors++;
        console.log(`          [Tentativa ${i + 1}] ⚠️ Outro resultado:`, res.error || res.data);
      }
    });

    console.log(`\n[RESULTADO CONCORRÊNCIA]:`);
    console.log(`   - Sucessos esperados: ${testCapacity} | Obtidos: ${successCount}`);
    console.log(`   - Bloqueios esperados: ${5 - testCapacity} | Obtidos: ${capacityBlockedCount}`);

    if (successCount === testCapacity && capacityBlockedCount === (5 - testCapacity)) {
      console.log(`   🏆 PERFEITO! A transação PostgreSQL 'FOR UPDATE' garantiu a atomicidade exata!`);
    } else {
      console.error(`   ❌ FALHA: A concorrência não respeitou exatamente o limite.`);
      process.exit(1);
    }

    // 3. Verificar contagem real na tabela
    console.log(`\n[ETAPA 3] Verificando contagem persistida no banco de dados...`);
    const { count, error: countErr } = await adminClient
      .from('registrations')
      .select('*', { count: 'exact', head: true })
      .eq('conference_id', testConf.id);

    console.log(`          Total de registos persistidos na tabela: ${count}`);
    if (count !== testCapacity) {
      console.error(`❌ FALHA: Esperado ${testCapacity} registos, encontrados ${count}`);
      process.exit(1);
    }
    console.log(`          ✅ Integridade física confirmada: exatamente ${count} inscritos.`);

    // 4. Testar nova tentativa após saturação
    console.log(`\n[ETAPA 4] Tentativa avulsa de submissão 6 (com conferência já cheia)...`);
    const sixthAttempt = await anonClient.rpc('submit_public_registration', {
      p_conference_id: testConf.id,
      p_idempotency_key: `idemp-overflow-${Date.now()}`,
      p_full_name: 'Candidato Excedente 6',
      p_sex: 'M',
      p_phone: '+244923999999',
      p_local_church: 'Igreja Teste',
      p_ecclesiastical_district: 'Distrito Teste',
      p_municipality: 'Luanda',
      p_organizational_role: 'Líder',
      p_participant_category: 'Convidado',
      p_delegation_responsible: null,
      p_organization_id: null,
    });

    if (sixthAttempt.error && (sixthAttempt.error.code === 'P0003' || sixthAttempt.error.message.includes('CAPACITY_REACHED') || sixthAttempt.error.message.includes('limite máximo'))) {
      console.log(`          ✅ Rejeição imediata confirmada: ${sixthAttempt.error.message}`);
    } else {
      console.error(`❌ FALHA: Deveria ter sido rejeitado com limite de capacidade, obteve:`, sixthAttempt);
      process.exit(1);
    }

  } finally {
    // Limpeza dos dados de teste
    console.log(`\n[LIMPEZA] Higienizando conferência e dados de teste...`);
    await adminClient.from('registrations').delete().eq('conference_id', testConf.id);
    await adminClient.from('conferences').delete().eq('id', testConf.id);
    console.log(`          ✅ Base de dados de teste higienizada com sucesso.`);
  }

  console.log('\n================================================================');
  console.log('🎉 TESTE DE CONCORRÊNCIA E CAPACIDADE CONCLUÍDO COM SUCESSO 100%!');
  console.log('================================================================\n');
}

runCapacityConcurrencyTest().catch(err => {
  console.error('❌ Erro fatal:', err);
  process.exit(1);
});
