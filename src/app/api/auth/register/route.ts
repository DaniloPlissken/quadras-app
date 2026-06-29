import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

// Algoritmo matemático para validar CPF
function validarCPF(cpf: string) {
  cpf = cpf.replace(/[^\d]+/g, '');
  if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false;
  let t = 9;
  for (let j = 0; j < 2; j++) {
    let d = 0;
    for (let c = 0; c < t; c++) {
      d += parseInt(cpf[c]) * ((t + 1) - c);
    }
    d = ((10 * d) % 11) % 10;
    if (cpf[t] !== d.toString()) return false;
    t++;
  }
  return true;
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { name, email, cpf, password } = data;

    // Remove formatação do CPF
    const cpfLimpo = cpf.replace(/\D/g, '');

    // Validação básica
    if (!name || !email || !cpfLimpo || !password) {
      return NextResponse.json({ error: 'Preencha todos os campos obrigatórios' }, { status: 400 });
    }

    // Validação matemática do CPF
    if (!validarCPF(cpfLimpo)) {
      return NextResponse.json({ error: 'CPF inválido' }, { status: 400 });
    }

    // Verificar se CPF (id) ou Email já existem
    const userByCpf = await prisma.user.findUnique({
      where: { id: cpfLimpo }
    });

    if (userByCpf) {
      return NextResponse.json({ error: 'CPF já cadastrado no sistema' }, { status: 400 });
    }

    const userByEmail = await prisma.user.findUnique({
      where: { email }
    });

    if (userByEmail) {
      return NextResponse.json({ error: 'Email já cadastrado no sistema' }, { status: 400 });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criação do usuário — id é o CPF
    const user = await prisma.user.create({
      data: {
        id: cpfLimpo,
        name,
        email,
        password: hashedPassword,
      }
    });

    return NextResponse.json({ message: 'Usuário cadastrado com sucesso', userId: user.id }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}
