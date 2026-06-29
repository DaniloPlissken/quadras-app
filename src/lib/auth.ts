import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        cpf: { label: "CPF", type: "text", placeholder: "000.000.000-00" },
        email: { label: "E-mail", type: "text" },
        password: { label: "Senha", type: "password" }
      },
      async authorize(credentials) {
        if ((!credentials?.cpf && !credentials?.email) || !credentials?.password) {
          throw new Error("Credenciais inválidas");
        }

        let user;
        if (credentials.email) {
          user = await prisma.user.findUnique({
            where: { email: credentials.email }
          });
        } else if (credentials.cpf) {
          // CPF é o id do User agora
          const cpfLimpo = credentials.cpf.replace(/\D/g, '');
          user = await prisma.user.findUnique({
            where: { id: cpfLimpo }
          });
        }

        if (!user || !user.password) {
          throw new Error("Usuário não encontrado");
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          throw new Error("Senha incorreta");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "USER" | "ADMIN";
      }
      return session;
    }
  }
};
