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

if (!url || !anonKey) {
  console.error('❌ Erro: Variáveis do Supabase não configuradas em .env.local');
  process.exit(1);
}

const admin = createClient(url, serviceKey || anonKey);
const anon = createClient(url, anonKey);

async function runVerification() {
  console.log('================================================================');
  console.log('🔍 VERIFICAÇÃO DE ESQUEMA E SEGURANÇA (Fase 2) — SUPABASE');
  console.log('================================================================\n');

  const tables = [
    'conferences',
    'organizations',
    'event_settings',
    'admin_profiles',
    'admin_roles',
    'admin_user_roles',
    'registrations',
    'accreditations',
    'sessions',
    'attendance_records',
    'audit_logs'
  ];

  let allTablesOk = true;

  console.log('1. Verificação de Tabelas (PostgREST API):');
  for (const t of tables) {
    const { error } = await admin.from(t).select('count', { count: 'exact', head: true });
    if (!error) {
      console.log(`   ✅ Tabela public.${t} detectada e ativa`);
    } else {
      allTablesOk = false;
      console.log(`   ⏳ Tabela public.${t} pendente (${error.code})`);
    }
  }

  if (!allTablesOk) {
    console.log('\n⚠️ Algumas tabelas ainda não foram criadas.');
    console.log('👉 Execute o ficheiro "supabase/migrations/full_schema_and_security.sql" no SQL Editor do Supabase.');
    return;
  }

  console.log('\n2. Verificação de Dados Iniciais da Conferência:');
  const { data: conf, error: confError } = await admin
    .from('conferences')
    .select('id, name, slug, capacity, code_prefix, registration_open, timezone')
    .eq('slug', 'iii-conferencia-distrital-luanda-2026')
    .single();

  if (conf && !confError) {
    console.log(`   ✅ Conferência base criada: "${conf.name}"`);
    console.log(`      - Capacidade: ${conf.capacity} participantes`);
    console.log(`      - Prefixo de Código: ${conf.code_prefix}`);
    console.log(`      - Fuso Horário: ${conf.timezone}`);
    console.log(`      - Inscrições Abertas: ${conf.registration_open}`);
  } else {
    console.log(`   ⏳ Conferência base ainda não encontrada`);
  }

  console.log('\n3. Verificação de Funções RBAC Iniciais:');
  const { data: roles } = await admin.from('admin_roles').select('name');
  if (roles && roles.length >= 6) {
    console.log(`   ✅ ${roles.length} perfis RBAC criados (${roles.map(r => r.name).join(', ')})`);
  } else {
    console.log(`   ⏳ Perfis RBAC: ${roles ? roles.length : 0} encontrados`);
  }

  console.log('\n4. Verificação de Segurança RLS (Tentativa de leitura pública):');
  const { data: anonRegs, error: anonError } = await anon.from('registrations').select('*').limit(1);
  if (anonError || (anonRegs && anonRegs.length === 0)) {
    console.log('   🛡️ RLS Ativo: Acesso público não autenticado a "registrations" bloqueado com sucesso.');
  } else {
    console.log('   ⚠️ Alerta: RLS não bloqueou a leitura anónima da tabela de inscrições!');
  }

  console.log('\n================================================================');
  console.log('🎉 Verificação concluída!');
  console.log('================================================================');
}

runVerification().catch(err => {
  console.error('Erro na execução da verificação:', err);
  process.exit(1);
});
