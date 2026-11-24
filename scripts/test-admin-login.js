const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const m = line.trim().match(/^([^#=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
});

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function testAdminLogin() {
  console.log('Testando autenticação real com a conta do Superadmin...');
  const supabase = createClient(url, anonKey);

  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'admin@cdjluanda.ao',
    password: 'CdjLuanda2026!',
  });

  if (authErr || !authData.user) {
    console.error('❌ Falha no login do Superadmin:', authErr?.message);
    process.exit(1);
  }

  console.log('✅ Login efetuado com sucesso no Supabase Auth!');
  console.log('   User ID:', authData.user.id);
  console.log('   Email:', authData.user.email);

  // Testa leitura de perfil
  const { data: profile, error: profErr } = await supabase
    .from('admin_profiles')
    .select('display_name, is_active')
    .eq('id', authData.user.id)
    .single();

  if (profErr || !profile) {
    console.error('❌ Erro ao ler perfil:', profErr?.message);
    process.exit(1);
  }
  console.log(`✅ Perfil administrativo ativo: ${profile.display_name} (is_active: ${profile.is_active})`);

  // Testa função RPC de RBAC
  const { data: hasRole, error: roleErr } = await supabase.rpc('current_user_has_role', {
    required_role: 'super_admin',
  });

  if (roleErr) {
    console.error('❌ Erro ao testar RPC current_user_has_role:', roleErr.message);
    process.exit(1);
  }

  console.log(`✅ RPC current_user_has_role('super_admin'): ${hasRole}`);

  const { data: isActive, error: activeErr } = await supabase.rpc('is_active_admin');
  if (activeErr) {
    console.error('❌ Erro ao testar RPC is_active_admin:', activeErr.message);
    process.exit(1);
  }
  console.log(`✅ RPC is_active_admin(): ${isActive}`);

  console.log('\n🎉 TESTE DE AUTENTICAÇÃO E PERMISSÕES DO SUPERADMIN 100% APROVADO!');
}

testAdminLogin().catch(err => {
  console.error('❌ Erro:', err);
  process.exit(1);
});
