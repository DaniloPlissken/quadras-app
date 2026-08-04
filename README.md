# 🏟️ Quadras App - Sistema de Gestão e Reserva de Quadras (FUTEL)

Sistema completo para agendamento, gestão de quadras poliesportivas, cadastro e aprovação de times e emissão de agenda semanal para administração pública / complexos esportivos.

---

## 🚀 Tecnologias

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/) + React 19 + TypeScript
- **Banco de Dados & ORM**: PostgreSQL via [Supabase](https://supabase.com/) + [Prisma ORM](https://www.prisma.io/)
- **Estilização**: Tailwind CSS v4 + Radix UI + Lucide Icons + Sonner (Toasts)
- **Autenticação**: NextAuth.js com Credentials Provider & Hash bcryptjs

---

## 📦 Estrutura do Projeto

```
├── prisma/
│   └── schema.prisma         # Modelagem do banco (User, Reserva, Quadra, Modalidade, Time, Agenda)
├── src/
│   ├── app/
│   │   ├── (public)/         # Páginas públicas (Home, Login, Cadastro, Reservas por Modalidade)
│   │   ├── admin/            # Painel Administrativo (Dashboard, Quadras, Calendário, Agenda Semanal, Times)
│   │   └── api/              # Rotas de API (NextAuth, Reservas, Quadras, Agenda, Admin)
│   ├── components/           # Componentes reutilizáveis de UI e layout
│   └── lib/                  # Configurações de Prisma e NextAuth
├── seed-modalidades.js       # Seed inicial de modalidades
├── seed-quadras.js           # Seed completo com quadras, agendas, times e usuário teste
└── create-admin.js           # Criação do usuário administrador
```

---

## 🛠️ Como Rodar Localmente

### 1. Clonar o repositório e instalar dependências:
```bash
git clone <url-do-repositorio>
cd quadras-app
npm install
```

### 2. Configurar Variáveis de Ambiente:
Crie um arquivo `.env` na raiz baseado no `.env.example`:
```env
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[SENHA]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[SENHA]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
NEXTAUTH_SECRET="minha-chave-secreta-segura-123"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Sincronizar o Banco de Dados e Rodar Seeds:
```bash
# Criação das tabelas no banco
npx prisma db push

# Criar admin padrão e dados de teste
node create-admin.js
node seed-quadras.js
```

### 4. Executar em Desenvolvimento:
```bash
npm run dev
```
Acesse: [http://localhost:3000](http://localhost:3000)

### 5. Verificação de Qualidade e Build:
```bash
# Análise de lint e tipagem
npm run lint

# Build de produção
npm run build
```

---

## 🔑 Credenciais Padrão para Testes

| Perfil | E-mail / Identificador | CPF | Senha |
| :--- | :--- | :--- | :--- |
| **Administrador** | `admin@futel.mg.gov.br` | `admin` | `123456` |
| **Cidadão / Usuário Teste** | `cidadao@teste.com` | `12345678900` | `123456` |

---

## 📋 Funcionalidades Principais

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
