const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// 1. Carrega variáveis de ambiente do .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const m = line.trim().match(/^([^#=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
});

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

const adminClient = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function runAccreditationTests() {
  console.log('================================================================');
  console.log('🧪 TESTE DE INTEGRAÇÃO DO FLUXO DE CREDENCIAMENTO (Fase 5)');
  console.log('================================================================\n');

  // A. Autenticar como Superadmin
  console.log('1. Autenticando utilizador com permissão de credenciamento...');
  const userClient = createClient(url, anonKey);
  const { data: authData, error: authErr } = await userClient.auth.signInWithPassword({
    email: 'admin@cdjluanda.ao',
    password: 'CdjLuanda2026!',
  });

  if (authErr || !authData.user) {
    console.error('❌ Falha na autenticação do operador:', authErr?.message);
    process.exit(1);
  }
  console.log('   ✅ Operador autenticado:', authData.user.email);

  // B. Obter conferência ativa
  const { data: conf } = await userClient
    .from('conferences')
    .select('id, name')
    .eq('slug', 'iii-conferencia-distrital-luanda-2026')
    .single();

  if (!conf) {
    console.error('❌ Conferência ativa não encontrada.');
    process.exit(1);
  }
  console.log(`   ✅ Conferência ativa: ${conf.name} (${conf.id})`);

  // C. Criar inscrição de teste para o credenciamento
  const testIdempotency = 'test-acc-' + Date.now();
  const testCode = 'CDJ26-ACC' + Math.floor(1000 + Math.random() * 9000);

  console.log('\n2. Criando inscrição de teste (Estado inicial: pending)...');
  const { data: reg, error: regErr } = await adminClient
    .from('registrations')
    .insert({
      conference_id: conf.id,
      idempotency_key: testIdempotency,
      registration_code: testCode,
      full_name: 'Mateus Credenciamento Teste',
      sex: 'M',
      phone: '+244923000999',
      local_church: 'Congregação Teste Cred',
      ecclesiastical_district: 'Distrito Central',
      municipality: 'Luanda',
      organizational_role: 'Líder de Jovens',
      participant_category: 'Delegado Efetivo',
      status: 'pending',
    })
    .select()
    .single();

  if (regErr || !reg) {
    console.error('❌ Erro ao criar inscrição de teste:', regErr?.message);
    process.exit(1);
  }
  console.log(`   ✅ Inscrição criada: ${reg.full_name} (${reg.registration_code}) - Status: ${reg.status}`);

  // D. Teste 1: Tentar credenciar inscrição PENDENTE (DEVE FALHAR)
  console.log('\n3. Teste 1: Tentativa de credenciamento em inscrição NÃO aprovada...');
  const { error: pendErr } = await userClient.rpc('process_accreditation', {
    p_conference_id: conf.id,
    p_registration_id: reg.id,
    p_notes: 'Tentativa antes de aprovação',
  });

  if (pendErr && (pendErr.code === 'P0007' || pendErr.message.includes('REGISTRATION_NOT_APPROVED'))) {
    console.log('   ✅ SUCESSO: RPC rejeitou corretamente inscrição pendente (Código: P0007 / REGISTRATION_NOT_APPROVED)');
  } else {
    console.error('   ❌ FALHA: Deveria ter sido rejeitado com REGISTRATION_NOT_APPROVED, mas deu:', pendErr);
    process.exit(1);
  }

  // E. Aprovar a inscrição
  console.log('\n4. Aprovando a inscrição via change_registration_status...');
  const { error: appErr } = await userClient.rpc('change_registration_status', {
    p_registration_id: reg.id,
    p_new_status: 'approved',
    p_reason: 'Aprovação para teste de credenciamento',
  });

  if (appErr) {
    console.error('❌ Erro ao aprovar inscrição:', appErr.message);
    process.exit(1);
  }
  console.log('   ✅ Inscrição aprovada com sucesso no PostgreSQL.');

  // F. Teste 2: Credenciar a inscrição APROVADA (DEVE TER SUCESSO)
  console.log('\n5. Teste 2: Credenciamento presencial legítimo de participante aprovado...');
  const { data: accData, error: accErr } = await userClient.rpc('process_accreditation', {
    p_conference_id: conf.id,
    p_registration_id: reg.id,
    p_notes: 'Crachá e kit oficial entregues no secretariado',
  });

  if (accErr) {
    console.error('   ❌ FALHA: Erro ao credenciar participante aprovado:', accErr.message);
    process.exit(1);
  }
  console.log('   ✅ SUCESSO: Credenciamento processado atomicamente:', accData);

  // G. Teste 3: Tentar credenciar NOVAMENTE (DUPLO CREDENCIAMENTO DEVE FALHAR)
  console.log('\n6. Teste 3: Tentativa de DUPLO credenciamento do mesmo participante...');
  const { error: dupErr } = await userClient.rpc('process_accreditation', {
    p_conference_id: conf.id,
    p_registration_id: reg.id,
    p_notes: 'Segunda tentativa fraudulenta ou por engano',
  });

  if (dupErr && (dupErr.code === 'P0008' || dupErr.message.includes('ALREADY_CREDENTIALED'))) {
    console.log('   ✅ SUCESSO: RPC impediu duplo credenciamento (Código: P0008 / ALREADY_CREDENTIALED)');
  } else {
    console.error('   ❌ FALHA: Bloqueio de duplo credenciamento falhou:', dupErr);
    process.exit(1);
  }

  // H. Teste 4: Verificar registo na Trilha de Auditoria Imutável
  console.log('\n7. Teste 4: Verificando registo em audit_logs...');
  const { data: auditEntries, error: auditErr } = await adminClient
    .from('audit_logs')
    .select('id, action, entity_type, entity_id, reason, created_at')
    .eq('action', 'ACCREDITATION_CONFIRMED')
    .order('created_at', { ascending: false })
    .limit(1);

  if (auditErr || !auditEntries || auditEntries.length === 0) {
    console.error('   ❌ FALHA: Registo de auditoria não encontrado');
    process.exit(1);
  }
  console.log('   ✅ SUCESSO: Registo de auditoria encontrado:', auditEntries[0].action, '- ID:', auditEntries[0].id);

  console.log('\n================================================================');
  console.log('🎉 TODOS OS TESTES DO MÓDULO DE CREDENCIAMENTO APROVADOS A 100%!');
  console.log('================================================================\n');
}

runAccreditationTests().catch((err) => {
  console.error('❌ Erro fatal:', err);
  process.exit(1);
});
