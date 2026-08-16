import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { enviarEmailMensagemAdmin } from '@/lib/mail';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { reservaId, mensagem } = await request.json();

    if (!reservaId || !mensagem) {
      return NextResponse.json({ error: 'Reserva e mensagem são obrigatórias.' }, { status: 400 });
    }

    const reserva = await prisma.reserva.findUnique({
      where: { id: reservaId },
      include: { user: true }
    });

    if (!reserva || !reserva.user) {
      return NextResponse.json({ error: 'Reserva ou usuário não encontrados.' }, { status: 404 });
    }

    await enviarEmailMensagemAdmin(reserva.user.email, mensagem);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Erro ao enviar mensagem admin:', error);
    return NextResponse.json({ error: 'Ocorreu um erro ao enviar a mensagem.' }, { status: 500 });
  }
}
