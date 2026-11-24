# PROJECT SPECIFICATION

## Plataforma de Gestão da III Sessão Bienal da Conferência Distrital da Juventude de Luanda

**Versão:** 1.0\
**Estado:** Especificação inicial aprovada para orientar o
desenvolvimento\
**Data:** 23 de novembro de 2026\
**Idioma da aplicação:** Português\
**Fuso horário operacional:** Africa/Luanda\
**Capacidade prevista:** 500 participantes

------------------------------------------------------------------------

## 1. Objetivo do documento

Este documento define o âmbito funcional, os requisitos técnicos, a
arquitetura, as regras de negócio, o modelo de dados, os requisitos de
segurança e os critérios de aceitação da nova plataforma da III Sessão
Bienal da Conferência Distrital da Juventude de Luanda.

É a referência principal para o desenvolvimento assistido por IA no
Google Antigravity. O agente de programação deve consultar este
documento antes de implementar ou alterar funcionalidades.

A plataforma é uma reconstrução completa do sistema anterior. Deve
preservar os processos essenciais de inscrição, gestão administrativa,
credenciamento e controlo de presenças, corrigindo fragilidades e
organizando a solução para permitir reutilização em futuras
conferências.

## 2. Visão do produto

Construir uma aplicação web responsiva, em português, para gerir o ciclo
de participação na Conferência, desde a inscrição até ao registo de
presença em cada sessão.

A aplicação terá: 1. Área pública de inscrição. 2. Área administrativa
autenticada. 3. Gestão e validação de inscrições/delegados. 4.
Credenciamento presencial por pesquisa manual. 5. Gestão de sessões e
registo de presenças por sessão. 6. Relatórios e exportação de dados. 7.
Registo de operações administrativas relevantes.

### 2.1 Princípios do produto

-   Simplicidade operacional: não construir um sistema excessivamente
    complexo.
-   Persistência: os dados devem permanecer na base de dados
    independentemente de atualizações do frontend ou de novos
    deployments.
-   Segurança por defeito: cada utilizador só pode executar operações
    autorizadas.
-   Integridade: impedir duplicações e inconsistências através de
    validações no servidor e restrições na base de dados.
-   Rastreabilidade: operações administrativas relevantes devem deixar
    histórico.
-   Reutilização: permitir criar futuras conferências sem misturar os
    dados dos eventos.
-   Responsividade: funcionamento em computadores, tablets e telemóveis.
-   Acessibilidade: formulários claros, legíveis, navegáveis e com
    mensagens de erro compreensíveis.

## 3. Decisões de âmbito confirmadas

  -----------------------------------------------------------------------
  Decisão                             Definição
  ----------------------------------- -----------------------------------
  Evento                              III Sessão Bienal da Conferência
                                      Distrital da Juventude de Luanda

  Capacidade                          500 participantes

  Controlo de presenças               Por sessão/dia

  Credenciamento                      Pesquisa manual, sem QR Code

  Página inicial                      Abre diretamente o formulário
                                      público de inscrição

  Acesso administrativo               Link/botão separado para login

  Administradores                     Vários utilizadores, com permissões
                                      por função

  Persistência                        Supabase PostgreSQL

  Framework                           Next.js com TypeScript

  Estilização                         Tailwind CSS

  Repositório                         GitHub, gerido também pelo GitHub
                                      Desktop

  Hospedagem                          Vercel
  -----------------------------------------------------------------------

### 3.1 Exclusões explícitas da primeira versão

-   Não implementar QR Code nem leitura de QR Code.
-   Não implementar pagamentos online.
-   Não implementar aplicação móvel nativa.
-   Não implementar envio automático de SMS ou WhatsApp como requisito
    obrigatório.
-   Não criar backend próprio separado: utilizar Supabase e
    funcionalidades server-side do Next.js quando necessário.
-   Não criar funcionalidades não aprovadas que aumentem
    desnecessariamente a complexidade.

A arquitetura pode permitir evolução futura, mas funcionalidades
excluídas não devem ser desenvolvidas nesta versão.

## 4. Perfis de utilizador e permissões

A aplicação distingue participantes públicos e utilizadores
administrativos.

### 4.1 Participante público

Pode: - Aceder ao formulário. - Preencher e submeter uma inscrição. -
Receber uma confirmação e um código de inscrição. - Consultar instruções
apresentadas após a submissão.

Não pode: - Consultar a lista de participantes. - Aceder ao painel
administrativo. - Consultar ou alterar inscrições de terceiros.

### 4.2 Perfis administrativos

Implementar controlo de acesso baseado em funções (RBAC).

  -----------------------------------------------------------------------
  Perfil                              Permissões principais
  ----------------------------------- -----------------------------------
  Superadministrador                  Acesso total, configuração,
                                      utilizadores e permissões

  Administrador de inscrições         Consultar, criar quando autorizado,
                                      editar e gerir inscrições

  Validador                           Rever e aprovar/rejeitar inscrições

  Credenciamento                      Consultar participantes elegíveis e
                                      registar credenciamento

  Operador de presenças               Gerir sessões e registar presenças

  Consultor                           Acesso de leitura a dados e
                                      relatórios autorizados
  -----------------------------------------------------------------------

Um utilizador pode acumular mais de uma função, caso o
Superadministrador assim o configure. A aplicação deve verificar
permissões no servidor e na base de dados; esconder botões no frontend
não é uma medida de segurança suficiente.

### 4.3 Gestão de utilizadores

-   Login por e-mail e palavra-passe através do Supabase Auth.
-   Criação de utilizadores administrativos controlada pelo
    Superadministrador.
-   Não permitir registo público de administradores.
-   Possibilidade de desativar um perfil sem apagar o histórico.
-   Recuperação de palavra-passe através dos mecanismos suportados pelo
    Supabase Auth.
-   Registar alterações de função e estado de utilizadores em auditoria.

## 5. Navegação e rotas

### 5.1 Área pública

  -----------------------------------------------------------------------
  Rota                                Conteúdo
  ----------------------------------- -----------------------------------
  `/`                                 Formulário público de inscrição

  `/inscricao/sucesso`                Confirmação da inscrição e código,
                                      sem expor dados sensíveis
  -----------------------------------------------------------------------

A rota `/` deve abrir diretamente o formulário de inscrição. Deve
existir um link discreto e separado para acesso administrativo.

### 5.2 Área administrativa

  -----------------------------------------------------------------------
  Rota                                Conteúdo
  ----------------------------------- -----------------------------------
  `/admin/login`                      Autenticação

  `/admin/dashboard`                  Painel geral

  `/admin/inscricoes`                 Listagem e gestão de inscrições

  `/admin/inscricoes/[id]`            Detalhe de uma inscrição

  `/admin/organizacoes`               Gestão de organizações

  `/admin/sessoes`                    Gestão de sessões

  `/admin/credenciamento`             Pesquisa e registo de
                                      credenciamento

  `/admin/presencas`                  Registo e consulta de presenças

  `/admin/relatorios`                 Estatísticas e exportações

  `/admin/utilizadores`               Gestão de utilizadores, apenas para
                                      Superadministrador

  `/admin/configuracoes`              Configurações do evento, apenas
                                      para perfis autorizados

  `/admin/auditoria`                  Histórico de operações, apenas para
                                      perfis autorizados
  -----------------------------------------------------------------------

Todas as rotas administrativas devem exigir sessão válida e autorização
adequada. Redirecionar utilizadores não autenticados para
`/admin/login`.

## 6. Módulo de inscrições

### 6.1 Objetivo

Recolher os dados dos participantes e criar um registo persistente
associado à conferência selecionada.

### 6.2 Formulário inicial

Os campos abaixo constituem a estrutura inicial. As listas de opções
institucionais devem ser confirmadas pela organização antes da abertura
pública.

  Campo                       Tipo                          Obrigatório
  --------------------------- ----------------------------- -------------
  Nome completo               Texto                         Sim
  Sexo                        Seleção                       Sim
  Telefone                    Texto com validação           Sim
  Igreja local                Seleção ou texto controlado   Sim
  Distrito eclesiástico       Seleção                       Sim
  Município                   Seleção                       Sim
  Função na organização       Seleção ou texto              Sim
  Categoria de participação   Seleção                       Sim
  Responsável da delegação    Texto, conforme categoria     Condicional

Não inventar categorias, municípios, distritos, funções ou organizações.
Criar listas de opções administráveis ou importar listas oficiais
fornecidas pela organização. Até à confirmação dessas listas, usar
opções de configuração claramente identificadas como provisórias.

### 6.3 Regras de validação

-   Remover espaços desnecessários no início e fim dos textos.
-   Validar campos obrigatórios no cliente e novamente no servidor.
-   Validar formato e comprimento do telefone sem assumir um único
    formato internacional.
-   Limitar o tamanho dos campos de texto.
-   Normalizar valores usados em pesquisa e deteção de duplicados.
-   Mostrar mensagens de validação junto dos campos.
-   Desativar submissões repetidas enquanto o pedido estiver em
    processamento.
-   Nunca confiar apenas na validação do navegador.

### 6.4 Código de inscrição

-   Gerar um código único, legível e não sequencialmente previsível.
-   O código deve ser único na base de dados.
-   Não usar o ID interno sequencial como código público.
-   Apresentar o código após submissão bem-sucedida.
-   Permitir que o código seja usado na pesquisa administrativa e no
    credenciamento.
-   Não expor dados pessoais através do código.

### 6.5 Duplicações

Não rejeitar automaticamente duas pessoas apenas por partilharem o mesmo
número de telefone.

Implementar deteção de possíveis duplicados usando combinação
normalizada de nome, telefone e conferência, com revisão administrativa
quando houver suspeita. A regra final de unicidade deve evitar falsos
positivos e não impedir inscrições legítimas de familiares que utilizem
o mesmo contacto.

A criação deve ser protegida contra submissões repetidas e concorrentes.
Utilizar uma chave de idempotência ou mecanismo equivalente no servidor,
quando aplicável.

### 6.6 Capacidade

-   Capacidade inicial configurada em 500 participantes.
-   A contagem deve ser verificada no servidor/base de dados, nunca
    apenas no frontend.
-   A reserva de vaga deve ser atómica para evitar ultrapassar a
    capacidade com submissões simultâneas.
-   Definir claramente quais estados ocupam vaga. Regra inicial:
    inscrições submetidas e ainda ativas ocupam vaga até aprovação,
    rejeição ou cancelamento; rejeitadas/canceladas não ocupam.
-   Quando a capacidade for atingida, bloquear novas submissões e
    apresentar mensagem informativa.
-   O Superadministrador pode ajustar a capacidade com registo em
    auditoria.
-   Não eliminar inscrições para libertar vagas; alterar o respetivo
    estado.

### 6.7 Estados da inscrição

-   `pending`: submetida, aguardando validação.
-   `approved`: aprovada.
-   `rejected`: rejeitada.
-   `cancelled`: cancelada, quando necessário.

Guardar datas e utilizador responsável pelas decisões administrativas.
Uma alteração de estado deve registar motivo quando aplicável.

### 6.8 Confirmação

Após submissão válida: - Apresentar mensagem de sucesso. - Apresentar
código único. - Apresentar instruções sobre como guardar o código. - Não
apresentar informação privada de outros participantes. - Não afirmar que
a inscrição está aprovada; a confirmação de receção é diferente da
aprovação administrativa.

## 7. Módulo de gestão administrativa

### 7.1 Dashboard

Apresentar indicadores calculados a partir dos dados persistidos: -
Total de inscrições. - Inscrições pendentes. - Inscrições aprovadas. -
Inscrições rejeitadas/canceladas. - Participantes credenciados. -
Participantes ainda não credenciados. - Total de presenças por sessão. -
Capacidade utilizada e vagas restantes.

Os indicadores devem respeitar o âmbito da conferência e as permissões
do utilizador.

### 7.2 Listagem e pesquisa

Permitir: - Pesquisa por nome. - Pesquisa por código de inscrição. -
Pesquisa por telefone, limitada a utilizadores autorizados. - Filtro por
distrito eclesiástico. - Filtro por município. - Filtro por igreja
local/organização. - Filtro por categoria. - Filtro por estado da
inscrição. - Filtro por estado de credenciamento. - Ordenação por data
de inscrição e nome. - Paginação no servidor.

Não carregar todos os registos de uma só vez. Aplicar paginação e
filtros na consulta ao Supabase.

### 7.3 Detalhe do participante

Exibir os dados necessários para a função administrativa autorizada: -
Dados de inscrição. - Código de inscrição. - Conferência associada. -
Estado e histórico de validação. - Estado de credenciamento. - Presenças
por sessão. - Datas de criação e atualização.

### 7.4 Operações administrativas

-   Aprovar e rejeitar inscrições.
-   Editar dados mediante permissão.
-   Cancelar inscrição quando justificado.
-   Consultar histórico.
-   Registar motivo para operações sensíveis.
-   Impedir alterações silenciosas de dados críticos.

### 7.5 Exportação

Permitir exportar dados em CSV e Excel (.xlsx), de acordo com os filtros
aplicados e permissões.

Requisitos: - Exportar os dados guardados no Supabase, não apenas os
registos atualmente visíveis no navegador. - Incluir apenas colunas
autorizadas. - Aplicar filtros selecionados. - Indicar data/hora da
exportação e conferência. - Tratar corretamente caracteres portugueses e
codificação UTF-8. - Proteger contra CSV/Excel formula injection:
neutralizar células iniciadas por `=`, `+`, `-` ou `@` quando
provenientes de texto não confiável. - Não expor campos internos ou
dados sensíveis desnecessários.

## 8. Módulo de credenciamento

### 8.1 Objetivo

Registar que um participante elegível se apresentou fisicamente e foi
credenciado para a Conferência.

### 8.2 Método

**Pesquisa manual, sem QR Code.**

Critérios de pesquisa: - Código de inscrição. - Nome completo. -
Telefone, apenas para utilizadores autorizados.

A pesquisa deve apresentar resultados suficientes para confirmar a
identidade sem expor dados desnecessários.

### 8.3 Regras

-   Apenas participantes com inscrição aprovada podem ser credenciados,
    salvo exceção autorizada e auditada pelo Superadministrador.
-   Confirmar a identidade antes de concluir.
-   Um participante só pode ter um credenciamento ativo por conferência.
-   Se já estiver credenciado, apresentar o estado existente e impedir
    duplicação.
-   Guardar data/hora, utilizador operador e observação opcional.
-   Permitir correção/cancelamento apenas a perfis autorizados, com
    motivo e auditoria.
-   Não confundir inscrição aprovada com credenciamento concluído.

### 8.4 Estados

-   `not_credentialed`: ainda não credenciado.
-   `credentialed`: credenciamento concluído.
-   `revoked`: credenciamento revogado por operação autorizada.

## 9. Módulo de controlo de presenças

### 9.1 Objetivo

Registar a presença individual em cada sessão ou dia da Conferência.

### 9.2 Gestão de sessões

Criar uma tabela e interface administrativa para gerir sessões: - Nome
da sessão. - Descrição opcional. - Data. - Hora de início e fim, quando
aplicável. - Estado: planeada, aberta, encerrada ou cancelada. - Ordem
de apresentação.

As sessões devem ser criadas e editadas por perfis autorizados. Não
inventar o calendário da Conferência: datas e horários serão
introduzidos pela organização.

### 9.3 Registo de presença

-   Pesquisar participante por código, nome ou telefone autorizado.
-   Selecionar a sessão aberta.
-   Confirmar identidade.
-   Registar presença com data/hora e operador.
-   Impedir duas presenças ativas do mesmo participante na mesma sessão.
-   Permitir correção ou anulação por utilizador autorizado, sempre com
    motivo e auditoria.
-   Não permitir presença em sessão cancelada.
-   Definir se apenas participantes credenciados podem ter presença
    registada; regra inicial: sim.
-   Se a sessão estiver encerrada, apenas Superadministrador ou perfil
    expressamente autorizado poderá corrigir registos, com auditoria.

### 9.4 Relatórios de presença

-   Total de presentes por sessão.
-   Lista nominal de presentes.
-   Lista de participantes sem presença na sessão.
-   Percentagem de assiduidade.
-   Comparação entre sessões.
-   Exportação CSV/Excel.
-   Filtros por distrito, município, organização e categoria, conforme
    permissões.

A presença numa sessão não deve alterar automaticamente o estado de
presença noutra sessão.

## 10. Modelo de dados --- Supabase PostgreSQL

Usar PostgreSQL relacional com chaves estrangeiras, restrições, índices
e migrações versionadas.

### 10.1 Tabelas principais

#### `conferences`

-   `id`: UUID, chave primária.
-   `name`: nome oficial.
-   `slug`: identificador único.
-   `description`: texto opcional.
-   `capacity`: inteiro positivo, inicial 500.
-   `registration_open`: boolean.
-   `start_date`, `end_date`: datas opcionais até confirmação.
-   `timezone`: inicial `Africa/Luanda`.
-   `created_at`, `updated_at`.

#### `organizations`

-   `id`: UUID.
-   `name`: nome da organização/igreja local.
-   `municipality`: município.
-   `ecclesiastical_district`: distrito eclesiástico.
-   `is_active`: boolean.
-   `created_at`, `updated_at`.

Evitar duplicar nomes de organizações; aplicar normalização e validação
administrativa.

#### `registrations`

-   `id`: UUID.
-   `conference_id`: FK para `conferences`.
-   `registration_code`: código público único.
-   `full_name`.
-   `sex`.
-   `phone`.
-   `organization_id`: FK opcional para `organizations`.
-   `local_church`: texto ou referência à organização, conforme modelo
    final.
-   `ecclesiastical_district`.
-   `municipality`.
-   `organizational_role`.
-   `participant_category`.
-   `delegation_responsible`: texto opcional/condicional.
-   `status`: enum ou texto com CHECK.
-   `submitted_at`.
-   `reviewed_at`.
-   `reviewed_by`: FK para `admin_profiles`.
-   `review_reason`.
-   `created_at`, `updated_at`.

A estrutura definitiva deve evitar duplicar informação que possa ser
obtida por relacionamento. Se município/distrito forem guardados como
fotografia histórica da inscrição, documentar essa decisão.

#### `admin_profiles`

-   `id`: UUID associado ao `auth.users.id`.
-   `display_name`.
-   `email` ou referência controlada ao e-mail do Auth, sem duplicação
    desnecessária.
-   `is_active`.
-   `created_at`, `updated_at`.

#### `admin_roles`

-   `id`: UUID.
-   `name`: função administrativa única.
-   `description`.

#### `admin_user_roles`

-   `user_id`: FK para `admin_profiles`.
-   `role_id`: FK para `admin_roles`.
-   Chave única composta (`user_id`, `role_id`).

#### `accreditations`

-   `id`: UUID.
-   `conference_id`: FK.
-   `registration_id`: FK.
-   `status`: `credentialed` ou `revoked`.
-   `credentialed_at`.
-   `credentialed_by`.
-   `revoked_at`.
-   `revoked_by`.
-   `reason`.
-   `created_at`, `updated_at`.

Criar restrição para impedir mais de um credenciamento ativo por
participante e conferência.

#### `sessions`

-   `id`: UUID.
-   `conference_id`: FK.
-   `name`.
-   `description`.
-   `session_date`.
-   `starts_at`, `ends_at`.
-   `status`: planeada, aberta, encerrada ou cancelada.
-   `sort_order`.
-   `created_at`, `updated_at`.

#### `attendance_records`

-   `id`: UUID.
-   `session_id`: FK.
-   `registration_id`: FK.
-   `status`: presente ou anulado.
-   `recorded_at`.
-   `recorded_by`.
-   `voided_at`.
-   `voided_by`.
-   `reason`.
-   `created_at`, `updated_at`.

Criar restrição única que impeça mais de um registo de presença ativo
por participante e sessão. A estratégia de anulação deve permitir
preservar o histórico.

#### `audit_logs`

-   `id`: UUID.
-   `actor_user_id`: utilizador administrativo.
-   `conference_id`: FK opcional.
-   `action`: ação executada.
-   `entity_type`: tipo de registo.
-   `entity_id`: UUID ou identificador textual.
-   `before_data`: JSONB, quando necessário.
-   `after_data`: JSONB, quando necessário.
-   `reason`: motivo opcional/obrigatório conforme operação.
-   `created_at`.

Não armazenar palavras-passe, tokens, chaves secretas ou dados sensíveis
desnecessários nos logs.

#### `event_settings`

-   `id`: UUID.
-   `conference_id`: FK única.
-   `setting_key`.
-   `setting_value`: JSONB.
-   `updated_by`.
-   `updated_at`.

Usar apenas para configurações justificadas. Não transformar todas as
regras de negócio em configurações genéricas.

### 10.2 Integridade e índices

Criar: - Índices nas FKs. - Índice único em `conferences.slug`. - Índice
único em `registrations.registration_code`. - Índices para pesquisa
normalizada de nome e telefone, conforme volume e estratégia de
pesquisa. - Índices em `registrations.conference_id`, `status`,
`submitted_at`. - Índices em `sessions.conference_id`, `session_date`,
`status`. - Índices em `attendance_records.session_id`,
`registration_id`. - Restrições CHECK para estados e valores
positivos. - Restrições únicas para impedir duplicações ativas de
credenciamento e presença.

Usar transações ou funções PostgreSQL/RPC para operações que exigem
várias alterações atómicas, nomeadamente: - Verificação de capacidade e
criação de inscrição. - Alteração de estado e respetivo histórico. -
Credenciamento. - Registo de presença.

Não depender de uma sequência de pedidos independentes no frontend para
operações que precisam de atomicidade.

## 11. Segurança e políticas RLS

A segurança deve ser concebida antes de abrir o formulário ao público.

### 11.1 Regras gerais

-   Ativar RLS em todas as tabelas expostas pela API do Supabase.
-   Negar acesso por defeito.
-   Criar políticas explícitas por tabela e operação.
-   Usar Supabase Auth para administradores.
-   Verificar funções e estado ativo do perfil no servidor e nas
    políticas.
-   Nunca colocar `service_role` no browser, repositório ou variáveis
    `NEXT_PUBLIC_*`.
-   A chave pública/anon ou publishable pode ser usada no cliente apenas
    com RLS corretamente configurado.
-   Segredos devem ficar em variáveis de ambiente server-side.
-   Não confiar em `user_id`, função ou permissões enviados pelo
    cliente.

### 11.2 Acesso público às inscrições

A submissão pública deve passar por endpoint server-side ou função RPC
cuidadosamente protegida.

A operação pública só pode: - Validar os campos permitidos. - Confirmar
que a conferência está aberta. - Verificar capacidade de forma
atómica. - Criar a inscrição com estado inicial `pending`. - Gerar o
código no servidor. - Devolver apenas confirmação e código.

Não permitir que o cliente público escolha `status`, `reviewed_by`,
`credentialed_at`, `recorded_by` ou outros campos administrativos.

Não permitir leitura pública da tabela completa de inscrições. A
confirmação pública não deve revelar dados pessoais de terceiros.

### 11.3 Acesso administrativo

-   Consultas e mutações dependem de autenticação e função autorizada.
-   Consultor tem leitura limitada.
-   Operadores só executam operações dos respetivos módulos.
-   Superadministrador gere utilizadores e configurações.
-   Desativar perfil deve impedir novas operações.
-   Proteger operações sensíveis também no servidor, não apenas através
    da interface.

### 11.4 Auditoria

Registar: - Aprovação/rejeição/cancelamento. - Edição de dados
críticos. - Credenciamento e revogação. - Registo e anulação de
presença. - Alteração de capacidade e abertura/fecho de inscrições. -
Criação/desativação de administradores e alteração de funções.

O utilizador comum não pode editar ou apagar logs.

## 12. Arquitetura da aplicação

### 12.1 Stack

-   Next.js (App Router).
-   React.
-   TypeScript com `strict: true`.
-   Tailwind CSS.
-   Supabase PostgreSQL.
-   Supabase Auth.
-   Supabase SSR para integração segura com Next.js.
-   Zod para validação de dados.
-   Biblioteca de formulários compatível com React, se necessária.
-   Biblioteca de tabelas apenas se justificar a complexidade.
-   Biblioteca de exportação XLSX para Excel.
-   Git e GitHub.
-   Vercel para deployment.

Usar versões estáveis e compatíveis no momento da instalação. Registar
dependências no `package.json` e não atualizar versões principais sem
avaliar compatibilidade.

### 12.2 Organização sugerida

``` text
conference-platform/
├── public/
├── src/
│   ├── app/
│   │   ├── page.tsx
│   │   ├── inscricao/
│   │   │   └── sucesso/
│   │   ├── admin/
│   │   │   ├── login/
│   │   │   ├── dashboard/
│   │   │   ├── inscricoes/
│   │   │   ├── organizacoes/
│   │   │   ├── sessoes/
│   │   │   ├── credenciamento/
│   │   │   ├── presencas/
│   │   │   ├── relatorios/
│   │   │   ├── utilizadores/
│   │   │   ├── configuracoes/
│   │   │   └── auditoria/
│   │   └── api/
│   ├── components/
│   │   ├── ui/
│   │   ├── forms/
│   │   ├── tables/
│   │   ├── dashboard/
│   │   └── layout/
│   ├── features/
│   │   ├── registrations/
│   │   ├── organizations/
│   │   ├── accreditation/
│   │   ├── attendance/
│   │   ├── sessions/
│   │   └── administration/
│   ├── lib/
│   │   ├── supabase/
│   │   ├── validations/
│   │   ├── permissions/
│   │   └── utils/
│   ├── types/
│   └── config/
├── supabase/
│   ├── migrations/
│   ├── seed.sql
│   └── config.toml
├── tests/
├── .env.example
├── .gitignore
├── PROJECT_SPECIFICATION.md
├── README.md
└── package.json
```

A estrutura é uma referência. O agente pode ajustar nomes e separar
módulos, mas deve preservar a separação entre interface, lógica de
negócio, validação, acesso a dados e permissões.

### 12.3 Regras de implementação

-   Utilizar componentes reutilizáveis.
-   Evitar componentes gigantes com múltiplas responsabilidades.
-   Evitar duplicação de lógica.
-   Utilizar tipos TypeScript gerados a partir do schema Supabase quando
    possível.
-   Centralizar validações com Zod.
-   Separar operações de leitura e escrita.
-   Tratar loading, sucesso, vazio e erro em todas as interfaces de
    dados.
-   Usar paginação no servidor.
-   Não usar dados fictícios em produção.
-   Não deixar botões sem ação.
-   Não ocultar erros de integração.
-   Não utilizar `any` sem justificação documentada.
-   Não introduzir bibliotecas sem necessidade.
-   Não reescrever ficheiros ou módulos fora do escopo de uma tarefa sem
    explicar o motivo.

## 13. Design e experiência de utilização

A interface deve transmitir identidade institucional, organização e
confiança.

Requisitos: - Visual moderno, limpo e profissional. - Hierarquia visual
clara. - Pouco ruído visual. - Formulários simples e objetivos. -
Dashboard com indicadores compreensíveis. - Tabelas legíveis e
adaptáveis. - Boa experiência em telemóveis e tablets. - Estados visuais
claros para pendente, aprovado, rejeitado, credenciado e presente. -
Confirmação antes de operações destrutivas ou sensíveis. - Mensagens em
português claro.

A identidade visual definitiva, logótipo, cores oficiais e elementos
gráficos devem ser fornecidos ou aprovados pela organização. Não
inventar logótipos institucionais.

## 14. Variáveis de ambiente

Criar `.env.example` com nomes de variáveis, sem valores reais:

``` env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=
```

Se o projeto utilizar a nova chave publishable do Supabase, adaptar o
nome da variável e a configuração. A chave privilegiada só pode ser
utilizada em código server-side estritamente necessário e nunca exposta
ao cliente.

Regras: - `.env.local` no `.gitignore`. - Não colocar credenciais em
commits. - Configurar variáveis equivalentes na Vercel. - Separar
ambientes de desenvolvimento e produção. - Não copiar dados reais de
participantes para ambientes de teste sem autorização e proteção
adequada.

## 15. Migrações, persistência e atualizações

A base de dados é independente do deployment do frontend.

-   Todas as alterações ao schema devem ser feitas por migrações SQL
    versionadas em `supabase/migrations/`.
-   Não recriar tabelas nem apagar dados para publicar novas versões.
-   Não utilizar `DROP TABLE`, `TRUNCATE` ou reset da base de dados em
    produção.
-   Alterações destrutivas exigem aprovação explícita, plano de migração
    e cópia de segurança verificada.
-   Novas colunas devem ser introduzidas de forma compatível sempre que
    possível.
-   Testar migrações num ambiente de desenvolvimento antes de produção.
-   Documentar como aplicar e reverter alterações quando tecnicamente
    possível.
-   Deployment do frontend não deve executar operações destrutivas na
    base de dados.

O projeto deve incluir instruções de exportação/backup e recuperação
operacional. Confirmar as opções de backup disponíveis no plano Supabase
utilizado; não presumir que o plano gratuito oferece backups
automáticos.

## 16. Testes e critérios de aceitação

### 16.1 Inscrições

-   [ ] O formulário abre diretamente em `/`.
-   [ ] Campos obrigatórios são validados.
-   [ ] Inscrição válida é persistida no Supabase.
-   [ ] É gerado um código único.
-   [ ] A confirmação não expõe dados de terceiros.
-   [ ] Submissões repetidas não criam duplicações indevidas.
-   [ ] Dois pedidos simultâneos não ultrapassam a capacidade.
-   [ ] Ao atingir 500 inscrições ativas, novas submissões são
    bloqueadas.
-   [ ] Inscrição rejeitada/cancelada liberta vaga segundo a regra
    definida.

### 16.2 Administração

-   [ ] Rotas administrativas exigem autenticação.
-   [ ] Utilizador sem permissão não executa ações protegidas.
-   [ ] Diferentes perfis têm permissões distintas.
-   [ ] Pesquisa e filtros funcionam no servidor.
-   [ ] Paginação funciona.
-   [ ] Edições são persistidas.
-   [ ] Operações sensíveis geram auditoria.
-   [ ] Exportação inclui todos os resultados correspondentes aos
    filtros, não apenas a página visível.

### 16.3 Credenciamento

-   [ ] Pesquisa por nome e código funciona.
-   [ ] Telefone só é apresentado a perfis autorizados.
-   [ ] Apenas inscrições aprovadas podem ser credenciadas, salvo
    exceção autorizada.
-   [ ] Credenciamento duplicado é bloqueado.
-   [ ] Data/hora e operador são registados.
-   [ ] Revogação exige permissão e motivo.

### 16.4 Presenças

-   [ ] Administrador autorizado consegue criar sessões.
-   [ ] Presença só pode ser registada em sessão válida/aberta.
-   [ ] Participante deve estar credenciado.
-   [ ] Não é possível duplicar presença ativa na mesma sessão.
-   [ ] Presenças de sessões diferentes são independentes.
-   [ ] Correções ficam auditadas.
-   [ ] Relatórios por sessão refletem os dados persistidos.

### 16.5 Segurança e persistência

-   [ ] RLS está ativa em todas as tabelas expostas.
-   [ ] Utilizador público não consegue ler a lista de inscrições.
-   [ ] Chave `service_role` não aparece no bundle do browser.
-   [ ] Utilizador desativado perde acesso administrativo.
-   [ ] Atualizar o frontend não apaga inscrições.
-   [ ] Migrações não destrutivas foram testadas.
-   [ ] Testes de permissões cobrem cada perfil.

## 17. Desempenho, disponibilidade e operação

A plataforma é dimensionada inicialmente para 500 participantes, com
vários operadores administrativos a trabalhar simultaneamente.

-   Utilizar paginação e consultas indexadas.
-   Evitar pedidos repetidos desnecessários.
-   Tratar falhas de rede com mensagens e possibilidade de tentar
    novamente.
-   Não confirmar operações até o servidor devolver sucesso.
-   Evitar criar presenças duplicadas em caso de repetição de pedido.
-   Apresentar estado de carregamento e erros recuperáveis.
-   Não guardar dados pessoais em `localStorage` sem necessidade.
-   Definir procedimento manual de contingência para falhas de Internet:
    listas administrativas exportadas previamente, guardadas de forma
    segura, com reconciliação posterior e prevenção de duplicações. O
    procedimento deve ser validado pela organização.

## 18. Publicação e ambientes

### Desenvolvimento

-   Projeto local no computador.
-   Supabase de desenvolvimento.
-   Dados de teste fictícios.
-   `.env.local` não versionado.

### Repositório

-   GitHub como repositório central.
-   GitHub Desktop para acompanhar alterações.
-   Commits pequenos e descritivos.
-   Não commitar segredos, ficheiros `.env` ou dados pessoais.
-   Proteger a branch principal, quando possível.

### Produção

-   Vercel ligada ao GitHub.
-   Domínio e URL definidos pela organização.
-   Variáveis de ambiente configuradas na Vercel.
-   Supabase de produção separado do ambiente de desenvolvimento.
-   Testes de smoke test após deployment.
-   Confirmar formulário, login, dashboard e operações principais em
    produção.

## 19. Fases de desenvolvimento e entregáveis

### Fase 0 --- Descoberta e confirmação institucional

Entregáveis: - Lista oficial de distritos eclesiásticos. - Lista de
municípios. - Lista de igrejas/organizações locais. - Categorias de
participantes. - Funções elegíveis. - Regras de aprovação e composição
das delegações. - Logótipo e identidade visual. - Datas, horários e
sessões da Conferência. - Responsáveis autorizados e respetivas funções.

Não inventar dados institucionais em falta. Marcar como pendentes de
confirmação.

### Fase 1 --- Fundação do projeto

-   Criar Next.js e TypeScript.
-   Configurar Tailwind.
-   Criar estrutura de pastas.
-   Configurar linting e formatação.
-   Configurar Supabase SSR.
-   Criar README e `.env.example`.

### Fase 2 --- Base de dados e segurança

-   Criar migrações.
-   Criar tabelas e relações.
-   Configurar índices e restrições.
-   Criar perfis e funções.
-   Configurar RLS.
-   Implementar operações transacionais necessárias.
-   Testar permissões.

### Fase 3 --- Inscrições

-   Construir formulário público.
-   Validar campos.
-   Implementar código único.
-   Implementar controlo de capacidade.
-   Implementar prevenção de duplicações.
-   Persistir e confirmar inscrições.

### Fase 4 --- Administração

-   Login e proteção de rotas.
-   Dashboard.
-   Gestão de inscrições.
-   Aprovação/rejeição.
-   Organizações.
-   Utilizadores e funções.
-   Auditoria.

### Fase 5 --- Credenciamento

-   Pesquisa manual.
-   Validação de elegibilidade.
-   Registo e consulta.
-   Prevenção de duplicações.
-   Auditoria.

### Fase 6 --- Sessões e presenças

-   Gestão de sessões.
-   Registo de presenças.
-   Correções auditadas.
-   Relatórios por sessão.

### Fase 7 --- Relatórios e exportações

-   CSV.
-   Excel.
-   Filtros.
-   Estatísticas.
-   Proteção de dados exportados.

### Fase 8 --- Testes e publicação

-   Testes funcionais.
-   Testes de segurança.
-   Testes concorrentes de capacidade e duplicação.
-   Testes em dispositivos móveis.
-   Deployment.
-   Validação em produção.
-   Documentação operacional.

## 20. Regras obrigatórias para o agente Antigravity

O agente deve cumprir estas instruções durante todo o desenvolvimento:

1.  Ler integralmente `PROJECT_SPECIFICATION.md` antes de iniciar uma
    tarefa.
2.  Implementar apenas uma fase ou tarefa bem delimitada de cada vez.
3.  Antes de alterar ficheiros existentes, analisar a estrutura e
    compreender o código atual.
4.  Não substituir o projeto inteiro quando uma alteração localizada for
    suficiente.
5.  Não remover funcionalidades existentes sem autorização.
6.  Não criar dados institucionais fictícios como se fossem oficiais.
7.  Não inventar credenciais, chaves ou IDs de projeto Supabase.
8.  Não expor segredos no frontend.
9.  Criar e versionar migrações SQL.
10. Não executar reset, truncamento ou eliminação de dados de produção.
11. Criar testes para regras críticas.
12. Executar verificações TypeScript, lint e build após alterações
    relevantes.
13. Corrigir erros introduzidos antes de declarar a tarefa concluída.
14. Informar ficheiros criados/alterados, decisões técnicas, comandos
    executados, testes e resultados.
15. Identificar claramente qualquer requisito pendente de informação
    institucional.
16. Não afirmar que uma integração funciona sem a testar.
17. Não avançar para a fase seguinte sem validação da fase atual.
18. Preservar este documento como referência; propor alterações ao
    documento antes de implementar mudanças de âmbito.

## 21. Critério global de conclusão

A plataforma será considerada pronta quando:

-   Um participante conseguir inscrever-se e receber um código.
-   A inscrição ficar persistida no Supabase.
-   Administradores autenticados conseguirem gerir e validar inscrições
    segundo as suas permissões.
-   O credenciamento manual funcionar sem duplicações.
-   As sessões puderem ser configuradas.
-   As presenças puderem ser registadas individualmente por sessão.
-   Relatórios e exportações refletirem os dados reais.
-   As operações relevantes ficarem auditadas.
-   As políticas RLS e os testes de autorização forem aprovados.
-   A aplicação estiver publicada e validada em produção.
-   Atualizações do frontend não provocarem perda dos dados existentes.

------------------------------------------------------------------------

# ANEXO A --- Primeira instrução para o Antigravity

Não pedir ao Antigravity para desenvolver a plataforma inteira num único
pedido.

Depois de criar a pasta do projeto e colocar este documento na raiz,
utilizar primeiro a seguinte instrução:

> Analisa integralmente o ficheiro `PROJECT_SPECIFICATION.md`. Nesta
> primeira tarefa, não desenvolvas ainda os módulos funcionais.
>
> Atua como arquiteto de software sénior. Analisa os requisitos,
> identifica dependências, ambiguidades, riscos técnicos e requisitos
> que dependem de confirmação institucional.
>
> Em seguida: 1. Propõe a arquitetura técnica final compatível com a
> especificação. 2. Apresenta a estrutura de pastas recomendada. 3.
> Identifica as decisões que precisam de confirmação antes de
> implementar. 4. Define a sequência de migrações da base de dados. 5.
> Define a estratégia de autenticação, RBAC e RLS. 6. Apresenta um plano
> de testes.
>
> Não inventes informações institucionais. Não alteres o âmbito
> aprovado. Não elimines requisitos. Não cries funcionalidades
> adicionais sem justificação.
>
> Apresenta o resultado para revisão humana antes de começar a
> implementação.

**Importante:** a primeira resposta do Antigravity deve ser uma análise
e proposta técnica, não uma geração automática de toda a aplicação.

------------------------------------------------------------------------

# ANEXO B --- Informações institucionais ainda necessárias

Os seguintes dados devem ser fornecidos pela organização antes da
abertura das inscrições:

-   Nome e lista oficial dos distritos eclesiásticos participantes.
-   Municípios e igrejas locais.
-   Categorias oficiais de participação.
-   Funções e critérios de elegibilidade.
-   Regras de composição e validação das delegações.
-   Identidade visual oficial.
-   Datas e horários da Conferência.
-   Lista e calendário das sessões.
-   Política de tratamento e conservação dos dados pessoais.
-   Lista inicial de administradores e respetivas funções.

Até esses dados serem confirmados, implementar a estrutura técnica sem
preencher opções institucionais fictícias.

------------------------------------------------------------------------

**Fim do documento.**
