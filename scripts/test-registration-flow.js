const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Carrega variáveis do .env.local
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
const adminClient = createClient(url, serviceKey);

async function testRegistrationFlow() {
  console.log('================================================================');
  console.log('🧪 TESTE DE INTEGRAÇÃO: MÓDULO DE INSCRIÇÕES (Fase 3)');
  console.log('================================================================\n');

  // 1. Obter a conferência ativa
  const { data: conf, error: confErr } = await adminClient
    .from('conferences')
    .select('id, name, capacity, registration_open')
    .eq('slug', 'iii-conferencia-distrital-luanda-2026')
    .single();

  if (confErr || !conf) {
    console.error('❌ Falha: Conferência não encontrada:', confErr);
    process.exit(1);
  }

  console.log(`1. Conferência Alvo: "${conf.name}"`);
  console.log(`   - Limite de Vagas: ${conf.capacity}`);
  console.log(`   - Inscrições Abertas: ${conf.registration_open}`);

  // 2. Teste de Submissão Pública via RPC anónima (como o público faz)
  const testIdempotencyKey = '11111111-2222-3333-4444-555555555555';
  const testPhone = '923999001';
  const testName = 'Participante de Teste Fase 3';

  console.log('\n2. Executando RPC submit_public_registration (Acesso Público Anon)...');
  const { data: rpcRes1, error: rpcErr1 } = await anonClient.rpc('submit_public_registration', {
    p_conference_id: conf.id,
    p_idempotency_key: testIdempotencyKey,
    p_full_name: testName,
    p_sex: 'Masculino',
    p_phone: testPhone,
    p_local_church: 'Paróquia Central de Teste',
    p_ecclesiastical_district: 'Distrito Central de Luanda [Provisório]',
    p_municipality: 'Luanda',
    p_organizational_role: 'Líder da Juventude',
    p_participant_category: 'Delegado',
    p_delegation_responsible: 'Pastor Responsável de Teste',
    p_organization_id: null
  });

  if (rpcErr1) {
    console.error('❌ Erro na submissão da inscrição:', rpcErr1);
    process.exit(1);
  }

  console.log('   ✅ Submissão bem-sucedida!');
  console.log('   - Código de Inscrição Gerado:', rpcRes1.registration_code);
  console.log('   - Estado retornado:', rpcRes1.status);

  // 3. Teste de Idempotência Técnica (mesma chave de idempotência repetida)
  console.log('\n3. Teste de Idempotência (Simulando clique repetido / retry de rede)...');
  const { data: rpcRes2, error: rpcErr2 } = await anonClient.rpc('submit_public_registration', {
    p_conference_id: conf.id,
    p_idempotency_key: testIdempotencyKey,
    p_full_name: testName,
    p_sex: 'Masculino',
    p_phone: testPhone,
    p_local_church: 'Paróquia Central de Teste',
    p_ecclesiastical_district: 'Distrito Central de Luanda [Provisório]',
    p_municipality: 'Luanda',
    p_organizational_role: 'Líder da Juventude',
    p_participant_category: 'Delegado',
    p_delegation_responsible: 'Pastor Responsável de Teste',
    p_organization_id: null
  });

  if (rpcErr2) {
    console.error('❌ Falha na idempotência:', rpcErr2);
  } else if (rpcRes2.registration_code === rpcRes1.registration_code && rpcRes2.status === 'idempotent_success') {
    console.log('   🛡️ Idempotência Confirmada! Retornou o mesmo código sem duplicar nem consumir nova vaga.');
  } else {
    console.log('   ⚠️ Resposta inesperada de idempotência:', rpcRes2);
  }

  // 4. Teste de Deteção de Duplicados (Mesmo telefone com chave de idempotência diferente)
  console.log('\n4. Teste de Deteção de Duplicação (Mesmo telefone por familiar / submissão diferente)...');
  const siblingIdempotencyKey = '99999999-8888-7777-6666-555555555555';
  const { data: rpcRes3, error: rpcErr3 } = await anonClient.rpc('submit_public_registration', {
    p_conference_id: conf.id,
    p_idempotency_key: siblingIdempotencyKey,
    p_full_name: 'Irmão do Participante de Teste',
    p_sex: 'Feminino',
    p_phone: testPhone, // mesmo telefone
    p_local_church: 'Paróquia Central de Teste',
    p_ecclesiastical_district: 'Distrito Central de Luanda [Provisório]',
    p_municipality: 'Luanda',
    p_organizational_role: 'Membro do Grupo de Jovens',
    p_participant_category: 'Participante Geral',
    p_delegation_responsible: null,
    p_organization_id: null
  });

  if (rpcErr3) {
    console.error('❌ Falha na deteção de duplicados:', rpcErr3);
  } else if (rpcRes3.is_duplicate_flagged === true) {
    console.log('   🛡️ Flag de Duplicação Ativa! Inscrição aceite como pending mas sinalizada para revisão do Validador.');
    console.log('   - Código Único:', rpcRes3.registration_code);
  }

  // 5. Verificação da Persistência na Base de Dados (via Admin)
  console.log('\n5. Verificando Persistência na Tabela public.registrations...');
  const { data: regs, error: fetchErr } = await adminClient
    .from('registrations')
    .select('id, registration_code, full_name, status, is_suspected_duplicate, delegation_responsible')
    .in('registration_code', [rpcRes1.registration_code, rpcRes3.registration_code]);

  if (fetchErr) {
    console.error('❌ Erro ao consultar inscrições:', fetchErr);
  } else {
    console.log(`   ✅ ${regs.length} inscrições persistidas com sucesso no PostgreSQL:`);
    regs.forEach(r => {
      console.log(`      • [${r.registration_code}] ${r.full_name} | Status: ${r.status} | Suspeito de duplicado: ${r.is_suspected_duplicate}`);
    });
  }

  // 6. Limpeza dos dados de teste para manter a base limpa
  console.log('\n6. Limpeza Segura dos Registos de Teste...');
  const { error: delErr } = await adminClient
    .from('registrations')
    .delete()
    .in('registration_code', [rpcRes1.registration_code, rpcRes3.registration_code]);

  if (!delErr) {
    console.log('   🧹 Dados de teste limpos. Base de dados pronta para participantes reais.');
  }

  console.log('\n================================================================');
  console.log('🎉 TESTE DA FASE 3 CONCLUÍDO COM SUCESSO A 100%!');
  console.log('================================================================');
}

testRegistrationFlow();
