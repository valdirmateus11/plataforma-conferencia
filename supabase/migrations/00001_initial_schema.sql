-- ==============================================================================
-- Migração 00001: Esquema Inicial e Extensões
-- Plataforma da III Sessão Bienal da Conferência Distrital da Juventude de Luanda
-- ==============================================================================

-- 1. Ativação de extensões essenciais
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- 2. Função wrapper IMMUTABLE para o unaccent (necessária para índices em PostgreSQL)
CREATE OR REPLACE FUNCTION public.immutable_unaccent(text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
STRICT
SET search_path = public, extensions, pg_temp
AS $$
  SELECT unaccent($1);
$$;

-- 3. Tabela de Conferências
CREATE TABLE IF NOT EXISTS public.conferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  capacity INT NOT NULL DEFAULT 500 CHECK (capacity > 0),
  registration_open BOOLEAN NOT NULL DEFAULT true,
  code_prefix TEXT NOT NULL DEFAULT 'CDJ26',
  timezone TEXT NOT NULL DEFAULT 'Africa/Luanda',
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Tabela de Organizações / Igrejas Locais
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  municipality TEXT NOT NULL,
  ecclesiastical_district TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_organization_identity UNIQUE (name, municipality, ecclesiastical_district)
);

-- 5. Tabela de Configurações do Evento
CREATE TABLE IF NOT EXISTS public.event_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conference_id UUID NOT NULL REFERENCES public.conferences(id) ON DELETE CASCADE,
  setting_key TEXT NOT NULL,
  setting_value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_event_settings_conf_key UNIQUE (conference_id, setting_key)
);

-- Índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_conferences_slug ON public.conferences(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_active ON public.organizations(is_active);
CREATE INDEX IF NOT EXISTS idx_organizations_district ON public.organizations(ecclesiastical_district);
