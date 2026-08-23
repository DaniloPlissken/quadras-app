import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'
import { MapPin, ArrowRight, CalendarDays, Phone, CheckCircle2 } from 'lucide-react'
import { MdSportsVolleyball, MdSportsTennis, MdSportsSoccer, MdWbSunny } from 'react-icons/md'
import { prisma } from '@/lib/prisma'

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

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  
  const minhasReservas = await prisma.reserva.findMany({
    where: { 
      userId: session.user.id,
      data: { gte: hoje },
      status: 'CONFIRMADA'
    },
    include: {
      quadra: {
        include: {
          modalidade: true
        }
      }
    },
    orderBy: [
      { data: 'asc' },
      { slot: 'asc' }
    ]
  })

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-4 md:py-6">
      <div className="mx-auto max-w-6xl">
        {/* Hero Section */}
        <header className="mb-6 overflow-hidden rounded-3xl bg-[#004B87] shadow-xl relative">
          {/* Decoração de Fundo Animada */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#FFD100]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none"></div>

          <div className="p-6 md:p-8 relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex flex-col gap-3 max-w-2xl">
              <span className="inline-flex items-center gap-2 text-[10px] md:text-xs font-bold uppercase tracking-widest text-[#FFD100] bg-[#FFD100]/10 px-3 py-1 md:py-1.5 rounded-full w-fit">
                Portal FUTEL
              </span>

              <h1 className="text-3xl font-black text-white md:text-4xl tracking-tight leading-tight">
                Agendamento de<br className="hidden md:block" /> Quadras e Campos
              </h1>

              <p className="text-sm md:text-base text-blue-100 font-medium leading-relaxed">
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

        {/* Minhas Reservas Section */}
        {minhasReservas.length > 0 && (
          <section className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black text-slate-800 tracking-tight">Suas Reservas</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {/* Coluna da esquerda que dita a altura se tiver 2+ reservas */}
              <div className="flex flex-col gap-3">
                {minhasReservas.map((reserva) => (
                  <div key={reserva.id} className="bg-white border-2 border-[#009A44]/20 rounded-xl p-4 flex items-center justify-between shadow-sm relative overflow-hidden group">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#009A44]"></div>
                    <div className="flex flex-col gap-1 ml-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[#009A44] font-black">{reserva.quadra.modalidade.nome} - {reserva.quadra.nome}</span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#009A44] bg-[#009A44]/10 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> Confirmada
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-slate-500 text-sm font-medium mt-1">
                        <div className="flex items-center gap-1.5">
                          <CalendarDays className="w-4 h-4" />
                          {reserva.data.toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                          {reserva.slot}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Aviso de Cancelamento */}
              <div className="bg-red-50 border-2 border-red-100 rounded-2xl p-6 h-full flex flex-col gap-4">
                <div>
                  <h3 className="text-red-800 font-bold text-lg mb-2 flex items-center gap-2">
                    <Phone className="w-5 h-5" />
                    Precisa cancelar?
                  </h3>
                  <p className="text-red-700/80 text-sm font-medium leading-relaxed">
                    O cancelamento de agendamentos confirmados deve ser solicitado <strong className="text-red-800">exclusivamente por telefone</strong> para que possamos liberar a quadra para outros usuários.
                  </p>
                </div>
                <a 
                  href="tel:34997894420" 
                  className="inline-flex items-center gap-2 bg-white text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 px-5 py-3 rounded-xl font-black w-fit transition-all shadow-sm"
                >
                  <Phone className="w-5 h-5" />
                  Ligar para (34) 99789-4420
                </a>
              </div>
            </div>
          </section>
        )}

        {/* Modalidades Grid */}
        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {modalidades.map((modalidade) => {
            const Icone = modalidade.icone

            const cardContent = (
              <div
                className={`group relative h-full rounded-3xl bg-white p-5 md:p-6 transition-all duration-300 flex flex-col ${
                  modalidade.ativo
                    ? 'cursor-pointer hover:-translate-y-1 hover:shadow-xl hover:shadow-[#004B87]/10 border-2 border-transparent hover:border-[#004B87]'
                    : 'opacity-70 bg-slate-50 border-2 border-slate-100'
                }`}
              >
                {/* Ícone Container */}
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl mb-4 transition-all duration-300 ${
                  modalidade.ativo 
                    ? 'bg-blue-50 text-[#004B87] group-hover:scale-110 group-hover:bg-[#004B87] group-hover:text-[#FFD100] group-hover:shadow-md' 
                    : 'bg-slate-200 text-slate-400'
                }`}>
                  <Icone className="h-6 w-6" />
                </div>

                <h3 className={`text-xl font-black mb-1.5 tracking-tight ${modalidade.ativo ? 'text-slate-800' : 'text-slate-500'}`}>
                  {modalidade.nome}
                </h3>

                <p className="text-xs md:text-sm text-slate-500 leading-relaxed flex-1 font-medium">
                  {modalidade.descricao}
                </p>

                {modalidade.ativo && (
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#004B87] opacity-0 -translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                    <span className="uppercase tracking-wider">Agendar</span>
                    <ArrowRight className="w-4 h-4" />
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
