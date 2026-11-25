-- ==============================================================================
-- Migração 00009: Actualização dos Campos de Inscrição
-- Plataforma da III Sessão Bienal da Conferência Distrital da Juventude de Luanda
--
-- ALTERAÇÕES:
--   1. Adiciona coluna `email` (nullable, compatível com inscrições antigas)
--   2. Reutiliza semanticamente `local_church` → continua a existir como `local_church`
--      para armazenar o Cargo Pastoral associado à Intendência, actualizando apenas o
--      comentário da coluna. Todos os dados históricos são preservados sem alteração.
--   3. Reutiliza `ecclesiastical_district` para armazenar a Intendência (CRISH | MVC | BTS2M | C3K).
--   4. Adiciona coluna `custom_role` (nullable) para especificação de Função quando "Outro".
--
-- ESTRATÉGIA:
--   - Todas as alterações são NOT DESTRUCTIVE.
--   - Registos existentes sem email ficam com NULL (permitido).
--   - Registos existentes sem custom_role ficam com NULL (permitido).
--   - Nenhuma coluna existente é eliminada.
--   - Nenhum dado histórico é alterado automaticamente.
--   - Reversível: ver secção ROLLBACK no final.
-- ==============================================================================

BEGIN;

-- -----------------------------------------------------------------------
-- 1. Adicionar coluna de e-mail (nullable, sem unicidade imposta)
--    Inscrições existentes ficam com NULL — compatível e preservado.
-- -----------------------------------------------------------------------
ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS email TEXT;

COMMENT ON COLUMN public.registrations.email IS
  'Endereço de e-mail do inscrito. Opcional para registos históricos, obrigatório para novas inscrições a partir da migração 00009.';

-- -----------------------------------------------------------------------
-- 2. Adicionar coluna custom_role para especificação quando Função = "Outro"
--    Nullable: só preenchida quando organizational_role = 'Outro'.
-- -----------------------------------------------------------------------
ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS custom_role TEXT;

COMMENT ON COLUMN public.registrations.custom_role IS
  'Especificação da função quando organizational_role = ''Outro''. Nullable para retrocompatibilidade.';

-- -----------------------------------------------------------------------
-- 3. Actualizar comentários de colunas existentes para reflectir
--    a nova semântica sem alterar dados
-- -----------------------------------------------------------------------
COMMENT ON COLUMN public.registrations.local_church IS
  'Cargo Pastoral do inscrito. Campo reutilizado: historicamente continha o nome da Igreja Local/Congregação; a partir da migração 00009 armazena o Cargo Pastoral associado à Intendência.';

COMMENT ON COLUMN public.registrations.ecclesiastical_district IS
  'Intendência Eclesiástica do inscrito. Valores actuais: CRISH, MVC, BTS2M, C3K. Campo historicamente denominado Distrito Eclesiástico.';

-- -----------------------------------------------------------------------
-- 4. Índice para pesquisa por email (caso seja necessário no futuro)
-- -----------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_registrations_email
  ON public.registrations(email)
  WHERE email IS NOT NULL;

-- -----------------------------------------------------------------------
-- 5. Remover sobrecarga antiga (12 parâmetros) e actualizar a função atómica
--    submit_public_registration para aceitar email e custom_role (14 parâmetros).
--    Evita erro 42725 (function name is not unique) no REVOKE/GRANT.
-- -----------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.submit_public_registration(
  UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, UUID
);

CREATE OR REPLACE FUNCTION public.submit_public_registration(
  p_conference_id UUID,
  p_idempotency_key TEXT,
  p_full_name TEXT,
  p_sex TEXT,
  p_phone TEXT,
  p_email TEXT DEFAULT NULL,
  p_local_church TEXT DEFAULT NULL,
  p_ecclesiastical_district TEXT DEFAULT NULL,
  p_municipality TEXT DEFAULT NULL,
  p_organizational_role TEXT DEFAULT NULL,
  p_custom_role TEXT DEFAULT NULL,
  p_participant_category TEXT DEFAULT NULL,
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

  -- B. Bloqueio pessimista da linha da conferência (impede race condition de vagas)
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

  -- F. Inserção persistente com novos campos email e custom_role
  INSERT INTO public.registrations (
    conference_id,
    idempotency_key,
    registration_code,
    full_name,
    sex,
    phone,
    email,
    organization_id,
    local_church,
    ecclesiastical_district,
    municipality,
    organizational_role,
    custom_role,
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
    NULLIF(lower(trim(p_email)), ''),
    p_organization_id,
    trim(p_local_church),
    trim(p_ecclesiastical_district),
    trim(p_municipality),
    trim(p_organizational_role),
    CASE WHEN trim(p_organizational_role) = 'Outro' THEN NULLIF(trim(p_custom_role), '') ELSE NULL END,
    trim(p_participant_category),
    NULLIF(trim(p_delegation_responsible), ''),
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

-- Manter permissões da função actualizada com assinatura explícita
REVOKE EXECUTE ON FUNCTION public.submit_public_registration(
  UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, UUID
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_public_registration(
  UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, UUID
) TO anon, authenticated;

COMMIT;

-- ==============================================================================
-- ROLLBACK (executar manualmente em caso de necessidade — NÃO corre automaticamente)
-- ==============================================================================
-- BEGIN;
-- ALTER TABLE public.registrations DROP COLUMN IF EXISTS email;
-- ALTER TABLE public.registrations DROP COLUMN IF EXISTS custom_role;
-- DROP INDEX IF EXISTS idx_registrations_email;
-- -- Restaurar a função original a partir do ficheiro 00006_atomic_rpc_functions.sql
-- COMMIT;
