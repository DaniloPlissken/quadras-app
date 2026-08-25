import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { enviarEmailRecuperacao } from '@/lib/mail';

export async function POST(request: Request) {
  try {
    const { cpf } = await request.json();

    if (!cpf) {
      return NextResponse.json({ error: 'CPF é obrigatório.' }, { status: 400 });
    }

    const cpfLimpo = cpf.replace(/\D/g, '');

    const user = await prisma.user.findUnique({
      where: { id: cpfLimpo }
    });

    if (!user) {
      // Por segurança, podemos retornar sucesso genérico ou um erro claro.
      // Como o sistema é restrito, vamos retornar erro claro.
      return NextResponse.json({ error: 'Nenhum usuário encontrado com este CPF.' }, { status: 404 });
    }

    // Apaga tokens antigos deste email se existirem
    await prisma.passwordResetToken.deleteMany({
      where: { email: user.email }
    });

    // Cria token que expira em 1 hora
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date();
    expires.setHours(expires.getHours() + 1);

    await prisma.passwordResetToken.create({
      data: {
        email: user.email,
        token,
        expires
      }
    });

    // Envia o e-mail
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    await enviarEmailRecuperacao(user.email, token, baseUrl);

    return NextResponse.json({ success: true, email: user.email }, { status: 200 });
  } catch (error) {
    console.error('Erro no esqueci-senha:', error);
    return NextResponse.json({ error: 'Ocorreu um erro interno.' }, { status: 500 });
  }
}
