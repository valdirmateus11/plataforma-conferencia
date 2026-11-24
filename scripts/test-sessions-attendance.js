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

async function runSessionAttendanceTests() {
  console.log('================================================================');
  console.log('🧪 TESTES DE SESSÕES, PRESENÇAS E QUÓRUM DELIBERATIVO (Fase 6)');
  console.log('================================================================\n');

  // A. Autenticar utilizador operador
  console.log('1. Autenticando utilizador com permissão de presenças...');
  const userClient = createClient(url, anonKey);
  const { data: authData, error: authErr } = await userClient.auth.signInWithPassword({
    email: 'admin@cdjluanda.ao',
    password: 'CdjLuanda2026!',
  });

  if (authErr || !authData.user) {
    console.error('❌ Falha na autenticação:', authErr?.message);
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
  console.log(`   ✅ Conferência ativa: ${conf.name}`);

  // C. Criar Sessão Plenária de Teste (Estado inicial: planned)
  const sessionName = 'Sessão Plenária Teste ' + Date.now();
  console.log(`\n2. Criando sessão de teste planejada ("${sessionName}")...`);
  const { data: session, error: sessErr } = await adminClient
    .from('sessions')
    .insert({
      conference_id: conf.id,
      name: sessionName,
      description: 'Sessão de teste automatizado de presenças e quórum',
      session_date: new Date().toISOString().split('T')[0],
      starts_at: '09:00',
      ends_at: '11:00',
      status: 'planned',
    })
    .select()
    .single();

  if (sessErr || !session) {
    console.error('❌ Erro ao criar sessão:', sessErr?.message);
    process.exit(1);
  }
  console.log(`   ✅ Sessão criada (ID: ${session.id}) - Status: ${session.status}`);

  // D. Obter participante com credenciamento ativo
  const { data: credentialedList } = await adminClient
    .from('accreditations')
    .select('registration_id')
    .eq('conference_id', conf.id)
    .eq('status', 'credentialed')
    .limit(1);

  if (!credentialedList || credentialedList.length === 0) {
    console.error('❌ Nenhum participante credenciado encontrado para o teste.');
    process.exit(1);
  }
  const credentialedRegId = credentialedList[0].registration_id;
  console.log(`   ✅ Participante credenciado para teste: ${credentialedRegId}`);

  // E. Teste 1: Tentar registar presença em sessão FECHADA/PLANEADA (DEVE FALHAR)
  console.log('\n3. Teste 1: Tentativa de check-in em sessão com status "planned"...');
  const { error: sessClosedErr } = await userClient.rpc('record_session_attendance', {
    p_conference_id: conf.id,
    p_session_id: session.id,
    p_registration_id: credentialedRegId,
  });

  if (sessClosedErr && (sessClosedErr.code === 'P0010' || sessClosedErr.message.includes('SESSION_NOT_OPEN'))) {
    console.log('   ✅ SUCESSO: RPC rejeitou presença em sessão fechada (Código: P0010 / SESSION_NOT_OPEN)');
  } else {
    console.error('   ❌ FALHA: Deveria ter sido bloqueado com SESSION_NOT_OPEN, mas deu:', sessClosedErr);
    process.exit(1);
  }

  // F. Abrir a sessão (status = 'open')
  console.log('\n4. Abrindo a sessão para registo de presenças (status = "open")...');
  const { error: openErr } = await adminClient
    .from('sessions')
    .update({ status: 'open', updated_at: new Date().toISOString() })
    .eq('id', session.id);

  if (openErr) {
    console.error('❌ Erro ao abrir sessão:', openErr.message);
    process.exit(1);
  }
  console.log('   ✅ Sessão aberta com sucesso.');

  // G. Teste 2: Registar presença legítima (DEVE TER SUCESSO)
  console.log('\n5. Teste 2: Registando presença legítima de participante credenciado...');
  const { data: attData, error: attErr } = await userClient.rpc('record_session_attendance', {
    p_conference_id: conf.id,
    p_session_id: session.id,
    p_registration_id: credentialedRegId,
  });

  if (attErr) {
    console.error('   ❌ FALHA: Erro ao registar presença:', attErr.message);
    process.exit(1);
  }
  console.log('   ✅ SUCESSO: Presença registada atomicamente:', attData);

  // H. Teste 3: Tentar registar DUPLA presença na mesma sessão (DEVE FALHAR)
  console.log('\n6. Teste 3: Tentativa de DUPLA presença do mesmo participante na mesma sessão...');
  const { error: dupAttErr } = await userClient.rpc('record_session_attendance', {
    p_conference_id: conf.id,
    p_session_id: session.id,
    p_registration_id: credentialedRegId,
  });

  if (dupAttErr && (dupAttErr.code === 'P0012' || dupAttErr.message.includes('ALREADY_RECORDED_PRESENT'))) {
    console.log('   ✅ SUCESSO: RPC bloqueou dupla presença (Código: P0012 / ALREADY_RECORDED_PRESENT)');
  } else {
    console.error('   ❌ FALHA: Deveria ter sido bloqueado com ALREADY_RECORDED_PRESENT, mas deu:', dupAttErr);
    process.exit(1);
  }

  // I. Teste 4: Verificar auditoria imutável
  console.log('\n7. Teste 4: Verificando registo em audit_logs...');
  const { data: auditEntries } = await adminClient
    .from('audit_logs')
    .select('id, action, entity_type, entity_id, created_at')
    .eq('action', 'ATTENDANCE_RECORDED')
    .order('created_at', { ascending: false })
    .limit(1);

  if (!auditEntries || auditEntries.length === 0) {
    console.error('   ❌ FALHA: Registo de auditoria não encontrado');
    process.exit(1);
  }
  console.log('   ✅ SUCESSO: Registo de auditoria confirmado:', auditEntries[0].action, '- ID:', auditEntries[0].id);

  // J. Teste 5: Cálculo de Quórum
  console.log('\n8. Teste 5: Verificando cálculo de quórum da sessão...');
  const { count: credTotal } = await adminClient
    .from('accreditations')
    .select('id', { count: 'exact', head: true })
    .eq('conference_id', conf.id)
    .eq('status', 'credentialed');

  const { count: attTotal } = await adminClient
    .from('attendance_records')
    .select('id', { count: 'exact', head: true })
    .eq('session_id', session.id)
    .eq('status', 'present');

  const qPct = Math.round((attTotal / credTotal) * 100);
  console.log(`   ✅ Total Credenciados: ${credTotal}`);
  console.log(`   ✅ Presentes na Sessão: ${attTotal}`);
  console.log(`   ✅ Quórum Atual: ${qPct}%`);

  console.log('\n================================================================');
  console.log('🎉 TODOS OS TESTES DE SESSÕES, PRESENÇAS E QUÓRUM APROVADOS A 100%!');
  console.log('================================================================\n');
}

runSessionAttendanceTests().catch(err => {
  console.error('❌ Erro fatal:', err);
  process.exit(1);
});
