-- ==============================================================================
-- Migração 00006: Stored Procedures Atómicas e Concorrência Transacional
-- Plataforma da III Sessão Bienal da Conferência Distrital da Juventude de Luanda
-- ==============================================================================

-- 1. Função Atómica de Submissão Pública de Inscrição (com Lock Pessimista de Vagas)
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
  -- A. Idempotência imediata de envio (rede / duplo clique)
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
      'message', 'Submissão já processada com sucesso anteriormente.'
    );
  END IF;

  -- B. Bloqueio pessimista da linha da conferência (impede race condition de 500 vagas)
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

  -- C. Verificação atómica de capacidade (apenas pending e approved ocupam vaga)
  SELECT COUNT(*) INTO v_active_count
  FROM public.registrations
  WHERE conference_id = p_conference_id
    AND status IN ('pending', 'approved');

  IF v_active_count >= v_capacity THEN
    RAISE EXCEPTION 'CAPACITY_REACHED' USING ERRCODE = 'P0004';
  END IF;

  -- D. Deteção de suspeita de duplicados (mesmo telefone normalizado em inscrição ativa)
  SELECT id INTO v_dup_id
  FROM public.registrations
  WHERE conference_id = p_conference_id
    AND status IN ('pending', 'approved')
    AND regexp_replace(phone, '\D', '', 'g') = regexp_replace(p_phone, '\D', '', 'g')
  LIMIT 1;

  IF FOUND THEN
    v_is_duplicate := true;
  END IF;

  -- E. Geração de código legível, seguro e não sequencial (sem caracteres ambíguos)
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

  -- F. Inserção persistente
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

-- 2. Função de Alteração de Estado de Inscrição (com Bloqueio Rígido de Reativação sem Vagas)
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

  -- A. Validação de autorização
  IF NOT (
    public.current_user_has_role('validator') OR 
    public.current_user_has_role('registration_admin') OR 
    public.current_user_has_role('super_admin')
  ) THEN
    RAISE EXCEPTION 'FORBIDDEN_INSUFFICIENT_PERMISSIONS' USING ERRCODE = '42501';
  END IF;

  -- B. Validação do novo status
  IF p_new_status NOT IN ('pending', 'approved', 'rejected', 'cancelled') THEN
    RAISE EXCEPTION 'INVALID_STATUS' USING ERRCODE = '22023';
  END IF;

  -- C. Leitura dos dados atuais da inscrição
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

  -- E. Atualização do estado
  UPDATE public.registrations
  SET status = p_new_status,
      reviewed_at = now(),
      reviewed_by = v_actor_id,
      review_reason = trim(p_reason),
      updated_at = now()
  WHERE id = p_registration_id;

  -- F. Registo em Auditoria Imutável
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

-- 3. Função de Credenciamento Presencial Manual
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

  -- A. Validação de autorização (apenas credenciamento e super_admin)
  IF NOT (
    public.current_user_has_role('accreditation_operator') OR 
    public.current_user_has_role('super_admin')
  ) THEN
    RAISE EXCEPTION 'FORBIDDEN_INSUFFICIENT_PERMISSIONS' USING ERRCODE = '42501';
  END IF;

  -- B. Verificação da inscrição
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

  -- C. Verificação de credenciamento já ativo
  IF EXISTS (
    SELECT 1 FROM public.accreditations
    WHERE registration_id = p_registration_id AND status = 'credentialed'
  ) THEN
    RAISE EXCEPTION 'ALREADY_CREDENTIALED' USING ERRCODE = 'P0008';
  END IF;

  -- D. Inserção do credenciamento
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

  -- E. Registo em Auditoria Imutável
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

-- 4. Função de Registo de Presenças por Sessão
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

  -- A. Validação de autorização (apenas operador de presenças e super_admin)
  IF NOT (
    public.current_user_has_role('attendance_operator') OR 
    public.current_user_has_role('super_admin')
  ) THEN
    RAISE EXCEPTION 'FORBIDDEN_INSUFFICIENT_PERMISSIONS' USING ERRCODE = '42501';
  END IF;

  -- B. Verificação da sessão (deve pertencer à conferência e estar aberta)
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

  -- C. Verificação da inscrição e estado de credenciamento
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

  -- D. Verificação de presença já registada na sessão
  IF EXISTS (
    SELECT 1 FROM public.attendance_records
    WHERE session_id = p_session_id AND registration_id = p_registration_id AND status = 'present'
  ) THEN
    RAISE EXCEPTION 'ALREADY_RECORDED_PRESENT' USING ERRCODE = 'P0012';
  END IF;

  -- E. Inserção da presença
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

  -- F. Registo em Auditoria Imutável
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

-- Restrição estrita de privilégios de execução
REVOKE EXECUTE ON FUNCTION public.submit_public_registration FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_public_registration TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.change_registration_status FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.change_registration_status TO authenticated;

REVOKE EXECUTE ON FUNCTION public.process_accreditation FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.process_accreditation TO authenticated;

REVOKE EXECUTE ON FUNCTION public.record_session_attendance FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_session_attendance TO authenticated;
