-- ==============================================================================
-- Migração 00004: Credenciamento Presencial, Sessões e Controlo de Presenças
-- Plataforma da III Sessão Bienal da Conferência Distrital da Juventude de Luanda
-- ==============================================================================

-- 1. Tabela de Credenciamento Presencial (Manual, sem QR Code)
CREATE TABLE IF NOT EXISTS public.accreditations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conference_id UUID NOT NULL REFERENCES public.conferences(id) ON DELETE RESTRICT,
  registration_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'credentialed' CHECK (status IN ('credentialed', 'revoked')),
  credentialed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  credentialed_by UUID NOT NULL REFERENCES public.admin_profiles(id),
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES public.admin_profiles(id),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Foreign Key Composta: Garante que o credenciamento pertence estritamente à mesma conferência da inscrição
  CONSTRAINT fk_accreditations_reg_conf 
    FOREIGN KEY (registration_id, conference_id) 
    REFERENCES public.registrations (id, conference_id) 
    ON DELETE RESTRICT
);

-- Restrição de Unicidade Parcial: Apenas 1 credenciamento ativo por participante
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_accreditation 
ON public.accreditations (registration_id) 
WHERE status = 'credentialed';

CREATE INDEX IF NOT EXISTS idx_accreditations_conf_status ON public.accreditations(conference_id, status);

-- 2. Tabela de Sessões da Conferência
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conference_id UUID NOT NULL REFERENCES public.conferences(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  description TEXT,
  session_date DATE NOT NULL,
  starts_at TIME,
  ends_at TIME,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'open', 'closed', 'cancelled')),
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Restrição Composta para integridade referencial com presenças
  CONSTRAINT uq_sessions_id_conference UNIQUE (id, conference_id)
);

CREATE INDEX IF NOT EXISTS idx_sessions_conf_status ON public.sessions(conference_id, status);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON public.sessions(conference_id, session_date, sort_order);

-- 3. Tabela de Registo de Presenças por Sessão
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conference_id UUID NOT NULL REFERENCES public.conferences(id) ON DELETE RESTRICT,
  session_id UUID NOT NULL,
  registration_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'voided')),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  recorded_by UUID NOT NULL REFERENCES public.admin_profiles(id),
  voided_at TIMESTAMPTZ,
  voided_by UUID REFERENCES public.admin_profiles(id),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Foreign Keys Compostas: Impedem estruturalmente qualquer cruzamento entre conferências distintas
  CONSTRAINT fk_attendance_session_conf 
    FOREIGN KEY (session_id, conference_id) 
    REFERENCES public.sessions (id, conference_id) 
    ON DELETE RESTRICT,

  CONSTRAINT fk_attendance_reg_conf 
    FOREIGN KEY (registration_id, conference_id) 
    REFERENCES public.registrations (id, conference_id) 
    ON DELETE RESTRICT
);

-- Restrição de Unicidade Parcial: Apenas 1 presença ativa por participante na mesma sessão
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_session_attendance 
ON public.attendance_records (session_id, registration_id) 
WHERE status = 'present';

CREATE INDEX IF NOT EXISTS idx_attendance_conf_session ON public.attendance_records(conference_id, session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_reg ON public.attendance_records(registration_id);
