# Plataforma de Gestão da III Sessão Bienal da Conferência Distrital da Juventude de Luanda 2026

Aplicação web institucional de alta fidelidade para gestão do ciclo integral de participação na **III Sessão Bienal da Conferência Distrital da Juventude de Luanda** (Angola).

Capacidade Oficial: **500 Participantes** | Fuso Horário: `Africa/Luanda` | Idioma: **Português de Angola** | Diretriz Estruturante: **Credenciamento 100% Manual por Pesquisa Rápida (SEM QR CODES)**.

---

## 1. Stack Tecnológica

- **Framework Web:** [Next.js 15.1.7](https://nextjs.org/) (App Router, React Server Components, Server Actions)
- **Biblioteca de Interface:** [React 19](https://react.dev/)
- **Linguagem:** [TypeScript 5.7+](https://www.typescriptlang.org/) configurado com `strict: true`
- **Estilização:** [Tailwind CSS 3.4](https://tailwindcss.com/)
- **Backend & Base de Dados:** [Supabase](https://supabase.com/) PostgreSQL + `@supabase/ssr`
- **Validação de Esquemas:** [Zod](https://zod.dev/)
- **Segurança de Dados:** Row Level Security (RLS) estrito, RBAC perimétrico granular, Stored Procedures atómicas (`SECURITY DEFINER`), Bloqueio Pessimista (`FOR UPDATE`) para garantia física de 500 vagas, e Triggers de Imutabilidade Física (`protect_audit_logs`).

---

## 2. Mapa de Rotas e Telas da Aplicação

A plataforma implementa todas as rotas necessárias para a operação:

### Portal Público
- `/` — Página de Boas-vindas e Formulário de Inscrição Pública com proteção honeypot, validação de telefone de Angola (+244) e idempotência UUID.
- `/inscricao/sucesso` — Comprovativo de submissão com código único `CDJ26-XXXXX` e instruções para o delegado.

### Módulo Administrativo e Operacional
- `/admin/login` — Autenticação segura de operadores e administradores com proteção contra enumeração.
- `/admin/dashboard` — Painel executivo com métricas em tempo real (total inscritos, vagas restantes, credenciados, sessões ativas).
- `/admin/inscricoes` — Gestão, filtragem e triagem das candidaturas de delegados.
- `/admin/inscricoes/[id]` — Detalhe do participante, histórico de auditoria e ações de aprovação/rejeição/cancelamento.
- `/admin/credenciamento` — Balcão de atendimento presencial no secretariado (pesquisa instantânea sem QR Code, confirmação em 1 clique e entrega de kits).
- `/admin/sessoes` — Gestão do ciclo de vida das plenárias (criação, abertura, encerramento e cancelamento de sessões).
- `/admin/presencas` — Terminal de controlo de acessos nas portas das salas, registo de presença e monitorização de quórum estatutário em tempo real (Simples >50% e Qualificado ≥66.7%).
- `/admin/organizacoes` — Cadastro e manutenção de congregações, paróquias, distritos e municípios.
- `/admin/relatorios` — Painel analítico de distribuição demográfica e exportações oficiais de dados em CSV.
- `/admin/utilizadores` — Gestão de administradores e atribuição de perfis de segurança RBAC.
- `/admin/auditoria` — Trilha de auditoria imutável com visualizador de diferenciais JSON (`before` vs. `after`).
- `/admin/configuracoes` — Parametrização global do evento, controlo de inscrições e capacidades.

### Endpoints de Exportação Segura
- `/api/export/inscricoes` — Exportação em tempo real da lista de delegados com neutralização de Formula Injection e UTF-8 BOM.
- `/api/export/presencas` — Exportação da lista de presenças nominais por sessão com cálculo de quórum.

---

## 3. Instalação e Configuração

### 3.1 Pré-requisitos
- **Node.js:** versão 20 LTS, 22 LTS ou 26+
- **NPM:** versão 10+
- Instância ou projeto no **Supabase**

### 3.2 Variáveis de Ambiente
Crie o ficheiro `.env.local` na raiz do projeto com as chaves de acesso:

```env
# URL do projeto Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co

# Chave pública anónima (para o browser e submissões públicas)
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-aqui

# Chave privada de serviço (USO ESTRITAMENTE PRIVADO SERVER-SIDE)
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role-aqui

# URL da aplicação
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3.3 Instalação de Dependências
```bash
npm install
```

### 3.4 Desdobramento da Base de Dados
Aplique as migrações SQL localizadas na pasta `supabase/migrations/` diretamente no SQL Editor do seu projeto Supabase, ou execute:
```bash
# Ou via Supabase CLI
supabase db push
```

### 3.5 Criação do Superadministrador Inicial
Para inicializar o primeiro utilizador com privilégios de `super_admin`:
```bash
node scripts/seed-admin.js
```
*Credenciais predefinidas:* `admin@cdjluanda.ao` / `CdjLuanda2026!`

---

## 4. Comandos e Scripts Disponíveis

| Comando | Descrição |
| :--- | :--- |
| `npm run dev` | Inicia o servidor local de desenvolvimento em `http://localhost:3000` |
| `npm run build` | Compilação estrita e otimizada da aplicação Next.js para produção |
| `npm run start` | Inicia o servidor em modo de produção |
| `npm run lint` | Executa a validação de código via ESLint |
| `npm run typecheck` | Verificação estrita de tipagem TypeScript sem emissão de ficheiros |

---

## 5. Suíte de Testes Automatizados e Homologação

A plataforma conta com uma bateria de scripts de testes de alta precisão para validação contínua:

```bash
# 1. Teste Global Ponta a Ponta (E2E) - Ciclo Completo (Fases 1 a 8)
node scripts/test-e2e-full-lifecycle.js

# 2. Teste de Concorrência e Bloqueio Atómico de Capacidade (FOR UPDATE)
node scripts/test-capacity-limit-concurrency.js

# 3. Teste de Imutabilidade da Auditoria e Isolamento de Perfis (RBAC + RLS)
node scripts/test-security-rbac-audit.js

# 4. Teste de Sanitização contra Formula Injection em Planilhas CSV
node scripts/test-export-sanitization.js

# 5. Teste do Fluxo de Balcão e Credenciamento Presencial
node scripts/test-accreditation-flow.js

# 6. Teste de Abertura de Sessões, Presenças e Quórum
node scripts/test-sessions-attendance.js
```

---

## 6. Documentação Operacional e Contingência

Consulte o documento completo:
- [MANUAL_DE_OPERACAO_E_CONTINGENCIA.md](./MANUAL_DE_OPERACAO_E_CONTINGENCIA.md)

Inclui as diretrizes de acolhimento no dia do evento, triagem de credenciamento sem QR Code, cálculo estatutário de quórum, e procedimentos de contingência em caso de quebra de energia elétrica (ENDE) ou conetividade móvel em Luanda.
