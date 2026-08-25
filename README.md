# Quadras App - Portal FUTEL (Sistema de Gestão e Reserva de Quadras)
**Repositório Privado - Eduardo e Danilo**

Sistema interno desenvolvido para agendamento, gestão de quadras poliesportivas, cadastro de times e emissão de agenda semanal para a FUTEL.

---

## 🛠 Tecnologias

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/) + React 19 + TypeScript
- **Banco de Dados**: PostgreSQL via [Supabase](https://supabase.com/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **UI & Estilos**: Tailwind CSS v4 + Radix UI + Lucide Icons + Sonner
- **Autenticação**: NextAuth.js com Credentials Provider & Hash bcryptjs

---

## 📂 Estrutura do Projeto

Abaixo as pastas principais do projeto para facilitar a manutenção:

```
├── prisma/
│   ├── schema.prisma         # Modelagem do banco (User, Reserva, Quadra, Modalidade, Time, Agenda)
│   └── seed.js               # Script central de carga de dados (Cria as modalidades e quadras)
├── src/
│   ├── app/
│   │   ├── (public)/         # Rotas públicas do cidadão (Home, Login, Cadastro, Reservas)
│   │   ├── admin/            # Rotas do Painel Administrativo
│   │   ├── admin-login/      # Login exclusivo para nós/servidores
│   │   └── api/              # Rotas de Backend
│   ├── components/           # Componentes UI reutilizáveis (shadcn, forms, etc)
│   └── lib/                  # Utilitários globais (Prisma client, configs NextAuth, exports)
└── TODO.md                   # Backlog e pendências internas do projeto
```

---

## ⚙️ Como Rodar o Projeto

### 1. Variáveis de Ambiente
Crie ou verifique o seu arquivo `.env` na raiz do projeto (nunca suba as credenciais reais pro git):
```env
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[SENHA]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[SENHA]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# NextAuth
NEXTAUTH_SECRET="minha-chave-secreta-segura-123"
NEXTAUTH_URL="http://localhost:3000"

# Servidor de E-mail (SMTP para disparo de confirmações)
SMTP_HOST="smtp.seuprovedor.com"
SMTP_PORT="465"
SMTP_USER="nao-responda@futel.mg.gov.br"
SMTP_PASS="senha-do-email"
SMTP_FROM="nao-responda@futel.mg.gov.br"
```

### 2. Sincronização do Banco e Seed
Se houver alguma mudança no `schema.prisma` ou se a base estiver zerada:
```bash
# Aplica o schema no Supabase
npx prisma db push

# Popula as modalidades e quadras essenciais
node prisma/seed.js
```

### 3. Rodar o Ambiente Local
```bash
# Executa o servidor de dev (Turbopack)
npm run dev
```

---

## 🔒 Acesso e Credenciais de Teste

Para agilizar os testes no painel administrativo ou fluxos públicos:

| Perfil | Identificador (Login) | Senha | Acesso |
| :--- | :--- | :--- | :--- |
| **Administrador** | `admin@futel.mg.gov.br` (Email) | `123456` | Rota: `/admin-login` |
| **Cidadão / Usuário Teste** | `12345678900` (CPF) | `123456` | Rota: `/login` |

---

## 📋 Qualidade e Build

Antes de realizar os deploys, sempre rode:
```bash
# Verifica sintaxe e erros do TypeScript/React
npm run lint

# Simula o build da Vercel (identifica rotas quebradas)
npm run build
```

---

## 🚀 Funcionalidades Principais

- **Portal do Cidadão**:
  - Cadastro obrigatório com validação de CPF como identificador único.
  - Agendamento de horários por modalidade esportiva (Futebol, Vôlei, Beach Tênis, Tênis).
  - Trava de reservas com base em regras de documentação e time ativo.

- **Painel Administrativo (`/admin`)**:
  - **Dashboard**: Métricas em tempo real (reservas de hoje, cancelamentos, total de times e quadras).
  - **Gestão de Quadras**: Ativação, desativação e criação de quadras por modalidade.
  - **Calendário & Liberação de Horários**: Liberação de dias abertos e grades personalizadas.
  - **Agenda Semanal (Grid Time-Sheet)**: Visualização consolidada por modalidade com suporte nativo a impressão/relatório.
  - **Gestão de Times**: Análise de documentos (comprovante de residência e antecedentes criminais) e aprovação de aptidão para reserva.
