-- ==============================================================================
-- Migração 00007: Políticas Granulares de Row Level Security (RLS) e Privilégios
-- Plataforma da III Sessão Bienal da Conferência Distrital da Juventude de Luanda
-- ==============================================================================

-- 1. Concessão de uso do schema public e permissões base aos papéis do Supabase
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- 2. Ativação de RLS em todas as tabelas
ALTER TABLE public.conferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accreditations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 3. Forçar RLS em todas as tabelas (RLS avaliado para anon e authenticated)
ALTER TABLE public.conferences FORCE ROW LEVEL SECURITY;
ALTER TABLE public.organizations FORCE ROW LEVEL SECURITY;
ALTER TABLE public.event_settings FORCE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.admin_roles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.admin_user_roles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.registrations FORCE ROW LEVEL SECURITY;
ALTER TABLE public.accreditations FORCE ROW LEVEL SECURITY;
ALTER TABLE public.sessions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records FORCE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs FORCE ROW LEVEL SECURITY;

-- ==============================================================================
-- POLÍTICAS: conferences
-- ==============================================================================
DROP POLICY IF EXISTS "Public pode ler conferência aberta" ON public.conferences;
CREATE POLICY "Public pode ler conferência aberta"
ON public.conferences FOR SELECT
TO anon, authenticated
USING (registration_open = true OR public.is_active_admin());

DROP POLICY IF EXISTS "Superadmin pode gerir conferências" ON public.conferences;
CREATE POLICY "Superadmin pode gerir conferências"
ON public.conferences FOR ALL
TO authenticated
USING (public.current_user_has_role('super_admin'))
WITH CHECK (public.current_user_has_role('super_admin'));

-- ==============================================================================
-- POLÍTICAS: organizations
-- ==============================================================================
DROP POLICY IF EXISTS "Leitura de organizações ativas" ON public.organizations;
CREATE POLICY "Leitura de organizações ativas"
ON public.organizations FOR SELECT
TO anon, authenticated
USING (is_active = true OR public.is_active_admin());

DROP POLICY IF EXISTS "Admins podem gerir organizações" ON public.organizations;
CREATE POLICY "Admins podem gerir organizações"
ON public.organizations FOR ALL
TO authenticated
USING (public.current_user_has_role('super_admin') OR public.current_user_has_role('registration_admin'))
WITH CHECK (public.current_user_has_role('super_admin') OR public.current_user_has_role('registration_admin'));

-- ==============================================================================
-- POLÍTICAS: admin_profiles, admin_roles, admin_user_roles
-- ==============================================================================
DROP POLICY IF EXISTS "Admins ativos podem ler perfis" ON public.admin_profiles;
CREATE POLICY "Admins ativos podem ler perfis"
ON public.admin_profiles FOR SELECT
TO authenticated
USING (public.is_active_admin());

DROP POLICY IF EXISTS "Superadmin gere perfis administrativos" ON public.admin_profiles;
CREATE POLICY "Superadmin gere perfis administrativos"
ON public.admin_profiles FOR ALL
TO authenticated
USING (public.current_user_has_role('super_admin'))
WITH CHECK (public.current_user_has_role('super_admin'));

DROP POLICY IF EXISTS "Admins ativos podem ler funções" ON public.admin_roles;
CREATE POLICY "Admins ativos podem ler funções"
ON public.admin_roles FOR SELECT
TO authenticated
USING (public.is_active_admin());

DROP POLICY IF EXISTS "Admins ativos podem ler atribuições de papéis" ON public.admin_user_roles;
CREATE POLICY "Admins ativos podem ler atribuições de papéis"
ON public.admin_user_roles FOR SELECT
TO authenticated
USING (public.is_active_admin());

DROP POLICY IF EXISTS "Superadmin gere atribuição de papéis" ON public.admin_user_roles;
CREATE POLICY "Superadmin gere atribuição de papéis"
ON public.admin_user_roles FOR ALL
TO authenticated
USING (public.current_user_has_role('super_admin'))
WITH CHECK (public.current_user_has_role('super_admin'));

-- ==============================================================================
-- POLÍTICAS: registrations
-- ==============================================================================
-- Público (anon) NÃO tem permissão de SELECT direto em registrations
DROP POLICY IF EXISTS "Admins podem ler inscrições" ON public.registrations;
CREATE POLICY "Admins podem ler inscrições"
ON public.registrations FOR SELECT
TO authenticated
USING (public.is_active_admin());

-- Criação direta bloqueada por RLS: submissão é executada via RPC submit_public_registration (SECURITY DEFINER)
DROP POLICY IF EXISTS "Admins autorizados podem atualizar inscrições" ON public.registrations;
CREATE POLICY "Admins autorizados podem atualizar inscrições"
ON public.registrations FOR UPDATE
TO authenticated
USING (
  public.current_user_has_role('validator') OR 
  public.current_user_has_role('registration_admin') OR 
  public.current_user_has_role('super_admin')
)
WITH CHECK (
  public.current_user_has_role('validator') OR 
  public.current_user_has_role('registration_admin') OR 
  public.current_user_has_role('super_admin')
);

-- ==============================================================================
-- POLÍTICAS: accreditations
-- ==============================================================================
DROP POLICY IF EXISTS "Operadores e superadmin leem credenciamento" ON public.accreditations;
CREATE POLICY "Operadores e superadmin leem credenciamento"
ON public.accreditations FOR SELECT
TO authenticated
USING (
  public.current_user_has_role('accreditation_operator') OR 
  public.current_user_has_role('consultant') OR 
  public.current_user_has_role('super_admin')
);

DROP POLICY IF EXISTS "Superadmin pode revogar credenciamento com auditoria" ON public.accreditations;
CREATE POLICY "Superadmin pode revogar credenciamento com auditoria"
ON public.accreditations FOR UPDATE
TO authenticated
USING (public.current_user_has_role('super_admin'))
WITH CHECK (public.current_user_has_role('super_admin'));

-- ==============================================================================
-- POLÍTICAS: sessions
-- ==============================================================================
DROP POLICY IF EXISTS "Admins podem consultar sessões" ON public.sessions;
CREATE POLICY "Admins podem consultar sessões"
ON public.sessions FOR SELECT
TO authenticated
USING (public.is_active_admin());

DROP POLICY IF EXISTS "Superadmin gere sessões" ON public.sessions;
CREATE POLICY "Superadmin gere sessões"
ON public.sessions FOR ALL
TO authenticated
USING (public.current_user_has_role('super_admin'))
WITH CHECK (public.current_user_has_role('super_admin'));

-- ==============================================================================
-- POLÍTICAS: attendance_records
-- ==============================================================================
DROP POLICY IF EXISTS "Operadores e superadmin leem presenças" ON public.attendance_records;
CREATE POLICY "Operadores e superadmin leem presenças"
ON public.attendance_records FOR SELECT
TO authenticated
USING (
  public.current_user_has_role('attendance_operator') OR 
  public.current_user_has_role('consultant') OR 
  public.current_user_has_role('super_admin')
);

DROP POLICY IF EXISTS "Superadmin pode anular presenças com motivo" ON public.attendance_records;
CREATE POLICY "Superadmin pode anular presenças com motivo"
ON public.attendance_records FOR UPDATE
TO authenticated
USING (public.current_user_has_role('super_admin'))
WITH CHECK (public.current_user_has_role('super_admin'));

-- ==============================================================================
-- POLÍTICAS: audit_logs
-- ==============================================================================
DROP POLICY IF EXISTS "Apenas Superadmin lê trilha de auditoria" ON public.audit_logs;
CREATE POLICY "Apenas Superadmin lê trilha de auditoria"
ON public.audit_logs FOR SELECT
TO authenticated
USING (public.current_user_has_role('super_admin'));

DROP POLICY IF EXISTS "Inserção de auditoria permitida por administradores ativos" ON public.audit_logs;
CREATE POLICY "Inserção de auditoria permitida por administradores ativos"
ON public.audit_logs FOR INSERT
TO authenticated
WITH CHECK (public.is_active_admin());

-- ==============================================================================
-- POLÍTICAS: event_settings
-- ==============================================================================
DROP POLICY IF EXISTS "Admins podem ler configurações do evento" ON public.event_settings;
CREATE POLICY "Admins podem ler configurações do evento"
ON public.event_settings FOR SELECT
TO authenticated
USING (public.is_active_admin());

DROP POLICY IF EXISTS "Superadmin gere configurações do evento" ON public.event_settings;
CREATE POLICY "Superadmin gere configurações do evento"
ON public.event_settings FOR ALL
TO authenticated
USING (public.current_user_has_role('super_admin'))
WITH CHECK (public.current_user_has_role('super_admin'));
