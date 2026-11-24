# III Sessão Bienal da Conferência Distrital da Juventude de Luanda

Plataforma web de inscrições, gestão de participantes, validação administrativa, credenciamento e controlo de presenças da III Sessão Bienal da Conferência Distrital da Juventude de Luanda.

---

## 1. Sobre o Projecto

A Plataforma de Inscrições da III Sessão Bienal da Conferência Distrital da Juventude de Luanda é uma aplicação web desenvolvida para digitalizar, centralizar e facilitar o processo de inscrição, validação e gestão dos participantes da Conferência Distrital da Juventude de Luanda.

O sistema foi concebido para simplificar os procedimentos administrativos relacionados com a inscrição de participantes, permitir o acompanhamento das candidaturas, facilitar o credenciamento durante o evento e possibilitar o controlo de presenças nas diferentes sessões da Conferência.

A plataforma procura garantir maior organização, eficiência administrativa, integridade dos dados e facilidade de acesso à informação, reduzindo a dependência de processos manuais e de documentos dispersos.

---

## 2. Objectivos

O projecto tem como principais objectivos:

- Digitalizar o processo de inscrição dos participantes.
- Centralizar os dados dos inscritos numa estrutura organizada.
- Facilitar a análise e validação das inscrições.
- Permitir a aprovação ou rejeição de inscrições pela administração.
- Disponibilizar comprovativos de inscrição em formato PDF.
- Facilitar o credenciamento dos participantes.
- Controlar as presenças dos participantes nas diferentes sessões.
- Disponibilizar informações estatísticas e relatórios administrativos.
- Facilitar a exportação e organização dos dados dos participantes.

---

## 3. Principais Funcionalidades

### 3.1. Sistema Público de Inscrições

Permite que os jovens interessados em participar na Conferência realizem individualmente a sua inscrição através da plataforma web.

Principais funcionalidades:

- Formulário digital de inscrição.
- Registo de informações pessoais e institucionais.
- Identificação da organização juvenil de pertença.
- Validação dos campos obrigatórios.
- Prevenção de inscrições duplicadas.
- Submissão de inscrição para análise administrativa.
- Geração de comprovativo de inscrição em PDF.
- Identificação do estado da inscrição.

### 3.2. Gestão e Validação de Inscrições

Disponibiliza um ambiente administrativo para acompanhamento e gestão das inscrições submetidas.

Principais funcionalidades:

- Visualização de inscrições submetidas.
- Consulta dos dados dos participantes.
- Pesquisa de participantes.
- Filtragem de inscrições.
- Aprovação de inscrições.
- Rejeição de inscrições.
- Acompanhamento do estado de cada inscrição.
- Organização e gestão dos participantes.

### 3.3. Painel Administrativo

O painel administrativo permite centralizar as principais operações de gestão da Conferência.

Principais funcionalidades:

- Visualização de indicadores estatísticos.
- Consulta do total de inscrições.
- Consulta do número de inscrições pendentes.
- Consulta do número de inscrições aprovadas.
- Consulta do número de inscrições rejeitadas.
- Gestão da lista de participantes.
- Acompanhamento do credenciamento.
- Consulta de presenças.
- Exportação de relatórios.

### 3.4. Credenciamento de Participantes

O sistema permite realizar o credenciamento dos participantes previamente aprovados.

Principais funcionalidades:

- Pesquisa manual de participantes.
- Identificação através de informações de registo.
- Confirmação de participação.
- Registo de credenciamento.
- Prevenção de credenciamentos duplicados.
- Consulta do estado de credenciamento.

### 3.5. Controlo de Presenças por Sessão

A plataforma permite acompanhar a presença dos participantes nas diferentes sessões ou actividades da Conferência.

Principais funcionalidades:

- Registo de presença por sessão.
- Consulta de participantes presentes.
- Consulta de participantes ausentes.
- Identificação de participantes credenciados.
- Consulta de histórico de presenças.
- Geração de relatórios de presença.

### 3.6. Relatórios e Exportação de Dados

O sistema disponibiliza mecanismos para organização e consulta dos dados administrativos.

Principais funcionalidades:

- Consulta de estatísticas gerais.
- Relatórios de inscrições.
- Relatórios de participantes aprovados.
- Relatórios de credenciamento.
- Relatórios de presenças por sessão.
- Exportação de dados para utilização administrativa.

---

## 4. Arquitectura do Sistema

A aplicação utiliza uma arquitectura composta por três componentes principais:

- Frontend: Splicação web desenvolvida com Next.js e TypeScript.
- Armazenamento: Supabase, utilizado como estrutura central de armazenamento de dados.

O frontend comunica com o backend através de endpoints controlados pela aplicação. O Google Apps Script é responsável pelo processamento das operações e pela comunicação com as folhas de cálculo.

### Fluxo de funcionamento

1. O utilizador acede à plataforma web.
2. O utilizador preenche e submete o formulário de inscrição.
3. O frontend encaminha a solicitação para a camada de comunicação da aplicação.
4. O backend Google Apps Script valida e processa os dados.
5. Os dados são armazenados no Google Sheets.
6. A plataforma apresenta a resposta ao utilizador.
7. A administração consulta, analisa e processa as inscrições.
8. Os participantes aprovados são posteriormente credenciados.
9. As presenças nas sessões são registadas e disponibilizadas para consulta e relatório.

---

## 5. Autor e Desenvolvimento

Projecto desenvolvido para apoiar a organização, gestão e acompanhamento dos processos administrativos da III Sessão Bienal da Conferência Distrital da Juventude de Luanda, através de uma solução digital integrada.

Valdir Mateus - Vice Coordenador da Comissão de Secretariado
