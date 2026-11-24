# Manual de Operação e Contingência
## III Sessão Bienal da Conferência Distrital da Juventude de Luanda 2026

**Capacidade Oficial:** 500 Participantes  
**Fuso Horário:** `Africa/Luanda` (WAT, UTC+1)  
**Idioma:** Português de Angola  
**Diretriz Operacional Estruturante:** Credenciamento e Controlo 100% Manual por Pesquisa Rápida (**SEM QR CODES**)

---

## 1. Enquadramento e Perfis de Acesso

A plataforma opera com base num modelo estrito de controlo de acessos baseado em funções (RBAC), garantindo que cada membro da equipa técnica execute apenas as operações autorizadas para o seu posto:

| Perfil de Utilizador | Chave do Sistema | Responsabilidade no Evento |
| :--- | :--- | :--- |
| **Superadministrador** | `super_admin` | Coordenação geral, gestão de operadores, revogação com motivo, parametrizações e auditoria. |
| **Administrador de Inscrições** | `registration_admin` | Triagem de delegados, aprovação, rejeição e reclassificação de participantes. |
| **Validador de Candidaturas** | `validator` | Verificação de conformidade documental e aprovação de inscrições públicas. |
| **Operador de Credenciamento** | `accreditation_operator` | Balcão de receção presencial: pesquisa, entrega de kits e confirmação de crachá. |
| **Operador de Presenças** | `attendance_operator` | Portaria e portas das salas plenárias: registo de entrada e validação de quórum. |
| **Consultor / Auditor** | `consultant` | Visualização de métricas em tempo real e extração de relatórios analíticos. |

---

## 2. Balcão de Credenciamento Presencial (Secretariado)

### 2.1 Diretriz de Pesquisa Rápida (Sem QR Code)
Em conformidade rigorosa com a especificação da Conferência, **não são utilizados códigos QR**. O acolhimento é humanizado e ágil, baseado na pesquisa indexada rápida no sistema.

#### Procedimento Passo a Passo de Acolhimento:
1. **Apresentação do Participante:**
   - O congressista dirige-se a qualquer posto de credenciamento e informa o seu **Código Único de Inscrição** (ex.: `CDJ26-2AXHS`), **Nome Completo** ou **Número de Telefone**.
2. **Localização no Sistema:**
   - O operador acede a `/admin/credenciamento`.
   - Na barra de pesquisa rápida de digitação instantânea, digita os primeiros caracteres do código, nome ou telefone.
   - O sistema filtra os registos em tempo real (< 100ms) graças aos índices `pg_trgm` e `unaccent` em PostgreSQL.
3. **Verificação de Identidade e Kit:**
   - O operador valida a correspondência do nome e organização/congregação com o documento de identificação (Bilhete de Identidade) do delegado.
   - Confirma a entrega física do Kit de Conferência (Crachá oficial, Pasta, Programa dos Trabalhos e Caneta).
4. **Confirmação do Credenciamento:**
   - Clica no botão verde **"Confirmar Credenciamento"**.
   - O sistema efetua a transação atómica via banco de dados, registando o operador que autenticou, timestamp exato de Luanda e gerando o registo de credenciamento.
   - O crachá do participante passa ao estado **Credenciado**.
5. **Prevenção de Duplo Credenciamento:**
   - Caso o botão seja premido novamente ou outro operador pesquise o mesmo delegado, o sistema bloqueia imediatamente com erro `P0008: ALREADY_ACCREDITED`, exibindo o alerta visual: *"Este participante já foi credenciado anteriormente"*.

### 2.2 Procedimento para Casos Especiais no Secretariado
- **Participante com Inscrição Pendente:**
  - O sistema exibe o badge amarelo *"Pendente"*. O operador do balcão não pode credenciar diretamente; reencaminha o participante para a Mesa de Validação ou solicita a um `registration_admin` para aprovar o registo em `/admin/inscricoes`.
- **Participante Rejeitado ou Cancelado:**
  - O participante não está elegível para credenciamento. Deve ser encaminhado à Coordenação Geral.
- **Revogação de Credenciamento por Erro Material:**
  - Apenas utilizadores com perfil `super_admin` possuem permissão para revogar um credenciamento.
  - Para revogar, o Superadmin deve fornecer obrigatoriamente um **motivo detalhado** (ex.: *"Crachá entregue por engano a homónimo; kit recolhido"*).
  - A ação é irreversivelmente gravada na tabela `audit_logs` com os dados anteriores e posteriores.

---

## 3. Gestão de Plenárias e Registo de Presenças

### 3.1 Ciclo de Vida da Sessão
O plenário opera segundo quatro estados estritos:
1. **Agendada (`scheduled`):** A sessão está configurada mas ainda não recebe presenças.
2. **Aberta (`open`):** A sessão está em curso ativo. Os operadores de presença podem registar entradas de participantes credenciados.
3. **Encerrada (`closed`):** Os trabalhos da sessão terminaram. O sistema congela a lista de presenças e bloqueia novos check-ins.
4. **Cancelada (`cancelled`):** A sessão foi anulada pela mesa da presidência.

### 3.2 Registo de Entrada e Controlo de Acesso
1. Os operadores de presença posicionam-se nas portas de acesso da Sala Plenária com computadores portáteis ligados a `/admin/presencas`.
2. Selecionam a **Sessão Ativa** no seletor suspensa.
3. À passagem do delegado, o operador pesquisa pelo código `CDJ26-XXXXX` ou nome.
4. Clica em **"Registar Presença"**. O sistema valida:
   - Se a sessão está aberta (`SESSION_NOT_OPEN`).
   - Se o participante já foi credenciado presencialmente (`NOT_ACCREDITED`).
   - Se já tem presença registada nesta mesma sessão (`ALREADY_RECORDED_PRESENT`).
5. A presença é consolidada de imediato.

### 3.3 Monitorização de Quórum Deliberativo em Tempo Real
A plataforma calcula automaticamente a assiduidade e o quórum com base no universo de **participantes credenciados presencialmente**:
- **Quórum Deliberativo Simples (> 50%):**
  - Exigido para deliberações e votações ordinárias de relatórios e moções correntes.
  - O painel exibe indicador verde quando a presença supera metade dos delegados credenciados.
- **Quórum Qualificado Estatutário (≥ 66.7% / dois terços):**
  - Exigido para eleições dos corpos diretivos, alterações regimentais ou decisões estruturantes distritais.
  - O painel alerta visualmente se o quórum de 2/3 está atingido ou quantos delegados faltam para a abertura dos trabalhos eleitorais.

---

## 4. Exportação Segura de Relatórios e Auditoria

### 4.1 Formato e Compatibilidade Excel
- Todos os ficheiros exportados em `/admin/relatorios` utilizam codificação **UTF-8 com BOM** (`\uFEFF`) e delimitador ponto e vírgula (`;`).
- Esta parametrização garante que o Microsoft Excel em sistemas Windows com definições regionais de Angola e Portugal abra acentuações e caracteres especiais sem desconfiguração.

### 4.2 Neutralização de Formula Injection (CSV Injection)
- Para prevenir a execução maliciosa de comandos no computador da coordenação ao abrir planilhas, qualquer célula cujo conteúdo inicie por `=`, `+`, `-`, `@` ou caracteres de controlo tab/nova linha é automaticamente neutralizada com um apóstrofo prefixado (`'`).

### 4.3 Auditoria Imutável do Sistema
- Todas as operações críticas (aprovação, cancelamento, credenciamento, revogação, anulação de presença, exportação de dados, alteração de parâmetros) são auditadas em `audit_logs`.
- **Garantia Física de Imutabilidade:** A tabela possui o trigger PostgreSQL `protect_audit_logs` que rejeita incondicionalmente qualquer instrução `UPDATE`, `DELETE` ou `TRUNCATE` (mesmo originada por chaves administrativas).

---

## 5. Plano de Contingência para o Dia do Evento (Luanda)

O contexto operacional local em Luanda exige protocolos de contingência testados e documentados para assegurar a continuidade ininterrupta do evento.

### Contingência 1: Queda da Rede Elétrica Pública (ENDE)
* **Cenário:** Interrupção súbita da eletricidade na instalação da conferência.
* **Salvaguarda Imediata (Minuto 0):**
  - Todos os computadores dos operadores de balcão e de portas devem operar em **portáteis com bateria carregada a 100%** (autonomia mínima garantida de 3 horas).
  - É proibido o uso exclusivo de computadores de secretária sem UPS (No-Break).
* **Transição para Gerador (Minuto 1 a 3):**
  - A equipa de logística aciona o grupo gerador alternativo do recinto.
  - O sistema de alojamento cloud no Supabase não sofre qualquer interrupção, pois a base de dados opera em infraestrutura gerida de alta disponibilidade.

---

### Contingência 2: Queda de Internet / Conetividade Móvel
* **Cenário:** Falha de conetividade nas redes móveis Unitel / Africell / Movicel no recinto.
* **Medida Preventiva Obrigatória (Véspera do Evento - D-1):**
  1. Aceder a `/admin/relatorios`.
  2. Gerar a **Exportação Completa de Inscrições Aprovadas**.
  3. Imprimir **3 cópias físicas** da lista oficial encadernada, ordenada alfabeticamente por nome e com indicação clara do código `CDJ26-XXXXX`.
* **Protocolo de Atendimento em Modo Offline / Papel:**
  1. O operador do balcão recorre à pasta de contingência impressa.
  2. Localiza o delegado pelo nome ou código `CDJ26-XXXXX`.
  3. Solicita a assinatura presencial do congressista no campo de receção do kit.
  4. Aponta a hora exata da entrega no caderno de ocorrências do secretariado.
* **Reconciliação Retroativa:**
  - Logo que a conetividade à Internet seja reposta (seja via modem de backup, hotspot alternativo ou restabelecimento de sinal), um operador designado introduz sequencialmente os códigos no sistema `/admin/credenciamento`, regularizando a base de dados em minutos.

---

### Contingência 3: Esgotamento do Limite Estrito de 500 Vagas
* **Cenário:** O sistema atinge os 500 participantes inscritos e bloqueia novas submissões.
* **Mecanismo de Segurança:**
  - O bloqueio atómico PostgreSQL `FOR UPDATE` na função `submit_public_registration` rejeita rigorosamente qualquer 501º registo, prevenindo superlotação da sala.
* **Procedimento de Reatribuição:**
  - Caso delegados confirmados comuniquem desistência por escrito, a Coordenação Geral cancela a vaga desistente no painel `/admin/inscricoes/[id]`.
  - Apenas após a confirmação do cancelamento o sistema liberta o saldo de capacidade para permitir uma nova admissão oficial.

---

### Contingência 4: Suspeita de Fraude ou Erro no Plenário
* **Cenário:** Discrepância na contagem de delegados ou suspeita de crachá utilizado por terceiro.
* **Procedimento de Investigação:**
  1. O Superadmin acede a `/admin/auditoria`.
  2. Filtra pela entidade do participante ou pelo código de registo.
  3. Inspeciona a linha do tempo completa:
     - Quem submeteu a inscrição e a que data/hora.
     - Qual operador aprovou a candidatura.
     - Qual operador confirmou o credenciamento e entregou o crachá físico.
     - Em que sessões plenárias foram registadas presenças.
  4. Confronta a evidência eletrónica inalterável com os registos físicos da comissão organizadora.

---

## 6. Lista de Contactos de Emergência e Suporte Técnico

| Função | Contacto de Rádio / Tel | Função de Plantão |
| :--- | :--- | :--- |
| **Superadministrador do Sistema** | Piquete de TI | Resolução de acessos, revogações e auditoria |
| **Coordenador do Secretariado** | Mesa Central | Despacho de inscrições e triagem de kits |
| **Presidente da Mesa da Conferência** | Sala da Mesa | Abertura/Encerramento de sessões e quórum |
| **Responsável Técnico de Eletricidade** | Piquete Logística | Comutação de geradores e quadros elétricos |
