-- ==============================================================================
-- Migração 00002: Controlo de Acesso Baseado em Funções (RBAC) e Perfis
-- Plataforma da III Sessão Bienal da Conferência Distrital da Juventude de Luanda
-- ==============================================================================

-- 1. Tabela de Perfis de Utilizadores Administrativos
CREATE TABLE IF NOT EXISTS public.admin_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE RESTRICT,
  display_name TEXT NOT NULL,
  email TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Tabela de Funções / Papéis Administrativos
CREATE TABLE IF NOT EXISTS public.admin_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL CHECK (
    name IN (
      'super_admin',
      'registration_admin',
      'validator',
      'accreditation_operator',
      'attendance_operator',
      'consultant'
    )
  ),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Tabela de Associação Utilizador <-> Funções (Permite acumulação de funções)
CREATE TABLE IF NOT EXISTS public.admin_user_roles (
  user_id UUID NOT NULL REFERENCES public.admin_profiles(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.admin_roles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, role_id)
);

-- Índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_admin_profiles_active ON public.admin_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_user_roles_user ON public.admin_user_roles(user_id);

-- 4. Função Segura para verificar se o utilizador autenticado atual tem determinada role
-- Protegida com SECURITY DEFINER e search_path restrito
CREATE OR REPLACE FUNCTION public.current_user_has_role(required_role TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.admin_user_roles aur
    JOIN public.admin_roles ar ON ar.id = aur.role_id
    JOIN public.admin_profiles ap ON ap.id = aur.user_id
    WHERE ap.id = auth.uid()
      AND ap.is_active = true
      AND (ar.name = required_role OR ar.name = 'super_admin')
  );
END;
$$;

-- 5. Função Segura para verificar se o utilizador atual é um administrador ativo
CREATE OR REPLACE FUNCTION public.is_active_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.admin_profiles ap
    WHERE ap.id = auth.uid()
      AND ap.is_active = true
  );
END;
$$;

-- Restrição de execução das funções de autorização
REVOKE EXECUTE ON FUNCTION public.current_user_has_role FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_has_role TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_active_admin FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_active_admin TO authenticated;
