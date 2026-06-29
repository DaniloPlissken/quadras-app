import Link from 'next/link'
import { MapPin } from 'lucide-react'
import { MdSportsVolleyball, MdSportsTennis, MdSportsSoccer, MdWbSunny } from 'react-icons/md'

const BeachTennisIcon = ({ className }: { className?: string }) => (
  <div className={`relative ${className}`}>
    <MdSportsTennis className="w-full h-full" />
    <MdWbSunny className="absolute -top-1.5 -right-1.5 w-[55%] h-[55%] text-orange-400 drop-shadow-sm" />
  </div>
)

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
    icone: MdSportsVolleyball,
    ativo: true,
  },
  {
    nome: 'Beach Tênis',
    descricao: 'Reservas para quadras de beach tênis.',
    href: '/reservas/beach-tenis',
    icone: BeachTennisIcon,
    ativo: true,
  },
  {
    nome: 'Tênis',
    descricao: 'Reservas de 1 hora para quadra de tênis.',
    href: '/reservas/tenis',
    icone: MdSportsTennis,
    ativo: true,
  },
  {
    nome: 'Futebol',
    descricao: 'Exige cadastro prévio do time.',
    href: '/reservas/futebol',
    icone: MdSportsSoccer,
    ativo: false,
  },
]

export default function ReservasPage() {
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 rounded-xl bg-white p-8 shadow-sm border-t-4 border-t-[#004B87]">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-bold uppercase tracking-wider text-[#009A44]">
              PORTAL FUTEL
            </span>

            <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">
              Agendamento de Quadras
            </h1>

            <p className="max-w-3xl text-base text-slate-600 mt-2">
              Selecione a modalidade esportiva desejada para consultar a disponibilidade de horários e efetuar a reserva no Parque do Sabiá.
            </p>
          </div>

          <div className="mt-8 rounded-lg border border-blue-100 bg-blue-50/50 p-4 text-sm text-blue-900 flex gap-3 items-start">
            <MapPin className="w-5 h-5 text-[#004B87] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">
                Apenas 1 reserva por CPF a cada fim de semana.
              </p>
              <p className="mt-1">
                Agendamentos disponíveis para sábado, domingo e feriados da semana.
              </p>
            </div>
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {modalidades.map((modalidade) => {
            const Icone = modalidade.icone

            const card = (
              <Card
                className={`h-full rounded-xl border border-slate-200 bg-white transition-all ${
                  modalidade.ativo
                    ? 'cursor-pointer hover:border-[#004B87] hover:shadow-md'
                    : 'opacity-70 bg-slate-50'
                }`}
              >
                <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#004B87]/10">
                    <Icone className="h-6 w-6 text-[#004B87]" />
                  </div>

                  <CardTitle className="text-xl font-bold text-slate-800">
                    {modalidade.nome}
                  </CardTitle>
                </CardHeader>

                <CardContent className="text-left text-sm text-slate-600 pt-4">
                  <p>{modalidade.descricao}</p>

                  {!modalidade.ativo && (
                    <div className="mt-4 inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20">
                      Disponível em breve
                    </div>
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