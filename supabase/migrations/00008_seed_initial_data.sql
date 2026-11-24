-- ==============================================================================
-- Migração 00008: Dados Base Iniciais e Papéis Oficiais
-- Plataforma da III Sessão Bienal da Conferência Distrital da Juventude de Luanda
-- ==============================================================================

-- 1. Criação das Funções Oficiais do RBAC
INSERT INTO public.admin_roles (name, description) VALUES
  ('super_admin', 'Acesso total à plataforma, gestão de utilizadores, configurações de vagas e auditoria'),
  ('registration_admin', 'Gestão, edição e exportação de inscrições e dados organizacionais'),
  ('validator', 'Revisão, aprovação e rejeição fundamentada de inscrições de delegados'),
  ('accreditation_operator', 'Pesquisa manual e confirmação presencial de credenciamento no local'),
  ('attendance_operator', 'Controlo e registo individual de presenças em sessões abertas'),
  ('consultant', 'Acesso de apenas leitura a estatísticas, painéis e relatórios autorizados')
ON CONFLICT (name) DO UPDATE 
SET description = EXCLUDED.description;

-- 2. Criação da Conferência Oficial (Capacidade: 500, Código: CDJ26, Fuso: Africa/Luanda)
INSERT INTO public.conferences (
  name,
  slug,
  capacity,
  registration_open,
  code_prefix,
  timezone,
  description
) VALUES (
  'III Sessão Bienal da Conferência Distrital da Juventude de Luanda',
  'iii-conferencia-distrital-luanda-2026',
  500,
  true,
  'CDJ26',
  'Africa/Luanda',
  'Plataforma oficial da III Sessão Bienal da Conferência Distrital da Juventude de Luanda.'
)
ON CONFLICT (slug) DO NOTHING;

-- 3. Configurações Padrão de Detecção de Duplicados
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
