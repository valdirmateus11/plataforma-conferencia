-- ==============================================================================
-- Migração 00005: Auditoria Imutável de Operações Administrativas
-- Plataforma da III Sessão Bienal da Conferência Distrital da Juventude de Luanda
-- ==============================================================================

-- 1. Tabela de Registos de Auditoria
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES public.admin_profiles(id),
  conference_id UUID REFERENCES public.conferences(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  before_data JSONB,
  after_data JSONB,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices de consulta de auditoria
CREATE INDEX IF NOT EXISTS idx_audit_logs_conf ON public.audit_logs(conference_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);

-- 2. Função de Proteção Absoluta contra Modificação ou Exclusão de Logs
CREATE OR REPLACE FUNCTION public.protect_audit_logs()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are strictly immutable and cannot be updated or deleted.'
    USING ERRCODE = '55000';
END;
$$;

-- 3. Trigger que assegura a imutabilidade física no nível do PostgreSQL
DROP TRIGGER IF EXISTS trg_protect_audit_logs ON public.audit_logs;
CREATE TRIGGER trg_protect_audit_logs
BEFORE UPDATE OR DELETE ON public.audit_logs
FOR EACH ROW EXECUTE FUNCTION public.protect_audit_logs();

-- 4. Revogação explícita de permissões DML destrutivas
REVOKE UPDATE, DELETE, TRUNCATE ON TABLE public.audit_logs FROM PUBLIC, anon, authenticated;
