# Documentação Completa do Projeto: Sistema de Agendamento de Quadras (Quadras App)

Esta documentação fornece uma visão exaustiva e detalhada sobre o sistema de agendamento de quadras. Foi elaborada para garantir que terceiros (desenvolvedores, administradores de sistemas e mantenedores) tenham total clareza sobre o funcionamento, estrutura, implantação e manutenção do software a longo prazo.

---

## 1. Arquitetura do Sistema

O projeto adota uma arquitetura monolítica moderna baseada no framework **Next.js (App Router)**, unificando o frontend (cliente) e o backend (API) no mesmo repositório e processo de build. 

### 1.1. Camadas da Arquitetura
- **Frontend (Client-Side & Server-Side Rendering):** Utiliza componentes React, gerenciando a reatividade e a interface do usuário. A arquitetura de App Router permite renderização do lado do servidor (SSR) e geração de sites estáticos (SSG) onde aplicável, otimizando o carregamento inicial e SEO.
- **Backend (API Routes):** As regras de negócio e integrações com o banco de dados estão isoladas em rotas de API dentro de `src/app/api`. Elas agem como microsserviços internos que o frontend consome.
- **Camada de Dados (ORM):** O Prisma atua como a ponte entre o backend em Node.js e o banco de dados PostgreSQL. Ele garante a segurança de tipos (Type Safety) desde o banco de dados até o frontend.
- **Autenticação e Sessão:** Gerenciada pelo NextAuth.js utilizando estratégia de JWT (JSON Web Tokens) guardados em cookies seguros (HttpOnly). A autenticação ocorre de maneira descentralizada (stateless), sem sobrecarregar o banco de dados com sessões ativas.

### 1.2. Estrutura de Diretórios
- `/src/app`: Contém todas as rotas da aplicação (frontend e backend). 
  - `/src/app/api`: Endpoints RESTful para consumo interno e operações de CRUD.
  - `/src/app/admin`: Área restrita com painéis administrativos e relatórios.
  - `/src/app/(rotas de usuario)`: Páginas públicas e de área logada do usuário comum (cadastro, login, reservas, etc).
- `/src/components`: Componentes visuais isolados e reutilizáveis (botões, modais, formulários). Organizados em pastas como `ui` (elementos base) e `layout` (cabeçalhos, rodapés).
- `/src/lib`: Bibliotecas, utilitários, e instâncias globais (cliente do Prisma, configurações de envio de email via nodemailer, funções de formatação de datas).
- `/prisma`: Definição do modelo de dados (`schema.prisma`), arquivos de migração de versão do banco, e scripts de Seed (população de dados fictícios ou iniciais).

---

## 2. Stack de Desenvolvimento (Tecnologias)

O sistema foi construído utilizando as ferramentas mais robustas e modernas do ecossistema JavaScript/TypeScript.

### 2.1. Frontend
- **React (v19) & Next.js (v16.2.5):** Core da aplicação, utilizando o App Router para roteamento, layouts aninhados e Server Components.
- **Tailwind CSS (v4):** Framework de utilitários CSS para estilização rápida, responsiva e consistente.
- **Shadcn UI & Radix UI:** Bibliotecas de componentes de interface não-estilizados (headless), fornecendo acessibilidade (WAI-ARIA) e permitindo alta customização.
- **Lucide React & React Icons:** Pacotes de iconografia vetorial, leves e escaláveis.
- **React Day Picker:** Para renderização e gestão de calendários na interface de agendamento.
- **Sonner:** Para notificações do tipo "toast" no sistema.

### 2.2. Backend & Banco de Dados
- **Node.js:** Ambiente de execução em servidor.
- **PostgreSQL:** Banco de dados relacional (RDBMS), escolhido pela sua robustez, integridade referencial e suporte a grandes volumes de dados.
- **Prisma ORM (v6.19.3):** ORM (Object-Relational Mapping) utilizado para modelagem de dados, migrações e consultas ao banco com segurança de tipos.
- **NextAuth.js (v4):** Solução completa para autenticação, suporte a credenciais e controle de sessão.
- **Bcryptjs:** Para hashização unidirecional (criptografia) de senhas.
- **ExcelJS:** Geração de relatórios administrativos no formato Excel (.xlsx) diretamente pelo backend.
- **Nodemailer:** Módulo para disparo de e-mails transacionais (recuperação de senhas, confirmação de reservas, etc) através de um servidor SMTP externo.

---

## 3. Detalhamento de Requisitos (Regras de Negócio)

### 3.1. Atores do Sistema
- **Usuário Comum (USER):** Cidadão/esportista que utiliza o sistema para encontrar horários e reservar quadras para sua prática esportiva.
- **Administrador (ADMIN):** Gestor do sistema, responsável por gerir cadastros, criar horários, aprovar times e extrair relatórios.

### 3.2. Módulos e Funcionalidades
1. **Módulo de Autenticação e Perfis:**
   - Cadastro de usuários validando unicidade de CPF e E-mail.
   - Login por e-mail/senha com controle de sessão.
   - Fluxo de recuperação de senhas (envio de token por e-mail com expiração controlada).
   
2. **Módulo de Gestão de Quadras e Horários:**
   - Quadras são categorizadas por "Modalidades" esportivas (ex: Futsal, Vôlei).
   - "Agendas" definem a disponibilidade das quadras em dias específicos, listando arrays de horários (slots) disponíveis para reserva.
   - Apenas administradores podem abrir/fechar quadras e definir agendas.

3. **Módulo de Times e Responsáveis:**
   - Antes de reservar quadras (dependendo da regra local), usuários podem formar "Times".
   - Um time passa por análise de documentação (Comprovante de residência e Antecedentes Criminais de seus responsáveis).
   - Administradores avaliam e alteram o status dos times (Pendente, Apto, Inapto, Suspenso, Inativo). Times "Inaptos" ou "Suspensos" são bloqueados de realizar novas reservas.

4. **Módulo de Reservas:**
   - Usuários selecionam data e quadra para visualizar os horários (slots) disponíveis.
   - Uma reserva efetivada gera notificação por e-mail e passa ao status de "CONFIRMADA".
   - Reservas duplicadas para o mesmo slot/quadra são bloqueadas por chave única no banco de dados, evitando conflitos (Double Booking).

5. **Módulo Administrativo:**
   - Painel contendo agenda semanal e calendário mensal para visualização gerencial.
   - Gestão de cancelamentos de reservas com obrigatoriedade de motivo.
   - Exportação da lista de reservas e usuários para planilhas gerenciais (.xlsx).

---

## 4. Modelagem e Estrutura do Banco de Dados

O banco de dados é estritamente relacional. A documentação a seguir mapeia as entidades definidas no Prisma.

### 4.1. Enumerações (Enums)
- `Role`: `USER`, `ADMIN`
- `ReservaStatus`: `CONFIRMADA`, `CANCELADA_ADMIN`, `CONCLUIDA`
- `TimeStatus`: `PENDENTE`, `APTO`, `INAPTO`, `SUSPENSO`, `INATIVO`
- `MetodoConferencia`: `ANEXOS_SISTEMA`, `CONFERENCIA_EXTERNA`

### 4.2. Tabelas Principais (Entidades)

**Tabela `User`**
- **PK:** `id` (String, armazena o CPF sem formatação, atuando como identificador principal).
- **Campos:** `name`, `email` (Unique), `password` (Hashed), `telefone`, `role`, `pessoaId` (Unique FK).
- **Relacionamentos:** 1:1 com `Pessoa`, 1:N com `Reserva` (como usuário e como operador), 1:N com `Time` (times conferidos pelo admin).

**Tabela `Pessoa`**
- **PK:** `id` (CUID - Collision-resistant Unique Identifier).
- **Campos:** `cpf` (Unique), `nome`, `telefone`, `comprovanteResidencia` (Boolean), `urlComprovante`, `antecedentesCriminais` (Boolean), `urlAntecedentes`, `createdAt`, `updatedAt`.
- **Relacionamentos:** 1:1 inversa com `User`, 1:N com `ResponsavelTime`.

**Tabela `Time`**
- **PK:** `id` (CUID).
- **Campos:** `nome` (Unique), `status` (TimeStatus default PENDENTE), `conferidoEm`, `metodoConferencia`, `observacaoConferencia`, `motivoInaptidao`, `createdAt`.
- **FK:** `conferidoPorId` (referencia o `User` admin que auditou).
- **Relacionamentos:** 1:N com `ResponsavelTime` e `Reserva`.

**Tabela `ResponsavelTime` (Tabela Associativa / Join Table)**
- **PK:** `id` (CUID).
- **FKs:** `pessoaId`, `timeId`.
- **Constraint:** Unique composta por `[pessoaId, timeId]`. Deleção em cascata garantida.

**Tabela `Modalidade` e `Quadra`**
- `Modalidade`: `id` (CUID), `nome` (Unique).
- `Quadra`: `id` (CUID), `nome`, `ativa` (Boolean), `modalidadeId`. Possui constraint Unique composta por `[nome, modalidadeId]`.

**Tabela `Agenda`**
- **PK:** `id` (CUID).
- **Campos:** `data` (DateTime), `horarios` (Array de Strings, ex: `["10:00", "11:00"]`).
- **FK:** `quadraId`.
- **Constraint:** Unique composta por `[data, quadraId]`, garantindo que uma quadra só tenha uma agenda por dia.

**Tabela `Reserva`**
- **PK:** `id` (CUID).
- **Campos:** `data` (DateTime), `slot` (String), `status` (ReservaStatus), `emailStatus`, `cancelToken`, `isAdminReserva`, `motivo`.
- **FKs:** `userId`, `operadorId`, `quadraId`, `timeId`.
- **Constraint Crítica:** Unique composta por `[data, slot, quadraId, cancelToken]`. O campo `cancelToken` existe para permitir que horários cancelados não infrinjam a restrição de chave única e possam ser reservados novamente.

**Tabela `PasswordResetToken`**
- Utilizada de forma efêmera para gerenciar tokens de redefinição de senha com `email`, `token` (Unique) e `expires`.

---

## 5. Guia de Uso para Usuários e Administradores

### 5.1. Guia do Usuário
1. **Cadastro e Login:** O usuário deve se registrar em `/cadastro` utilizando CPF válido. O login requer E-mail e Senha. Em caso de perda, utiliza a função "Esqueci a Senha" que disparará um e-mail com token temporário.
2. **Registro de Equipes:** Caso seja um grupo recorrente, o usuário deve ir à aba de times, cadastrar os membros, e fazer o upload (ou informar links) dos documentos requeridos para análise.
3. **Realizando uma Reserva:**
   - Acessar a página de Reservas.
   - Selecionar a modalidade esportiva e a quadra desejada.
   - Navegar no calendário e clicar em um dia que contenha horários liberados.
   - Selecionar o horário (slot) e confirmar.
4. **Gerenciamento de Reservas:** No painel principal, o usuário pode ver o histórico e status de suas reservas atuais.

### 5.2. Guia do Administrador
1. **Acesso:** O administrador deve logar via rota restrita `/admin-login` (exigirá credenciais com a role `ADMIN`).
2. **Dashboard e Visão Geral:** A tela inicial do painel admin mostrará um resumo do dia. A "Agenda Semanal" permite ver ocupação massiva das quadras de forma visual.
3. **Gestão de Quadras e Agendas:**
   - O admin acessa a configuração de quadras para ativar/inativar estruturas em manutenção.
   - No gerenciamento de Agenda, seleciona-se dias específicos do mês e abrem-se as janelas de horários (ex: Das 08:00 às 22:00) em lote.
4. **Moderação de Times:** A aba de aprovação listará equipes pendentes. O admin fará o download/visualização dos documentos anexados, aprovará (`APTO`) ou rejeitará (`INAPTO`) informando uma "Observação de Conferência" obrigatória.
5. **Cancelamentos Administrativos:** Em casos de força maior (chuvas fortes em quadra descoberta, manutenção urgente), o admin tem o poder de cancelar reservas, o que disparará um e-mail de aviso aos locatários contendo o `motivo`.

---

## 6. Plano de Manutenção a Longo Prazo

Para terceiros encarregados da sustentação e longevidade deste software, os seguintes protocolos devem ser seguidos à risca:

### 6.1. Manutenção Preventiva e Atualizações
- **Auditoria de Pacotes:** Rodar `npm audit` bimestralmente. Em caso de vulnerabilidades no Next.js ou NextAuth, atualizar conforme documentação oficial das bibliotecas, verificando "Breaking Changes".
- **Limpeza do Banco de Dados:** Sugere-se a criação de um job (cronjob externo ou no banco) que limpe anualmente reservas muito antigas ou usuários inativos há mais de 3 anos, de modo a otimizar índices da base de dados e atender políticas de LGPD.
- **Rotação de Segredos:** As variáveis `NEXTAUTH_SECRET` e senhas de serviço (SMTP e Banco de Dados) devem ser alteradas anualmente, exigindo restart das aplicações e re-login forçado de todos os usuários.

### 6.2. Gerenciamento de Logs e Erros
- Recomenda-se a integração de um serviço de monitoramento (como Sentry ou Datadog) para rastrear falhas (Unhandled Exceptions) nas rotas de API silenciosas.
- Como o sistema faz envio de e-mails (`nodemailer`), a caixa de saída do provedor SMTP (SendGrid, AWS SES ou similar) deve ter seus índices de *Bounces* e *Spam Complaints* monitorados semanalmente.

### 6.3. Backups do Banco de Dados
- Configurar rotinas automáticas no provedor de Cloud do PostgreSQL para realizar **dumps diários**, com retenção mínima de 30 dias.
- Testes de restauração de banco de dados (`Disaster Recovery Plan`) devem ser homologados a cada 6 meses.

---

## 7. Guia Completo para Implementação (Deploy/Instalação)

Este guia destina-se a equipes de infraestrutura e desenvolvedores assumindo o projeto.

### 7.1. Pré-requisitos
- Node.js (versão 20.x ou superior, versão LTS preferencialmente).
- Banco de Dados PostgreSQL (versão 14 ou superior) em execução (local via Docker ou Cloud via AWS RDS/Supabase).
- Uma conta em provedor SMTP para envio de e-mails transacionais (Gmail App Passwords, Mailgun, AWS SES, etc).

### 7.2. Configuração do Ambiente Local
1. **Clone o repositório:**
   ```bash
   git clone [url-do-repositorio]
   cd quadras-app
   ```
2. **Instale as dependências (com congelamento de versão):**
   ```bash
   npm ci
   # caso existam problemas com dependências legadas: npm install --legacy-peer-deps
   ```
3. **Configuração de Variáveis de Ambiente:**
   Copie o arquivo `.env.example` para `.env` e preencha rigorosamente os campos:
   ```env
   # Bancos de dados
   DATABASE_URL="postgresql://user:password@host:5432/quadrasapp"
   DIRECT_URL="postgresql://user:password@host:5432/quadrasapp" # Usado se houver PgBouncer
   
   # Segurança e Autenticação
   NEXTAUTH_SECRET="gere_um_hash_seguro_no_terminal_com_openssl_rand_base64_32"
   NEXTAUTH_URL="http://localhost:3000" # Ou a URL de produção (https://meudominio.com.br)
   
   # E-mail (Nodemailer)
   SMTP_HOST="smtp.provedor.com"
   SMTP_PORT="587"
   SMTP_USER="seu_email@provedor.com"
   SMTP_PASS="sua_senha_de_aplicativo"
   SMTP_FROM="Nao Responda <seu_email@provedor.com>"
   ```

### 7.3. Instalação e Preparação do Banco de Dados
O Prisma ORM necessita preparar os esquemas no banco de dados zerado:
1. **Gerar os artefatos do cliente Prisma:**
   ```bash
   npx prisma generate
   ```
2. **Criar a estrutura de tabelas (Migrações):**
   Para ambiente de desenvolvimento:
   ```bash
   npx prisma migrate dev
   ```
   Para ambiente de produção:
   ```bash
   npx prisma migrate deploy
   ```
3. **População de Dados Iniciais (Seeding):**
   O projeto possui scripts prontos para injetar dados fictícios de teste.
   ```bash
   # Para inserir um conjunto completo de quadras, modalidades e dados realistas:
   npm run db:seed:realistic
   ```

### 7.4. Executando a Aplicação
- **Modo Desenvolvimento (com Hot-Reload):**
  ```bash
  npm run dev
  ```
  O sistema estará disponível em `http://localhost:3000`.

- **Modo Produção:**
  Para preparar a versão otimizada e rodar em servidores como EC2 ou VPS, execute:
  ```bash
  npm run build
  npm start
  ```
  *(Nota: Se o deploy for realizado em plataformas modernas como Vercel ou Netlify, os comandos `build` são mapeados automaticamente pela plataforma, bastando configurar as variáveis de ambiente em seus respectivos painéis de controle).*
