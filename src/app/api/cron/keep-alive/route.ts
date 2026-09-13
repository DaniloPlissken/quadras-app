import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  // Proteção recomendada pela Vercel (opcional no localhost, essencial na Vercel)
  const authHeader = request.headers.get('authorization');
  
  if (
    process.env.CRON_SECRET && 
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // Fazemos uma query bem leve (apenas um count) para gerar tráfego no banco
    const count = await prisma.quadra.count();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Ping de atividade enviado ao banco!',
      data: count
    });
  } catch (error) {
    console.error('Erro no keep-alive:', error);
    return NextResponse.json({ error: 'Falha ao acessar o banco' }, { status: 500 });
  }
}
