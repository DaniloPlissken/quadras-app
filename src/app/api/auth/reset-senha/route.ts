import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json({ error: 'Token e senha são obrigatórios.' }, { status: 400 });
    }

    if (password.trim().length === 0) {
      return NextResponse.json({ error: 'A senha não pode ser vazia.' }, { status: 400 });
    }

    if (Buffer.byteLength(password, 'utf8') > 72) {
      return NextResponse.json({ error: 'A senha excedeu o limite máximo seguro.' }, { status: 400 });
    }

    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { token }
    });

    if (!resetRecord) {
      return NextResponse.json({ error: 'Token inválido ou não encontrado.' }, { status: 400 });
    }

    if (resetRecord.expires < new Date()) {
      await prisma.passwordResetToken.delete({ where: { id: resetRecord.id } });
      return NextResponse.json({ error: 'O link expirou. Solicite um novo.' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Atualiza a senha do usuário
    await prisma.user.update({
      where: { email: resetRecord.email },
      data: { password: hashedPassword }
    });

    // Remove o token para evitar reuso
    await prisma.passwordResetToken.delete({
      where: { id: resetRecord.id }
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Erro no reset-senha:', error);
    return NextResponse.json({ error: 'Ocorreu um erro interno.' }, { status: 500 });
  }
}
