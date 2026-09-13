import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { enviarEmailRecuperacao } from '@/lib/mail';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    // Limite: 5 requisições a cada 15 minutos
    if (!rateLimit(ip, 5, 15 * 60 * 1000)) {
      return NextResponse.json({ error: 'Muitas tentativas. Tente novamente mais tarde.' }, { status: 429 });
    }

    const { cpf } = await request.json();

    if (!cpf) {
      return NextResponse.json({ error: 'CPF é obrigatório.' }, { status: 400 });
    }

    const cpfLimpo = cpf.replace(/\D/g, '');

    const user = await prisma.user.findUnique({
      where: { id: cpfLimpo }
    });

    if (!user) {
      // Retorna sucesso genérico para não permitir enumeração de CPFs (LGPD / Segurança)
      return NextResponse.json({ success: true, message: 'Se o CPF estiver cadastrado, um e-mail de recuperação foi enviado.' }, { status: 200 });
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

    // Retorna sucesso genérico SEM o e-mail do usuário
    return NextResponse.json({ success: true, message: 'Se o CPF estiver cadastrado, um e-mail de recuperação foi enviado.' }, { status: 200 });
  } catch (error) {
    console.error('Erro no esqueci-senha:', error);
    return NextResponse.json({ error: 'Ocorreu um erro interno.' }, { status: 500 });
  }
}
