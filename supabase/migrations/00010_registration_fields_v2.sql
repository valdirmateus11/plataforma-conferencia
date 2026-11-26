-- ==============================================================================
-- Migração 00010: Actualização Abrangente dos Campos de Inscrição (v2)
-- Plataforma da III Sessão Bienal da Conferência Distrital da Juventude de Luanda
--
-- ALTERAÇÕES (NAO DESTRUTIVAS):
--   1. Adiciona coluna `marital_status` (Estado Civil: 'Solteiro' | 'Casado')
--   2. Adiciona coluna `birth_date` (Data de Nascimento, tipo DATE)
--   3. Adiciona coluna `age_group` (Faixa-etária: 'Adolescente' | 'Jovem Regular')
--   4. Adiciona coluna `education_level` (Grau de Escolaridade: 23 opções oficiais)
--   5. Adiciona coluna `member_category` (Categoria de Membro: 'Catecúmeno' | 'À Prova' | 'Efectivo')
--   6. Reutiliza `ecclesiastical_district` (Intendência: LC | VC | TBKK para novas inscrições)
--   7. Reutiliza `local_church` (Cargo Pastoral dependente da Intendência)
--   8. Reutiliza `organizational_role` ('Diretor(a) Local' | 'Delegado(a)' | 'Membro da Direção Distrital')
--   9. Adiciona constraints seguras (permitem NULL para preservar registos históricos)
--  10. Adiciona funções SQL e RPC `submit_public_registration` actualizada com
--      validação rigorosa server-side (idade 11-30, faixa etária automática,
--      cruzamento Intendência <-> Cargo Pastoral, estados/opções válidas).
--
-- ESTRATÉGIA DE PRESERVAÇÃO DE DADOS HISTÓRICOS:
--   - Nenhuma coluna é eliminada.
--   - Nenhum registo existente é apagado ou reescrito.
--   - Registos históricos permanecem legíveis e editáveis (ex.: mudança de status)
--     sem violar constraints na tabela.
-- ==============================================================================

BEGIN;

-- -----------------------------------------------------------------------
-- 1. Adicionar novas colunas (nullable para compatibilidade histórica)
-- -----------------------------------------------------------------------
ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS marital_status TEXT,
  ADD COLUMN IF NOT EXISTS birth_date DATE,
  ADD COLUMN IF NOT EXISTS age_group TEXT,
  ADD COLUMN IF NOT EXISTS education_level TEXT,
  ADD COLUMN IF NOT EXISTS member_category TEXT;

COMMENT ON COLUMN public.registrations.marital_status IS
  'Estado Civil do inscrito: ''Solteiro'' ou ''Casado''. Nullable para compatibilidade histórica.';

COMMENT ON COLUMN public.registrations.birth_date IS
  'Data de Nascimento do inscrito (DATE). Nullable para compatibilidade histórica.';

COMMENT ON COLUMN public.registrations.age_group IS
  'Faixa-etária calculada automaticamente a partir da data de nascimento: ''Adolescente'' (11-17 anos) ou ''Jovem Regular'' (18-30 anos).';

COMMENT ON COLUMN public.registrations.education_level IS
  'Grau de Escolaridade do inscrito (1ª Classe a 13ª Classe, 1º Ano a 6º Ano, Licenciado, Pós-Graduando, Mestrando, Nenhum).';

COMMENT ON COLUMN public.registrations.member_category IS
  'Categoria de Membro eclesiástico: ''Catecúmeno'', ''À Prova'' ou ''Efectivo''.';

COMMENT ON COLUMN public.registrations.ecclesiastical_district IS
  'Intendência Eclesiástica do inscrito. Valores actuais (v2): LC, VC, TBKK. Registos históricos anteriores preservados.';

COMMENT ON COLUMN public.registrations.local_church IS
  'Cargo Pastoral associado à Intendência seleccionada pelo inscrito.';

COMMENT ON COLUMN public.registrations.organizational_role IS
  'Função na Organização. Valores actuais (v2): Diretor(a) Local, Delegado(a), Membro da Direção Distrital. Registos históricos preservados.';

-- -----------------------------------------------------------------------
-- 2. Constraints seguras nas novas colunas (NULL permitido para histórico)
-- -----------------------------------------------------------------------
ALTER TABLE public.registrations
  DROP CONSTRAINT IF EXISTS chk_registrations_marital_status,
  DROP CONSTRAINT IF EXISTS chk_registrations_age_group,
  DROP CONSTRAINT IF EXISTS chk_registrations_education_level,
  DROP CONSTRAINT IF EXISTS chk_registrations_member_category,
  DROP CONSTRAINT IF EXISTS chk_registrations_birth_date_not_future;

ALTER TABLE public.registrations
  ADD CONSTRAINT chk_registrations_marital_status
    CHECK (marital_status IS NULL OR marital_status IN ('Solteiro', 'Casado')),
  ADD CONSTRAINT chk_registrations_age_group
    CHECK (age_group IS NULL OR age_group IN ('Adolescente', 'Jovem Regular')),
  ADD CONSTRAINT chk_registrations_education_level
    CHECK (education_level IS NULL OR education_level IN (
      '1ª Classe', '2ª Classe', '3ª Classe', '4ª Classe', '5ª Classe',
      '6ª Classe', '7ª Classe', '8ª Classe', '9ª Classe', '10ª Classe',
      '11ª Classe', '12ª Classe', '13ª Classe',
      '1º Ano', '2º Ano', '3º Ano', '4º Ano', '5º Ano', '6º Ano',
      'Licenciado', 'Pós-Graduando', 'Mestrando', 'Nenhum'
    )),
  ADD CONSTRAINT chk_registrations_member_category
    CHECK (member_category IS NULL OR member_category IN ('Catecúmeno', 'À Prova', 'Efectivo')),
  ADD CONSTRAINT chk_registrations_birth_date_not_future
    CHECK (birth_date IS NULL OR birth_date <= (now() AT TIME ZONE 'Africa/Luanda')::date);

-- -----------------------------------------------------------------------
-- 3. Índices de consulta e relatórios para os novos campos
-- -----------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_registrations_age_group
  ON public.registrations(conference_id, age_group)
  WHERE age_group IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_registrations_member_category
  ON public.registrations(conference_id, member_category)
  WHERE member_category IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_registrations_marital_status
  ON public.registrations(conference_id, marital_status)
  WHERE marital_status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_registrations_education_level
  ON public.registrations(conference_id, education_level)
  WHERE education_level IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_registrations_birth_date
  ON public.registrations(conference_id, birth_date)
  WHERE birth_date IS NOT NULL;

-- -----------------------------------------------------------------------
-- 4. Função auxiliar SQL: validação cruzada Intendência <-> Cargo Pastoral
-- -----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_valid_pastoral_charge_v2(
  p_intendencia TEXT,
  p_cargo TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF p_intendencia = 'LC' THEN
    RETURN p_cargo = ANY (ARRAY[
      'São Paulo',
      'Ruth',
      'Rev. Sousa Lucas Virgílio',
      'Rev. Joaquim Bernardo',
      'Rev. Jacinto Manuel Culeca',
      'Rev. Eduardo Afonso',
      'Rev. Augusto Magalhães',
      'Nova Jerusalém',
      'Nova Estrela',
      'Magos do Oriente',
      'Moisés',
      'Maria Madalena',
      'Monte das Oliveiras',
      'Júlia Romano',
      'João Baptista',
      'Israel',
      'Galileia',
      'Ester',
      'Emanuel',
      'Central',
      'Catumbela Lima',
      'Catarina Assís',
      'Boa Esperança',
      'Betânia',
      'Sião',
      'Samuel',
      'Bethel',
      'Bernardo Panzo',
      'Belém',
      'Amós',
      'São Tiago',
      'Bispo Emílio de Carvalho',
      'Calemba',
      'Fonte de Água Viva',
      'Icolo e Bengo',
      'João Mateus',
      'Noé',
      'Redentor',
      'Rev. Adão Mateus Miguel',
      'Monte Sinai',
      'Luz',
      'Rev.ª Rita Webba'
    ]);
  ELSIF p_intendencia = 'VC' THEN
    RETURN p_cargo = ANY (ARRAY[
      'Bispo Escrivão Zunguze',
      'Bispo Moisés D. Fernandes',
      'Rev. Gaspar de Almeida',
      'Jerusalém Viana',
      'Rev. Timóteo Baia',
      'Adelino Cosme',
      'Hosana',
      'Rev Alfredo Ganga',
      'Ezequiel',
      'Rev. Francisco Mateus',
      'Filadélfia',
      'Rev. Paulo Ferreira Nicolau',
      'Sofonias',
      'Rev. Jerónimo Domingos',
      'Isaac',
      'Belo Monte',
      'Esperança José',
      'Rev. Ferreira da Silva',
      'Rev. António Jorge',
      'Isaías',
      'Rev. Benjamim Manuel',
      'Santo Estevão',
      'Rev. Luís Correia Kizembe',
      'Job',
      'São Pedro',
      'Nova Jerusalém (Paraíso)',
      'Deus é Amor',
      'Domingos João António'
    ]);
  ELSIF p_intendencia = 'TBKK' THEN
    RETURN p_cargo = ANY (ARRAY[
      'Abel da Silva',
      'Adriano Sebastião',
      'Carlos Kitongo',
      'Conceição Dembo',
      'Ebenezer',
      'Fernando Kibuba',
      'John Wesley',
      'Rev. Paiva João Damião',
      'Rev. Panzo Malundo',
      'Rev. João Luís',
      'Manuel Mendonça',
      'Suzana Wesley',
      'Bispo Moisés D. Fernandes',
      'Deus de Abraão',
      'António Rocha',
      'Arca de Noé',
      'Bispo Gaspar João Domingos',
      'Bispo Ralph Dodge',
      'Canaã',
      'Castro Catungo',
      'Emaús',
      'Josué Sapú',
      'Professora Juliana de Almeida',
      'Rev. Adriano dos Santos',
      'Rev. Bartolomeu Diogo Pascoal',
      'Rev. Frederico Ngongolo',
      'Rev. Jacinto Mutela',
      'Rev. João de Carvalho',
      'Rev. Joaquim Cristiano',
      'Rev. Marcos de Almeida',
      'Josué Capolo 1 e 2',
      'Rev. Ribeiro Calenji'
    ]);
  END IF;

  RETURN false;
END;
$$;

-- -----------------------------------------------------------------------
-- 5. Função auxiliar SQL: cálculo preciso de faixa etária (fuso Africa/Luanda)
-- -----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.calculate_age_group_luanda(p_birth_date DATE)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_today DATE := (now() AT TIME ZONE 'Africa/Luanda')::date;
  v_age INT;
BEGIN
  IF p_birth_date IS NULL THEN
    RAISE EXCEPTION 'INVALID_BIRTH_DATE' USING ERRCODE = 'P0013';
  END IF;

  IF p_birth_date > v_today THEN
    RAISE EXCEPTION 'FUTURE_BIRTH_DATE' USING ERRCODE = 'P0013';
  END IF;

  v_age := date_part('year', age(v_today, p_birth_date))::int;

  IF v_age >= 11 AND v_age <= 17 THEN
    RETURN 'Adolescente';
  ELSIF v_age >= 18 AND v_age <= 30 THEN
    RETURN 'Jovem Regular';
  ELSE
    RAISE EXCEPTION 'AGE_OUT_OF_RANGE' USING ERRCODE = 'P0013';
  END IF;
END;
$$;

-- -----------------------------------------------------------------------
-- 6. Actualizar a Stored Procedure atómica submit_public_registration
--    Substitui a sobrecarga da migração 00009 (14 params -> 19 params)
-- -----------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.submit_public_registration(
  UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, UUID
);

CREATE OR REPLACE FUNCTION public.submit_public_registration(
  p_conference_id UUID,
  p_idempotency_key TEXT,
  p_full_name TEXT,
  p_sex TEXT,
  p_phone TEXT,
  p_email TEXT DEFAULT NULL,
  p_marital_status TEXT DEFAULT NULL,
  p_birth_date DATE DEFAULT NULL,
  p_age_group TEXT DEFAULT NULL,
  p_education_level TEXT DEFAULT NULL,
  p_local_church TEXT DEFAULT NULL,
  p_ecclesiastical_district TEXT DEFAULT NULL,
  p_municipality TEXT DEFAULT NULL,
  p_member_category TEXT DEFAULT NULL,
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
  v_computed_age_group TEXT;
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

  -- B. Validação rigorosa server-side dos campos obrigatórios (anti-bypass)
  IF p_marital_status IS NULL OR trim(p_marital_status) NOT IN ('Solteiro', 'Casado') THEN
    RAISE EXCEPTION 'INVALID_MARITAL_STATUS' USING ERRCODE = 'P0014';
  END IF;

  v_computed_age_group := public.calculate_age_group_luanda(p_birth_date);

  IF p_age_group IS NOT NULL AND trim(p_age_group) <> '' AND trim(p_age_group) <> v_computed_age_group THEN
    RAISE EXCEPTION 'AGE_GROUP_MISMATCH' USING ERRCODE = 'P0014';
  END IF;

  IF p_education_level IS NULL OR trim(p_education_level) NOT IN (
    '1ª Classe', '2ª Classe', '3ª Classe', '4ª Classe', '5ª Classe',
    '6ª Classe', '7ª Classe', '8ª Classe', '9ª Classe', '10ª Classe',
    '11ª Classe', '12ª Classe', '13ª Classe',
    '1º Ano', '2º Ano', '3º Ano', '4º Ano', '5º Ano', '6º Ano',
    'Licenciado', 'Pós-Graduando', 'Mestrando', 'Nenhum'
  ) THEN
    RAISE EXCEPTION 'INVALID_EDUCATION_LEVEL' USING ERRCODE = 'P0014';
  END IF;

  IF p_ecclesiastical_district IS NULL OR trim(p_ecclesiastical_district) NOT IN ('LC', 'VC', 'TBKK') THEN
    RAISE EXCEPTION 'INVALID_INTENDENCIA' USING ERRCODE = 'P0014';
  END IF;

  IF p_local_church IS NULL OR NOT public.is_valid_pastoral_charge_v2(trim(p_ecclesiastical_district), trim(p_local_church)) THEN
    RAISE EXCEPTION 'INVALID_PASTORAL_CHARGE' USING ERRCODE = 'P0014';
  END IF;

  IF p_member_category IS NULL OR trim(p_member_category) NOT IN ('Catecúmeno', 'À Prova', 'Efectivo') THEN
    RAISE EXCEPTION 'INVALID_MEMBER_CATEGORY' USING ERRCODE = 'P0014';
  END IF;

  IF p_organizational_role IS NULL OR trim(p_organizational_role) NOT IN (
    'Diretor(a) Local',
    'Delegado(a)',
    'Membro da Direção Distrital'
  ) THEN
    RAISE EXCEPTION 'INVALID_ORGANIZATIONAL_ROLE' USING ERRCODE = 'P0014';
  END IF;

  IF p_participant_category IS NULL OR trim(p_participant_category) NOT IN (
    'Delegado',
    'Comissão Organizadora',
    'Convidado'
  ) THEN
    RAISE EXCEPTION 'INVALID_PARTICIPANT_CATEGORY' USING ERRCODE = 'P0014';
  END IF;

  IF trim(p_participant_category) = 'Delegado' AND (p_delegation_responsible IS NULL OR trim(p_delegation_responsible) = '') THEN
    RAISE EXCEPTION 'MISSING_DELEGATION_RESPONSIBLE' USING ERRCODE = 'P0014';
  END IF;

  -- C. Bloqueio pessimista da linha da conferência (impede race condition de vagas)
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

  -- D. Verificação atómica de capacidade (apenas pending e approved ocupam vaga)
  SELECT COUNT(*) INTO v_active_count
  FROM public.registrations
  WHERE conference_id = p_conference_id
    AND status IN ('pending', 'approved');

  IF v_active_count >= v_capacity THEN
    RAISE EXCEPTION 'CAPACITY_REACHED' USING ERRCODE = 'P0004';
  END IF;

  -- E. Deteção de suspeita de duplicados (mesmo telefone normalizado em inscrição ativa)
  SELECT id INTO v_dup_id
  FROM public.registrations
  WHERE conference_id = p_conference_id
    AND status IN ('pending', 'approved')
    AND regexp_replace(phone, '\D', '', 'g') = regexp_replace(p_phone, '\D', '', 'g')
  LIMIT 1;

  IF FOUND THEN
    v_is_duplicate := true;
  END IF;

  -- F. Geração de código legível, seguro e não sequencial (sem caracteres ambíguos)
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

  -- G. Inserção persistente com todos os novos campos
  INSERT INTO public.registrations (
    conference_id,
    idempotency_key,
    registration_code,
    full_name,
    sex,
    phone,
    email,
    marital_status,
    birth_date,
    age_group,
    education_level,
    organization_id,
    local_church,
    ecclesiastical_district,
    municipality,
    member_category,
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
    trim(p_marital_status),
    p_birth_date,
    v_computed_age_group,
    trim(p_education_level),
    p_organization_id,
    trim(p_local_church),
    trim(p_ecclesiastical_district),
    trim(p_municipality),
    trim(p_member_category),
    trim(p_organizational_role),
    NULL,
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
    'age_group', v_computed_age_group,
    'is_duplicate_flagged', v_is_duplicate,
    'submitted_at', now()
  );
END;
$$;

-- Permissões explícitas para a nova assinatura (19 parâmetros)
REVOKE EXECUTE ON FUNCTION public.submit_public_registration(
  UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, DATE, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, UUID
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_public_registration(
  UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, DATE, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, UUID
) TO anon, authenticated;

COMMIT;

-- ==============================================================================
-- ROLLBACK (executar manualmente em caso de necessidade — NÃO corre automaticamente)
-- ==============================================================================
-- BEGIN;
-- ALTER TABLE public.registrations
--   DROP CONSTRAINT IF EXISTS chk_registrations_marital_status,
--   DROP CONSTRAINT IF EXISTS chk_registrations_age_group,
--   DROP CONSTRAINT IF EXISTS chk_registrations_education_level,
--   DROP CONSTRAINT IF EXISTS chk_registrations_member_category,
--   DROP CONSTRAINT IF EXISTS chk_registrations_birth_date_not_future;
-- ALTER TABLE public.registrations
--   DROP COLUMN IF EXISTS marital_status,
--   DROP COLUMN IF EXISTS birth_date,
--   DROP COLUMN IF EXISTS age_group,
--   DROP COLUMN IF EXISTS education_level,
--   DROP COLUMN IF EXISTS member_category;
-- DROP FUNCTION IF EXISTS public.is_valid_pastoral_charge_v2(TEXT, TEXT);
-- DROP FUNCTION IF EXISTS public.calculate_age_group_luanda(DATE);
-- -- Restaurar submit_public_registration a partir de 00009_registration_fields_update.sql
-- COMMIT;
