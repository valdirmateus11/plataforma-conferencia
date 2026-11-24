-- ==============================================================================
-- Migração 00003: Esquema de Inscrições e Integridade Multi-Conferência
-- Plataforma da III Sessão Bienal da Conferência Distrital da Juventude de Luanda
-- ==============================================================================

-- 1. Tabela de Inscrições
CREATE TABLE IF NOT EXISTS public.registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conference_id UUID NOT NULL REFERENCES public.conferences(id) ON DELETE RESTRICT,
  idempotency_key TEXT UNIQUE NOT NULL,
  registration_code TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  sex TEXT NOT NULL CHECK (sex IN ('M', 'F', 'Masculino', 'Feminino')),
  phone TEXT NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  local_church TEXT NOT NULL,
  ecclesiastical_district TEXT NOT NULL,
  municipality TEXT NOT NULL,
  organizational_role TEXT NOT NULL,
  participant_category TEXT NOT NULL,
  delegation_responsible TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  is_suspected_duplicate BOOLEAN NOT NULL DEFAULT false,
  duplicate_metadata JSONB,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.admin_profiles(id),
  review_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Restrição Composta para Garantia de Integridade Multi-Conferência
  CONSTRAINT uq_registrations_id_conference UNIQUE (id, conference_id)
);

-- 2. Índices de Alta Performance para Listagens, Pesquisas e Controlo de Vagas
CREATE INDEX IF NOT EXISTS idx_registrations_conf_status ON public.registrations(conference_id, status);
CREATE INDEX IF NOT EXISTS idx_registrations_code ON public.registrations(registration_code);
CREATE INDEX IF NOT EXISTS idx_registrations_phone ON public.registrations(conference_id, phone);
CREATE INDEX IF NOT EXISTS idx_registrations_submitted ON public.registrations(conference_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_registrations_duplicate ON public.registrations(conference_id, is_suspected_duplicate) WHERE is_suspected_duplicate = true;

-- Índice GIN para pesquisa eficiente e sem acentos por nome (utiliza wrapper IMMUTABLE)
CREATE INDEX IF NOT EXISTS idx_registrations_name_search 
ON public.registrations USING gin (to_tsvector('simple', public.immutable_unaccent(full_name)));
