-- ==============================================================================
-- ESQUEMA COMPLETO E SEGURANÇA CONSOLIDADA (Fase 2 - Revisão Corrigida)
-- Plataforma da III Sessão Bienal da Conferência Distrital da Juventude de Luanda
-- ==============================================================================

-- ==============================================================================
-- MigraÃ§Ã£o 00001: Esquema Inicial e ExtensÃµes
-- Plataforma da III SessÃ£o Bienal da ConferÃªncia Distrital da Juventude de Luanda
-- ==============================================================================

-- 1. AtivaÃ§Ã£o de extensÃµes essenciais
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- 2. FunÃ§Ã£o wrapper IMMUTABLE para o unaccent (necessÃ¡ria para Ã­ndices em PostgreSQL)
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

-- 3. Tabela de ConferÃªncias
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

-- 4. Tabela de OrganizaÃ§Ãµes / Igrejas Locais
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

-- 5. Tabela de ConfiguraÃ§Ãµes do Evento
CREATE TABLE IF NOT EXISTS public.event_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conference_id UUID NOT NULL REFERENCES public.conferences(id) ON DELETE CASCADE,
  setting_key TEXT NOT NULL,
  setting_value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_event_settings_conf_key UNIQUE (conference_id, setting_key)
);

-- Ãndices de consulta rÃ¡pida
CREATE INDEX IF NOT EXISTS idx_conferences_slug ON public.conferences(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_active ON public.organizations(is_active);
CREATE INDEX IF NOT EXISTS idx_organizations_district ON public.organizations(ecclesiastical_district);


-- ------------------------------------------------------------------------------

-- ==============================================================================
-- MigraÃ§Ã£o 00002: Controlo de Acesso Baseado em FunÃ§Ãµes (RBAC) e Perfis
-- Plataforma da III SessÃ£o Bienal da ConferÃªncia Distrital da Juventude de Luanda
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

-- 2. Tabela de FunÃ§Ãµes / PapÃ©is Administrativos
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

-- 3. Tabela de AssociaÃ§Ã£o Utilizador <-> FunÃ§Ãµes (Permite acumulaÃ§Ã£o de funÃ§Ãµes)
CREATE TABLE IF NOT EXISTS public.admin_user_roles (
  user_id UUID NOT NULL REFERENCES public.admin_profiles(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.admin_roles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, role_id)
);

-- Ãndices de consulta rÃ¡pida
CREATE INDEX IF NOT EXISTS idx_admin_profiles_active ON public.admin_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_user_roles_user ON public.admin_user_roles(user_id);

-- 4. FunÃ§Ã£o Segura para verificar se o utilizador autenticado atual tem determinada role
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

-- 5. FunÃ§Ã£o Segura para verificar se o utilizador atual Ã© um administrador ativo
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

-- RestriÃ§Ã£o de execuÃ§Ã£o das funÃ§Ãµes de autorizaÃ§Ã£o
REVOKE EXECUTE ON FUNCTION public.current_user_has_role FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_has_role TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_active_admin FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_active_admin TO authenticated;


-- ------------------------------------------------------------------------------

-- ==============================================================================
-- MigraÃ§Ã£o 00003: Esquema de InscriÃ§Ãµes e Integridade Multi-ConferÃªncia
-- Plataforma da III SessÃ£o Bienal da ConferÃªncia Distrital da Juventude de Luanda
-- ==============================================================================

-- 1. Tabela de InscriÃ§Ãµes
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

  -- RestriÃ§Ã£o Composta para Garantia de Integridade Multi-ConferÃªncia
  CONSTRAINT uq_registrations_id_conference UNIQUE (id, conference_id)
);

-- 2. Ãndices de Alta Performance para Listagens, Pesquisas e Controlo de Vagas
CREATE INDEX IF NOT EXISTS idx_registrations_conf_status ON public.registrations(conference_id, status);
CREATE INDEX IF NOT EXISTS idx_registrations_code ON public.registrations(registration_code);
CREATE INDEX IF NOT EXISTS idx_registrations_phone ON public.registrations(conference_id, phone);
CREATE INDEX IF NOT EXISTS idx_registrations_submitted ON public.registrations(conference_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_registrations_duplicate ON public.registrations(conference_id, is_suspected_duplicate) WHERE is_suspected_duplicate = true;

-- Ãndice GIN para pesquisa eficiente e sem acentos por nome (utiliza wrapper IMMUTABLE)
CREATE INDEX IF NOT EXISTS idx_registrations_name_search 
ON public.registrations USING gin (to_tsvector('simple', public.immutable_unaccent(full_name)));


-- ------------------------------------------------------------------------------

-- ==============================================================================
-- MigraÃ§Ã£o 00004: Credenciamento Presencial, SessÃµes e Controlo de PresenÃ§as
-- Plataforma da III SessÃ£o Bienal da ConferÃªncia Distrital da Juventude de Luanda
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

  -- Foreign Key Composta: Garante que o credenciamento pertence estritamente Ã  mesma conferÃªncia da inscriÃ§Ã£o
  CONSTRAINT fk_accreditations_reg_conf 
    FOREIGN KEY (registration_id, conference_id) 
    REFERENCES public.registrations (id, conference_id) 
    ON DELETE RESTRICT
);

-- RestriÃ§Ã£o de Unicidade Parcial: Apenas 1 credenciamento ativo por participante
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_accreditation 
ON public.accreditations (registration_id) 
WHERE status = 'credentialed';

CREATE INDEX IF NOT EXISTS idx_accreditations_conf_status ON public.accreditations(conference_id, status);

-- 2. Tabela de SessÃµes da ConferÃªncia
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

  -- RestriÃ§Ã£o Composta para integridade referencial com presenÃ§as
  CONSTRAINT uq_sessions_id_conference UNIQUE (id, conference_id)
);

CREATE INDEX IF NOT EXISTS idx_sessions_conf_status ON public.sessions(conference_id, status);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON public.sessions(conference_id, session_date, sort_order);

-- 3. Tabela de Registo de PresenÃ§as por SessÃ£o
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

  -- Foreign Keys Compostas: Impedem estruturalmente qualquer cruzamento entre conferÃªncias distintas
  CONSTRAINT fk_attendance_session_conf 
    FOREIGN KEY (session_id, conference_id) 
    REFERENCES public.sessions (id, conference_id) 
    ON DELETE RESTRICT,

  CONSTRAINT fk_attendance_reg_conf 
    FOREIGN KEY (registration_id, conference_id) 
    REFERENCES public.registrations (id, conference_id) 
    ON DELETE RESTRICT
);

-- RestriÃ§Ã£o de Unicidade Parcial: Apenas 1 presenÃ§a ativa por participante na mesma sessÃ£o
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_session_attendance 
ON public.attendance_records (session_id, registration_id) 
WHERE status = 'present';

CREATE INDEX IF NOT EXISTS idx_attendance_conf_session ON public.attendance_records(conference_id, session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_reg ON public.attendance_records(registration_id);


-- ------------------------------------------------------------------------------

-- ==============================================================================
-- MigraÃ§Ã£o 00005: Auditoria ImutÃ¡vel de OperaÃ§Ãµes Administrativas
-- Plataforma da III SessÃ£o Bienal da ConferÃªncia Distrital da Juventude de Luanda
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

-- Ãndices de consulta de auditoria
CREATE INDEX IF NOT EXISTS idx_audit_logs_conf ON public.audit_logs(conference_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);

-- 2. FunÃ§Ã£o de ProteÃ§Ã£o Absoluta contra ModificaÃ§Ã£o ou ExclusÃ£o de Logs
CREATE OR REPLACE FUNCTION public.protect_audit_logs()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are strictly immutable and cannot be updated or deleted.'
    USING ERRCODE = '55000';
END;
$$;

-- 3. Trigger que assegura a imutabilidade fÃ­sica no nÃ­vel do PostgreSQL
DROP TRIGGER IF EXISTS trg_protect_audit_logs ON public.audit_logs;
CREATE TRIGGER trg_protect_audit_logs
BEFORE UPDATE OR DELETE ON public.audit_logs
FOR EACH ROW EXECUTE FUNCTION public.protect_audit_logs();

-- 4. RevogaÃ§Ã£o explÃ­cita de permissÃµes DML destrutivas
REVOKE UPDATE, DELETE, TRUNCATE ON TABLE public.audit_logs FROM PUBLIC, anon, authenticated;


-- ------------------------------------------------------------------------------

-- ==============================================================================
-- MigraÃ§Ã£o 00006: Stored Procedures AtÃ³micas e ConcorrÃªncia Transacional
-- Plataforma da III SessÃ£o Bienal da ConferÃªncia Distrital da Juventude de Luanda
-- ==============================================================================

-- 1. FunÃ§Ã£o AtÃ³mica de SubmissÃ£o PÃºblica de InscriÃ§Ã£o (com Lock Pessimista de Vagas)
CREATE OR REPLACE FUNCTION public.submit_public_registration(
  p_conference_id UUID,
  p_idempotency_key TEXT,
  p_full_name TEXT,
  p_sex TEXT,
  p_phone TEXT,
  p_local_church TEXT,
  p_ecclesiastical_district TEXT,
  p_municipality TEXT,
  p_organizational_role TEXT,
  p_participant_category TEXT,
  p_delegation_responsible TEXT DEFAULT NULL,
  p_organization_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_capacity INT;
  v_is_open BOOLEAN;
  v_code_prefix TEXT;
  v_active_count INT;
  v_reg_code TEXT;
  v_existing_id UUID;
  v_existing_code TEXT;
  v_existing_submitted_at TIMESTAMPTZ;
  v_is_duplicate BOOLEAN := false;
  v_dup_id UUID := NULL;
  v_chars TEXT := '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  v_rand_part TEXT := '';
  v_i INT;
  v_code_exists BOOLEAN := true;
BEGIN
  -- A. IdempotÃªncia imediata de envio (rede / duplo clique)
  SELECT id, registration_code, submitted_at 
  INTO v_existing_id, v_existing_code, v_existing_submitted_at
  FROM public.registrations
  WHERE conference_id = p_conference_id 
    AND idempotency_key = p_idempotency_key;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'status', 'idempotent_success',
      'registration_code', v_existing_code,
      'submitted_at', v_existing_submitted_at,
      'message', 'SubmissÃ£o jÃ¡ processada com sucesso anteriormente.'
    );
  END IF;

  -- B. Bloqueio pessimista da linha da conferÃªncia (impede race condition de 500 vagas)
  SELECT capacity, registration_open, code_prefix
  INTO v_capacity, v_is_open, v_code_prefix
  FROM public.conferences
  WHERE id = p_conference_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'CONFERENCE_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;

  IF NOT v_is_open THEN
    RAISE EXCEPTION 'REGISTRATIONS_CLOSED' USING ERRCODE = 'P0003';
  END IF;

  -- C. VerificaÃ§Ã£o atÃ³mica de capacidade (apenas pending e approved ocupam vaga)
  SELECT COUNT(*) INTO v_active_count
  FROM public.registrations
  WHERE conference_id = p_conference_id
    AND status IN ('pending', 'approved');

  IF v_active_count >= v_capacity THEN
    RAISE EXCEPTION 'CAPACITY_REACHED' USING ERRCODE = 'P0004';
  END IF;

  -- D. DeteÃ§Ã£o de suspeita de duplicados (mesmo telefone normalizado em inscriÃ§Ã£o ativa)
  SELECT id INTO v_dup_id
  FROM public.registrations
  WHERE conference_id = p_conference_id
    AND status IN ('pending', 'approved')
    AND regexp_replace(phone, '\D', '', 'g') = regexp_replace(p_phone, '\D', '', 'g')
  LIMIT 1;

  IF FOUND THEN
    v_is_duplicate := true;
  END IF;

  -- E. GeraÃ§Ã£o de cÃ³digo legÃ­vel, seguro e nÃ£o sequencial (sem caracteres ambÃ­guos)
  WHILE v_code_exists LOOP
    v_rand_part := '';
    FOR v_i IN 1..5 LOOP
      v_rand_part := v_rand_part || substr(v_chars, floor(random() * length(v_chars) + 1)::int, 1);
    END LOOP;
    v_reg_code := v_code_prefix || '-' || v_rand_part;

    SELECT EXISTS (
      SELECT 1 FROM public.registrations WHERE registration_code = v_reg_code
    ) INTO v_code_exists;
  END LOOP;

  -- F. InserÃ§Ã£o persistente
  INSERT INTO public.registrations (
    conference_id,
    idempotency_key,
    registration_code,
    full_name,
    sex,
    phone,
    organization_id,
    local_church,
    ecclesiastical_district,
    municipality,
    organizational_role,
    participant_category,
    delegation_responsible,
    status,
    is_suspected_duplicate,
    duplicate_metadata,
    submitted_at
  ) VALUES (
    p_conference_id,
    p_idempotency_key,
    v_reg_code,
    trim(p_full_name),
    p_sex,
    trim(p_phone),
    p_organization_id,
    trim(p_local_church),
    trim(p_ecclesiastical_district),
    trim(p_municipality),
    trim(p_organizational_role),
    trim(p_participant_category),
    trim(p_delegation_responsible),
    'pending',
    v_is_duplicate,
    CASE WHEN v_is_duplicate THEN jsonb_build_object('matched_registration_id', v_dup_id, 'reason', 'MATCHED_PHONE') ELSE NULL END,
    now()
  );

  RETURN jsonb_build_object(
    'status', 'created',
    'registration_code', v_reg_code,
    'is_duplicate_flagged', v_is_duplicate,
    'submitted_at', now()
  );
END;
$$;

-- 2. FunÃ§Ã£o de AlteraÃ§Ã£o de Estado de InscriÃ§Ã£o (com Bloqueio RÃ­gido de ReativaÃ§Ã£o sem Vagas)
CREATE OR REPLACE FUNCTION public.change_registration_status(
  p_registration_id UUID,
  p_new_status TEXT,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_actor_id UUID;
  v_conf_id UUID;
  v_old_status TEXT;
  v_capacity INT;
  v_active_count INT;
  v_reg_data JSONB;
BEGIN
  v_actor_id := auth.uid();

  -- A. ValidaÃ§Ã£o de autorizaÃ§Ã£o
  IF NOT (
    public.current_user_has_role('validator') OR 
    public.current_user_has_role('registration_admin') OR 
    public.current_user_has_role('super_admin')
  ) THEN
    RAISE EXCEPTION 'FORBIDDEN_INSUFFICIENT_PERMISSIONS' USING ERRCODE = '42501';
  END IF;

  -- B. ValidaÃ§Ã£o do novo status
  IF p_new_status NOT IN ('pending', 'approved', 'rejected', 'cancelled') THEN
    RAISE EXCEPTION 'INVALID_STATUS' USING ERRCODE = '22023';
  END IF;

  -- C. Leitura dos dados atuais da inscriÃ§Ã£o
  SELECT conference_id, status, to_jsonb(r.*) 
  INTO v_conf_id, v_old_status, v_reg_data
  FROM public.registrations r
  WHERE id = p_registration_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'REGISTRATION_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;

  -- D. Se estiver a reativar (de rejected/cancelled para pending/approved), validar capacidade estrita com lock
  IF v_old_status IN ('rejected', 'cancelled') AND p_new_status IN ('pending', 'approved') THEN
    SELECT capacity INTO v_capacity 
    FROM public.conferences 
    WHERE id = v_conf_id 
    FOR UPDATE;

    SELECT COUNT(*) INTO v_active_count
    FROM public.registrations
    WHERE conference_id = v_conf_id
      AND status IN ('pending', 'approved');

    IF v_active_count >= v_capacity THEN
      RAISE EXCEPTION 'CAPACITY_EXCEEDED_CANNOT_REACTIVATE' USING ERRCODE = 'P0005';
    END IF;
  END IF;

  -- E. AtualizaÃ§Ã£o do estado
  UPDATE public.registrations
  SET status = p_new_status,
      reviewed_at = now(),
      reviewed_by = v_actor_id,
      review_reason = trim(p_reason),
      updated_at = now()
  WHERE id = p_registration_id;

  -- F. Registo em Auditoria ImutÃ¡vel
  INSERT INTO public.audit_logs (
    actor_user_id,
    conference_id,
    action,
    entity_type,
    entity_id,
    before_data,
    after_data,
    reason
  ) VALUES (
    v_actor_id,
    v_conf_id,
    'STATUS_CHANGE_' || upper(p_new_status),
    'registrations',
    p_registration_id::text,
    v_reg_data,
    jsonb_build_object('status', p_new_status, 'reviewed_by', v_actor_id, 'review_reason', p_reason),
    p_reason
  );

  RETURN jsonb_build_object(
    'success', true,
    'registration_id', p_registration_id,
    'old_status', v_old_status,
    'new_status', p_new_status
  );
END;
$$;

-- 3. FunÃ§Ã£o de Credenciamento Presencial Manual
CREATE OR REPLACE FUNCTION public.process_accreditation(
  p_conference_id UUID,
  p_registration_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_actor_id UUID;
  v_status TEXT;
  v_conf_id UUID;
  v_acc_id UUID;
BEGIN
  v_actor_id := auth.uid();

  -- A. ValidaÃ§Ã£o de autorizaÃ§Ã£o (apenas credenciamento e super_admin)
  IF NOT (
    public.current_user_has_role('accreditation_operator') OR 
    public.current_user_has_role('super_admin')
  ) THEN
    RAISE EXCEPTION 'FORBIDDEN_INSUFFICIENT_PERMISSIONS' USING ERRCODE = '42501';
  END IF;

  -- B. VerificaÃ§Ã£o da inscriÃ§Ã£o
  SELECT conference_id, status 
  INTO v_conf_id, v_status
  FROM public.registrations
  WHERE id = p_registration_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'REGISTRATION_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;

  IF v_conf_id != p_conference_id THEN
    RAISE EXCEPTION 'CONFERENCE_MISMATCH' USING ERRCODE = 'P0006';
  END IF;

  IF v_status != 'approved' THEN
    RAISE EXCEPTION 'REGISTRATION_NOT_APPROVED' USING ERRCODE = 'P0007';
  END IF;

  -- C. VerificaÃ§Ã£o de credenciamento jÃ¡ ativo
  IF EXISTS (
    SELECT 1 FROM public.accreditations
    WHERE registration_id = p_registration_id AND status = 'credentialed'
  ) THEN
    RAISE EXCEPTION 'ALREADY_CREDENTIALED' USING ERRCODE = 'P0008';
  END IF;

  -- D. InserÃ§Ã£o do credenciamento
  INSERT INTO public.accreditations (
    conference_id,
    registration_id,
    status,
    credentialed_at,
    credentialed_by,
    reason
  ) VALUES (
    p_conference_id,
    p_registration_id,
    'credentialed',
    now(),
    v_actor_id,
    trim(p_notes)
  )
  RETURNING id INTO v_acc_id;

  -- E. Registo em Auditoria ImutÃ¡vel
  INSERT INTO public.audit_logs (
    actor_user_id,
    conference_id,
    action,
    entity_type,
    entity_id,
    after_data,
    reason
  ) VALUES (
    v_actor_id,
    p_conference_id,
    'ACCREDITATION_CONFIRMED',
    'accreditations',
    v_acc_id::text,
    jsonb_build_object('registration_id', p_registration_id, 'status', 'credentialed'),
    p_notes
  );

  RETURN jsonb_build_object(
    'success', true,
    'accreditation_id', v_acc_id,
    'registration_id', p_registration_id,
    'status', 'credentialed'
  );
END;
$$;

-- 4. FunÃ§Ã£o de Registo de PresenÃ§as por SessÃ£o
CREATE OR REPLACE FUNCTION public.record_session_attendance(
  p_conference_id UUID,
  p_session_id UUID,
  p_registration_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_actor_id UUID;
  v_sess_conf_id UUID;
  v_sess_status TEXT;
  v_reg_conf_id UUID;
  v_is_credentialed BOOLEAN;
  v_att_id UUID;
BEGIN
  v_actor_id := auth.uid();

  -- A. ValidaÃ§Ã£o de autorizaÃ§Ã£o (apenas operador de presenÃ§as e super_admin)
  IF NOT (
    public.current_user_has_role('attendance_operator') OR 
    public.current_user_has_role('super_admin')
  ) THEN
    RAISE EXCEPTION 'FORBIDDEN_INSUFFICIENT_PERMISSIONS' USING ERRCODE = '42501';
  END IF;

  -- B. VerificaÃ§Ã£o da sessÃ£o (deve pertencer Ã  conferÃªncia e estar aberta)
  SELECT conference_id, status 
  INTO v_sess_conf_id, v_sess_status
  FROM public.sessions
  WHERE id = p_session_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'SESSION_NOT_FOUND' USING ERRCODE = 'P0009';
  END IF;

  IF v_sess_conf_id != p_conference_id THEN
    RAISE EXCEPTION 'CONFERENCE_MISMATCH_SESSION' USING ERRCODE = 'P0006';
  END IF;

  IF v_sess_status != 'open' THEN
    RAISE EXCEPTION 'SESSION_NOT_OPEN' USING ERRCODE = 'P0010';
  END IF;

  -- C. VerificaÃ§Ã£o da inscriÃ§Ã£o e estado de credenciamento
  SELECT conference_id INTO v_reg_conf_id
  FROM public.registrations
  WHERE id = p_registration_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'REGISTRATION_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;

  IF v_reg_conf_id != p_conference_id THEN
    RAISE EXCEPTION 'CONFERENCE_MISMATCH_REGISTRATION' USING ERRCODE = 'P0006';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.accreditations
    WHERE registration_id = p_registration_id AND status = 'credentialed'
  ) INTO v_is_credentialed;

  IF NOT v_is_credentialed THEN
    RAISE EXCEPTION 'PARTICIPANT_NOT_CREDENTIALED' USING ERRCODE = 'P0011';
  END IF;

  -- D. VerificaÃ§Ã£o de presenÃ§a jÃ¡ registada na sessÃ£o
  IF EXISTS (
    SELECT 1 FROM public.attendance_records
    WHERE session_id = p_session_id AND registration_id = p_registration_id AND status = 'present'
  ) THEN
    RAISE EXCEPTION 'ALREADY_RECORDED_PRESENT' USING ERRCODE = 'P0012';
  END IF;

  -- E. InserÃ§Ã£o da presenÃ§a
  INSERT INTO public.attendance_records (
    conference_id,
    session_id,
    registration_id,
    status,
    recorded_at,
    recorded_by
  ) VALUES (
    p_conference_id,
    p_session_id,
    p_registration_id,
    'present',
    now(),
    v_actor_id
  )
  RETURNING id INTO v_att_id;

  -- F. Registo em Auditoria ImutÃ¡vel
  INSERT INTO public.audit_logs (
    actor_user_id,
    conference_id,
    action,
    entity_type,
    entity_id,
    after_data
  ) VALUES (
    v_actor_id,
    p_conference_id,
    'ATTENDANCE_RECORDED',
    'attendance_records',
    v_att_id::text,
    jsonb_build_object('session_id', p_session_id, 'registration_id', p_registration_id, 'status', 'present')
  );

  RETURN jsonb_build_object(
    'success', true,
    'attendance_id', v_att_id,
    'session_id', p_session_id,
    'registration_id', p_registration_id
  );
END;
$$;

-- RestriÃ§Ã£o estrita de privilÃ©gios de execuÃ§Ã£o
REVOKE EXECUTE ON FUNCTION public.submit_public_registration FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_public_registration TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.change_registration_status FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.change_registration_status TO authenticated;

REVOKE EXECUTE ON FUNCTION public.process_accreditation FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.process_accreditation TO authenticated;

REVOKE EXECUTE ON FUNCTION public.record_session_attendance FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_session_attendance TO authenticated;


-- ------------------------------------------------------------------------------

-- ==============================================================================
-- MigraÃ§Ã£o 00007: PolÃ­ticas Granulares de Row Level Security (RLS) e PrivilÃ©gios
-- Plataforma da III SessÃ£o Bienal da ConferÃªncia Distrital da Juventude de Luanda
-- ==============================================================================

-- 1. ConcessÃ£o de uso do schema public e permissÃµes base aos papÃ©is do Supabase
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- 2. AtivaÃ§Ã£o de RLS em todas as tabelas
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

-- 3. ForÃ§ar RLS em todas as tabelas (RLS avaliado para anon e authenticated)
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
-- POLÃTICAS: conferences
-- ==============================================================================
DROP POLICY IF EXISTS "Public pode ler conferÃªncia aberta" ON public.conferences;
CREATE POLICY "Public pode ler conferÃªncia aberta"
ON public.conferences FOR SELECT
TO anon, authenticated
USING (registration_open = true OR public.is_active_admin());

DROP POLICY IF EXISTS "Superadmin pode gerir conferÃªncias" ON public.conferences;
CREATE POLICY "Superadmin pode gerir conferÃªncias"
ON public.conferences FOR ALL
TO authenticated
USING (public.current_user_has_role('super_admin'))
WITH CHECK (public.current_user_has_role('super_admin'));

-- ==============================================================================
-- POLÃTICAS: organizations
-- ==============================================================================
DROP POLICY IF EXISTS "Leitura de organizaÃ§Ãµes ativas" ON public.organizations;
CREATE POLICY "Leitura de organizaÃ§Ãµes ativas"
ON public.organizations FOR SELECT
TO anon, authenticated
USING (is_active = true OR public.is_active_admin());

DROP POLICY IF EXISTS "Admins podem gerir organizaÃ§Ãµes" ON public.organizations;
CREATE POLICY "Admins podem gerir organizaÃ§Ãµes"
ON public.organizations FOR ALL
TO authenticated
USING (public.current_user_has_role('super_admin') OR public.current_user_has_role('registration_admin'))
WITH CHECK (public.current_user_has_role('super_admin') OR public.current_user_has_role('registration_admin'));

-- ==============================================================================
-- POLÃTICAS: admin_profiles, admin_roles, admin_user_roles
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

DROP POLICY IF EXISTS "Admins ativos podem ler funÃ§Ãµes" ON public.admin_roles;
CREATE POLICY "Admins ativos podem ler funÃ§Ãµes"
ON public.admin_roles FOR SELECT
TO authenticated
USING (public.is_active_admin());

DROP POLICY IF EXISTS "Admins ativos podem ler atribuiÃ§Ãµes de papÃ©is" ON public.admin_user_roles;
CREATE POLICY "Admins ativos podem ler atribuiÃ§Ãµes de papÃ©is"
ON public.admin_user_roles FOR SELECT
TO authenticated
USING (public.is_active_admin());

DROP POLICY IF EXISTS "Superadmin gere atribuiÃ§Ã£o de papÃ©is" ON public.admin_user_roles;
CREATE POLICY "Superadmin gere atribuiÃ§Ã£o de papÃ©is"
ON public.admin_user_roles FOR ALL
TO authenticated
USING (public.current_user_has_role('super_admin'))
WITH CHECK (public.current_user_has_role('super_admin'));

-- ==============================================================================
-- POLÃTICAS: registrations
-- ==============================================================================
-- PÃºblico (anon) NÃƒO tem permissÃ£o de SELECT direto em registrations
DROP POLICY IF EXISTS "Admins podem ler inscriÃ§Ãµes" ON public.registrations;
CREATE POLICY "Admins podem ler inscriÃ§Ãµes"
ON public.registrations FOR SELECT
TO authenticated
USING (public.is_active_admin());

-- CriaÃ§Ã£o direta bloqueada por RLS: submissÃ£o Ã© executada via RPC submit_public_registration (SECURITY DEFINER)
DROP POLICY IF EXISTS "Admins autorizados podem atualizar inscriÃ§Ãµes" ON public.registrations;
CREATE POLICY "Admins autorizados podem atualizar inscriÃ§Ãµes"
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
-- POLÃTICAS: accreditations
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
-- POLÃTICAS: sessions
-- ==============================================================================
DROP POLICY IF EXISTS "Admins podem consultar sessÃµes" ON public.sessions;
CREATE POLICY "Admins podem consultar sessÃµes"
ON public.sessions FOR SELECT
TO authenticated
USING (public.is_active_admin());

DROP POLICY IF EXISTS "Superadmin gere sessÃµes" ON public.sessions;
CREATE POLICY "Superadmin gere sessÃµes"
ON public.sessions FOR ALL
TO authenticated
USING (public.current_user_has_role('super_admin'))
WITH CHECK (public.current_user_has_role('super_admin'));

-- ==============================================================================
-- POLÃTICAS: attendance_records
-- ==============================================================================
DROP POLICY IF EXISTS "Operadores e superadmin leem presenÃ§as" ON public.attendance_records;
CREATE POLICY "Operadores e superadmin leem presenÃ§as"
ON public.attendance_records FOR SELECT
TO authenticated
USING (
  public.current_user_has_role('attendance_operator') OR 
  public.current_user_has_role('consultant') OR 
  public.current_user_has_role('super_admin')
);

DROP POLICY IF EXISTS "Superadmin pode anular presenÃ§as com motivo" ON public.attendance_records;
CREATE POLICY "Superadmin pode anular presenÃ§as com motivo"
ON public.attendance_records FOR UPDATE
TO authenticated
USING (public.current_user_has_role('super_admin'))
WITH CHECK (public.current_user_has_role('super_admin'));

-- ==============================================================================
-- POLÃTICAS: audit_logs
-- ==============================================================================
DROP POLICY IF EXISTS "Apenas Superadmin lÃª trilha de auditoria" ON public.audit_logs;
CREATE POLICY "Apenas Superadmin lÃª trilha de auditoria"
ON public.audit_logs FOR SELECT
TO authenticated
USING (public.current_user_has_role('super_admin'));

DROP POLICY IF EXISTS "InserÃ§Ã£o de auditoria permitida por administradores ativos" ON public.audit_logs;
CREATE POLICY "InserÃ§Ã£o de auditoria permitida por administradores ativos"
ON public.audit_logs FOR INSERT
TO authenticated
WITH CHECK (public.is_active_admin());

-- ==============================================================================
-- POLÃTICAS: event_settings
-- ==============================================================================
DROP POLICY IF EXISTS "Admins podem ler configuraÃ§Ãµes do evento" ON public.event_settings;
CREATE POLICY "Admins podem ler configuraÃ§Ãµes do evento"
ON public.event_settings FOR SELECT
TO authenticated
USING (public.is_active_admin());

DROP POLICY IF EXISTS "Superadmin gere configuraÃ§Ãµes do evento" ON public.event_settings;
CREATE POLICY "Superadmin gere configuraÃ§Ãµes do evento"
ON public.event_settings FOR ALL
TO authenticated
USING (public.current_user_has_role('super_admin'))
WITH CHECK (public.current_user_has_role('super_admin'));


-- ------------------------------------------------------------------------------

-- ==============================================================================
-- MigraÃ§Ã£o 00008: Dados Base Iniciais e PapÃ©is Oficiais
-- Plataforma da III SessÃ£o Bienal da ConferÃªncia Distrital da Juventude de Luanda
-- ==============================================================================

-- 1. CriaÃ§Ã£o das FunÃ§Ãµes Oficiais do RBAC
INSERT INTO public.admin_roles (name, description) VALUES
  ('super_admin', 'Acesso total Ã  plataforma, gestÃ£o de utilizadores, configuraÃ§Ãµes de vagas e auditoria'),
  ('registration_admin', 'GestÃ£o, ediÃ§Ã£o e exportaÃ§Ã£o de inscriÃ§Ãµes e dados organizacionais'),
  ('validator', 'RevisÃ£o, aprovaÃ§Ã£o e rejeiÃ§Ã£o fundamentada de inscriÃ§Ãµes de delegados'),
  ('accreditation_operator', 'Pesquisa manual e confirmaÃ§Ã£o presencial de credenciamento no local'),
  ('attendance_operator', 'Controlo e registo individual de presenÃ§as em sessÃµes abertas'),
  ('consultant', 'Acesso de apenas leitura a estatÃ­sticas, painÃ©is e relatÃ³rios autorizados')
ON CONFLICT (name) DO UPDATE 
SET description = EXCLUDED.description;

-- 2. CriaÃ§Ã£o da ConferÃªncia Oficial (Capacidade: 500, CÃ³digo: CDJ26, Fuso: Africa/Luanda)
INSERT INTO public.conferences (
  name,
  slug,
  capacity,
  registration_open,
  code_prefix,
  timezone,
  description
) VALUES (
  'III SessÃ£o Bienal da ConferÃªncia Distrital da Juventude de Luanda',
  'iii-conferencia-distrital-luanda-2026',
  500,
  true,
  'CDJ26',
  'Africa/Luanda',
  'Plataforma oficial da III SessÃ£o Bienal da ConferÃªncia Distrital da Juventude de Luanda.'
)
ON CONFLICT (slug) DO NOTHING;

-- 3. ConfiguraÃ§Ãµes PadrÃ£o de DetecÃ§Ã£o de Duplicados
INSERT INTO public.event_settings (
  conference_id,
  setting_key,
  setting_value
)
SELECT 
  c.id,
  'duplicate_detection_rules',
  '{"match_phone": true, "match_name": true, "auto_flag": true}'::jsonb
FROM public.conferences c
WHERE c.slug = 'iii-conferencia-distrital-luanda-2026'
ON CONFLICT (conference_id, setting_key) DO NOTHING;


-- ------------------------------------------------------------------------------


