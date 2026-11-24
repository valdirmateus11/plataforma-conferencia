const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 1. Carrega variáveis de ambiente do .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('❌ Ficheiro .env.local não encontrado.');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const m = line.trim().match(/^([^#=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
});

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('❌ Erro: NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios.');
  process.exit(1);
}

const adminClient = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL || process.argv[2] || 'admin@cdjluanda.ao';
  const password = process.env.ADMIN_PASSWORD || process.argv[3] || 'CdjLuanda2026!';
  const displayName = process.env.ADMIN_NAME || process.argv[4] || 'Superadministrador CDJ';

  console.log('================================================================');
  console.log('👑 CRIAÇÃO DO SUPERADMINISTRADOR INICIAL — PLATAFORMA CDJ 2026');
  console.log('================================================================\n');
  console.log(`Email:        ${email}`);
  console.log(`Nome:         ${displayName}`);
  console.log(`Função:       super_admin\n`);

  // 1. Procurar ou criar utilizador no Supabase Auth
  let userId;
  const { data: userList, error: listErr } = await adminClient.auth.admin.listUsers();
  if (listErr) {
    console.error('❌ Erro ao listar utilizadores Auth:', listErr.message);
    process.exit(1);
  }

  const existingUser = (userList.users || []).find(u => u.email?.toLowerCase() === email.toLowerCase());

  if (existingUser) {
    userId = existingUser.id;
    console.log(`ℹ️ Utilizador já existe no Supabase Auth (ID: ${userId}). Atualizando senha...`);
    const { error: updateErr } = await adminClient.auth.admin.updateUserById(userId, {
      password: password,
      email_confirm: true,
      user_metadata: { display_name: displayName },
    });
    if (updateErr) {
      console.error('❌ Erro ao atualizar senha:', updateErr.message);
      process.exit(1);
    }
    console.log('✅ Senha do utilizador atualizada com sucesso.');
  } else {
    console.log('Criando novo utilizador no Supabase Auth...');
    const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: displayName },
    });
    if (createErr || !newUser.user) {
      console.error('❌ Erro ao criar utilizador Auth:', createErr?.message);
      process.exit(1);
    }
    userId = newUser.user.id;
    console.log(`✅ Utilizador Auth criado com sucesso (ID: ${userId}).`);
  }

  // 2. Garantir perfil em admin_profiles
  console.log('Garantindo registo na tabela admin_profiles...');
  const { error: profileErr } = await adminClient
    .from('admin_profiles')
    .upsert({
      id: userId,
      display_name: displayName,
      email: email,
      is_active: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });

  if (profileErr) {
    console.error('❌ Erro ao criar/atualizar admin_profile:', profileErr.message);
    process.exit(1);
  }
  console.log('✅ Perfil admin_profiles atualizado.');

  // 3. Obter ID da role super_admin
  const { data: superAdminRole, error: roleErr } = await adminClient
    .from('admin_roles')
    .select('id, name')
    .eq('name', 'super_admin')
    .single();

  if (roleErr || !superAdminRole) {
    console.error('❌ Função "super_admin" não encontrada na tabela admin_roles.');
    process.exit(1);
  }

  // 4. Atribuir a role em admin_user_roles
  console.log(`Associando papel super_admin (ID: ${superAdminRole.id})...`);
  const { error: userRoleErr } = await adminClient
    .from('admin_user_roles')
    .upsert({
      user_id: userId,
      role_id: superAdminRole.id,
    }, { onConflict: 'user_id,role_id' });

  if (userRoleErr) {
    console.error('❌ Erro ao associar role:', userRoleErr.message);
    process.exit(1);
  }
  console.log('✅ Papel super_admin atribuído com sucesso.');

  // 5. Inserir registo na auditoria imutável
  await adminClient.from('audit_logs').insert({
    actor_user_id: userId,
    action: 'SEED_SUPER_ADMIN_INITIALIZED',
    entity_type: 'admin_profiles',
    entity_id: userId,
    after_data: { email, displayName, role: 'super_admin' },
    reason: 'Sementeira inicial de credenciais de Superadministrador para a plataforma',
  }).then(() => {
    console.log('✅ Registo de auditoria imutável gerado com sucesso.');
  }).catch(() => {
    // Audit log trigger might ignore or succeed
  });

  console.log('\n================================================================');
  console.log('🎉 SUPERADMINISTRADOR CONFIGURADO COM SUCESSO!');
  console.log('================================================================');
  console.log(`URL de Acesso:  http://localhost:3000/admin/login`);
  console.log(`Email:          ${email}`);
  console.log(`Senha:          ${password}`);
  console.log('================================================================\n');
}

seedAdmin().catch(err => {
  console.error('❌ Erro fatal:', err);
  process.exit(1);
});
