import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'
import { MapPin, ArrowRight } from 'lucide-react'
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
    descricao: 'O cadastro de times, aprovação e agendamentos são realizados exclusivamente pela equipe da FUTEL.',
    href: '/reservas/futebol',
    icone: MdSportsSoccer,
    ativo: false,
  },
]

export default async function ReservasPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  } 
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        {/* Hero Section */}
        <header className="mb-12 overflow-hidden rounded-[2rem] bg-[#004B87] shadow-xl relative">
          {/* Decoração de Fundo Animada */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#FFD100]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none"></div>

          <div className="p-8 md:p-12 relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="flex flex-col gap-4 max-w-2xl">
              <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#FFD100] bg-[#FFD100]/10 px-4 py-1.5 rounded-full w-fit">
                Portal FUTEL
              </span>

              <h1 className="text-4xl font-black text-white md:text-5xl tracking-tight leading-tight">
                Agendamento de<br className="hidden md:block" /> Quadras e Campos
              </h1>

              <p className="text-base md:text-lg text-blue-100 mt-2 font-medium leading-relaxed">
                Selecione a modalidade esportiva desejada para consultar a disponibilidade de horários e efetuar a sua reserva no Parque do Sabiá.
              </p>
            </div>

            <div className="rounded-2xl border border-blue-400/30 bg-blue-900/50 backdrop-blur-md p-6 text-sm text-blue-50 flex gap-4 items-start shadow-inner max-w-sm">
              <MapPin className="w-8 h-8 text-[#FFD100] shrink-0" />
              <div className="space-y-1.5">
                <p className="font-bold text-white text-base">
                  Apenas 1 reserva por CPF a cada fim de semana.
                </p>
                <p className="text-blue-200 text-xs md:text-sm">
                  Agendamentos disponíveis para sábado, domingo e feriados da semana.
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Modalidades Grid */}
        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {modalidades.map((modalidade) => {
            const Icone = modalidade.icone

            const cardContent = (
              <div
                className={`group relative h-full rounded-[2rem] bg-white p-8 transition-all duration-300 flex flex-col ${
                  modalidade.ativo
                    ? 'cursor-pointer hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#004B87]/15 border-2 border-transparent hover:border-[#004B87]'
                    : 'opacity-70 bg-slate-50 border-2 border-slate-100'
                }`}
              >
                {/* Ícone Container */}
                <div className={`flex h-16 w-16 items-center justify-center rounded-2xl mb-6 transition-all duration-300 ${
                  modalidade.ativo 
                    ? 'bg-blue-50 text-[#004B87] group-hover:scale-110 group-hover:bg-[#004B87] group-hover:text-[#FFD100] group-hover:shadow-lg' 
                    : 'bg-slate-200 text-slate-400'
                }`}>
                  <Icone className="h-8 w-8" />
                </div>

                <h3 className={`text-2xl font-black mb-3 tracking-tight ${modalidade.ativo ? 'text-slate-800' : 'text-slate-500'}`}>
                  {modalidade.nome}
                </h3>

                <p className="text-sm text-slate-500 leading-relaxed flex-1 font-medium">
                  {modalidade.descricao}
                </p>

                {modalidade.ativo && (
                  <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between text-sm font-bold text-[#004B87] opacity-0 -translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                    <span className="uppercase tracking-wider">Agendar agora</span>
                    <ArrowRight className="w-5 h-5" />
                  </div>
                )}
              </div>
            )

            if (!modalidade.ativo) {
              return <div key={modalidade.nome} className="h-full">{cardContent}</div>
            }

            return (
              <Link key={modalidade.nome} href={modalidade.href} className="outline-none focus:ring-4 focus:ring-[#004B87]/20 rounded-[2rem] block h-full">
                {cardContent}
              </Link>
            )
          })}
        </section>
      </div>
    </main>
  )
}
