import Link from 'next/link'
import { Waves, Dumbbell, Trophy, CircleDot } from 'lucide-react'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const modalidades = [
  {
    nome: 'Vôlei',
    descricao: 'Reservas para quadras de vôlei.',
    href: '/reservas/volei',
    icone: Waves,
    ativo: true,
  },
  {
    nome: 'Beach Tênis',
    descricao: 'Reservas para quadras de beach tênis.',
    href: '/reservas/beach-tenis',
    icone: CircleDot,
    ativo: true,
  },
  {
    nome: 'Tênis',
    descricao: 'Reservas de 1 hora para quadra de tênis.',
    href: '/reservas/tenis',
    icone: Trophy,
    ativo: true,
  },
  {
    nome: 'Futebol',
    descricao: 'Exige cadastro prévio do time.',
    href: '/reservas/futebol',
    icone: Dumbbell,
    ativo: false,
  },
]

export default function ReservasPage() {
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 rounded-3xl bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold uppercase tracking-wide text-green-700">
              FUTEL
            </span>

            <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">
              Selecione a modalidade
            </h1>

            <p className="max-w-3xl text-base text-slate-600">
              Escolha abaixo a modalidade desejada para consultar horários
              disponíveis e realizar o agendamento.
            </p>
          </div>

          <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
            <p className="font-semibold">
              Apenas 1 reserva por CPF a cada fim de semana.
            </p>

            <p className="mt-1">
              Agendamentos disponíveis somente para sábado e domingo da semana
              atual.
            </p>
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {modalidades.map((modalidade) => {
            const Icone = modalidade.icone

            const card = (
              <Card
                className={`h-full rounded-3xl border bg-white transition ${
                  modalidade.ativo
                    ? 'cursor-pointer hover:-translate-y-1 hover:shadow-xl'
                    : 'opacity-70'
                }`}
              >
                <CardHeader className="items-center text-center">
                  <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-slate-100">
                    <Icone className="h-14 w-14 text-slate-900" />
                  </div>

                  <CardTitle className="text-2xl">
                    {modalidade.nome}
                  </CardTitle>
                </CardHeader>

                <CardContent className="text-center text-sm text-slate-600">
                  <p>{modalidade.descricao}</p>

                  {!modalidade.ativo && (
                    <p className="mt-4 rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800">
                      Disponível em breve
                    </p>
                  )}
                </CardContent>
              </Card>
            )

            if (!modalidade.ativo) {
              return <div key={modalidade.nome}>{card}</div>
            }

            return (
              <Link key={modalidade.nome} href={modalidade.href}>
                {card}
              </Link>
            )
          })}
        </section>
      </div>
    </main>
  )
}