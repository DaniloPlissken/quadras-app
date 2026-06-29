'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import { ConfirmacaoModal } from '@/components/reservas/ConfirmacaoModal'
import { useSession } from 'next-auth/react'

type Quadra = {
  id: string
  nome: string
}

type Reserva = {
  id: string
  data: string
  slot: string
  quadraId: string
  userId: string
}

type Agenda = {
  id: string
  data: string
  horarios: string[]
}

function formatarDataLocal(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function nomeModalidade(slug: string) {
  const mapa: Record<string, string> = {
    volei: 'Vôlei',
    'beach-tenis': 'Beach Tênis',
    tenis: 'Tênis',
    futebol: 'Futebol',
  }

  return mapa[slug] ?? slug
}

export default function ReservaModalidadePage() {
  const params = useParams()
  const router = useRouter()
  const modalidade = String(params.modalidade)
  const { data: session } = useSession()

  const [dataSelecionada, setDataSelecionada] = useState<Date | undefined>(new Date())

  const [quadras, setQuadras] = useState<Quadra[]>([])
  const [quadraId, setQuadraId] = useState('')
  const [agendas, setAgendas] = useState<Agenda[]>([])
  const [reservas, setReservas] = useState<Reserva[]>([])
  const [carregando, setCarregando] = useState(false)
  const [slotSelecionado, setSlotSelecionado] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const userId = session?.user?.id || ''

  useEffect(() => {
    async function carregarQuadras() {
      if (modalidade === 'futebol') return

      const res = await fetch(`/api/quadras?modalidade=${modalidade}`)
      const data = await res.json()

      setQuadras(data)

      if (data.length > 0) {
        setQuadraId(data[0].id)
      }
    }

    carregarQuadras()
  }, [modalidade])

  useEffect(() => {
    async function carregarAgendas() {
      if (modalidade === 'futebol' || !quadraId) return

      const res = await fetch(`/api/agenda?quadraId=${quadraId}`)
      const data = await res.json()
      setAgendas(data)
    }
    carregarAgendas()
  }, [quadraId, modalidade])

  useEffect(() => {
    async function carregarReservas() {
      if (modalidade === 'futebol') return
      if (!dataSelecionada || !quadraId) return

      const dataFormatada = formatarDataLocal(dataSelecionada)

      const res = await fetch(
        `/api/reservas?data=${dataFormatada}&quadraId=${quadraId}`
      )

      const data = await res.json()
      setReservas(data)
    }

    carregarReservas()
  }, [dataSelecionada, quadraId, modalidade])

  async function reservar(slot: string, emailConfirmacao: string) {
    if (!userId) {
      toast.error('Você precisa estar logado para reservar.')
      router.push('/login')
      return
    }

    if (!dataSelecionada || !quadraId) return

    setCarregando(true)

    const dataFormatada = formatarDataLocal(dataSelecionada)
    
    // Simulação do envio de email para notificação
    console.log(`Enviando confirmação de reserva para: ${emailConfirmacao}`);

    const res = await fetch('/api/reservas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        quadraId,
        userId,
        data: dataFormatada,
        slot,
        emailConfirmacao,
      }),
    })

    setCarregando(false)

    if (!res.ok) {
      const erro = await res.json()
      toast.error(erro.error || 'Não foi possível realizar a reserva.')
      return
    }

    toast.success('Reserva realizada com sucesso!')

    const atualizadas = await fetch(
      `/api/reservas?data=${dataFormatada}&quadraId=${quadraId}`
    )

    setReservas(await atualizadas.json())
  }

  const slotsReservados = reservas.map((reserva) => reserva.slot)

  const usuarioJaReservouNestaData = reservas.some(
    (reserva) => reserva.userId === userId
  )

  const datasDisponiveisStr = agendas.map(a => a.data.split('T')[0])

  const agendaDoDia = dataSelecionada 
    ? agendas.find(a => a.data.split('T')[0] === formatarDataLocal(dataSelecionada))
    : undefined

  const slotsAtuais = agendaDoDia?.horarios || []

  if (modalidade === 'futebol') {
    return (
      <main className="min-h-screen bg-slate-100 p-6">
        <div className="mx-auto max-w-3xl">
          <Card className="rounded-3xl border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-emerald-600 to-emerald-800 rounded-t-3xl text-white">
              <CardTitle className="text-3xl">
                Agendamento de Futebol
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 text-slate-700 p-8">
              <p className="text-lg font-semibold">
                O agendamento de campos de futebol exige cadastro prévio do time.
              </p>

              <p>
                Para reservar um campo, o responsável deverá estar vinculado a um
                time cadastrado pela administração.
              </p>

              <p>
                Esta funcionalidade será liberada em uma próxima etapa do sistema.
              </p>

              <div className="pt-4">
                <Link
                  href="/reservas"
                  className="inline-flex rounded-full bg-slate-900 px-6 py-3 text-sm font-medium text-white transition-transform hover:scale-105 active:scale-95"
                >
                  Voltar para modalidades
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
            Reserva - <span className="text-[#004B87]">{nomeModalidade(modalidade)}</span>
          </h1>
          <Link
            href="/reservas"
            className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            ← Voltar
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
          <Card className="border-0 shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden bg-white">
            <CardHeader className="bg-slate-900 text-white p-6">
              <CardTitle className="text-xl font-semibold">Escolha a data</CardTitle>
            </CardHeader>

            <CardContent className="p-6">
              <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-sm text-blue-900">
                <p className="font-medium">
                  Datas liberadas pelo administrador aparecerão ativas no calendário.
                </p>
              </div>

              <div className="flex justify-center">
                <Calendar
                  locale={ptBR}
                  mode="single"
                  selected={dataSelecionada}
                  onSelect={setDataSelecionada}
                  disabled={(date) => {
                    const str = formatarDataLocal(date);
                    return !datasDisponiveisStr.includes(str);
                  }}
                  className="rounded-xl border border-slate-100 shadow-sm p-4 bg-white"
                  classNames={{
                    day_selected: "bg-[#004B87] text-white hover:bg-[#004B87] hover:text-white focus:bg-[#004B87] focus:text-white",
                    day_today: "bg-slate-100 text-slate-900",
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden bg-white">
            <CardHeader className="bg-white border-b border-slate-100 p-6">
              <CardTitle className="text-xl font-semibold text-slate-800">
                Horários disponíveis
              </CardTitle>
            </CardHeader>

            <CardContent className="p-6 space-y-8">
              <div className="flex flex-wrap gap-3">
                {quadras.map((quadra) => (
                  <Button
                    key={quadra.id}
                    variant={quadraId === quadra.id ? 'default' : 'outline'}
                    onClick={() => setQuadraId(quadra.id)}
                    className={`rounded-full px-6 transition-all ${quadraId === quadra.id ? 'bg-[#004B87] hover:bg-[#003865] text-white shadow-md' : 'hover:border-[#004B87] hover:text-[#004B87]'}`}
                  >
                    {quadra.nome}
                  </Button>
                ))}
              </div>

              {!userId && (
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 font-medium">
                  Você precisa fazer login para agendar uma quadra. <Link href="/login" className="underline font-bold">Entrar agora</Link>.
                </div>
              )}

              {userId && usuarioJaReservouNestaData && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 font-medium">
                  Você já possui uma reserva para este fim de semana. Limite de 1 reserva por fim de semana.
                </div>
              )}

              {dataSelecionada && slotsAtuais.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  Nenhum horário liberado para esta data.
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {slotsAtuais.map((slot) => {
                    const ocupado = slotsReservados.includes(slot)
                    const bloqueado = usuarioJaReservouNestaData || !userId

                    return (
                      <button
                        key={slot}
                        disabled={ocupado || carregando || bloqueado}
                        onClick={() => {
                          setSlotSelecionado(slot)
                          setIsModalOpen(true)
                        }}
                        className={`group relative overflow-hidden rounded-xl p-4 text-left transition-all duration-300
                          ${ocupado 
                            ? 'bg-slate-100 cursor-not-allowed opacity-70' 
                            : bloqueado
                              ? 'bg-slate-50 border border-slate-200 cursor-not-allowed'
                              : 'bg-white border-2 border-slate-200 hover:border-[#004B87] hover:shadow-lg cursor-pointer active:scale-95'
                          }
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-lg font-bold ${ocupado ? 'text-slate-500' : 'text-slate-800 group-hover:text-[#004B87]'}`}>
                            {slot}
                          </span>
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full uppercase tracking-wider
                            ${ocupado 
                              ? 'bg-slate-200 text-slate-600' 
                              : bloqueado 
                                ? 'bg-slate-200 text-slate-500'
                                : 'bg-[#004B87]/10 text-[#004B87]'
                            }
                          `}>
                            {ocupado ? 'Ocupado' : bloqueado ? 'Bloqueado' : 'Livre'}
                          </span>
                        </div>
                        {(!ocupado && !bloqueado) && (
                          <div className="absolute inset-0 bg-[#004B87]/5 translate-y-full transition-transform group-hover:translate-y-0" />
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <ConfirmacaoModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onConfirm={(email) => {
             setIsModalOpen(false)
             if (slotSelecionado) reservar(slotSelecionado, email)
          }}
          quadraNome={quadras.find(q => q.id === quadraId)?.nome || ''}
          data={dataSelecionada?.toLocaleDateString('pt-BR') || ''}
          horario={slotSelecionado || ''}
          emailPadrao={session?.user?.email || ''}
        />
      </div>
    </main>
  )
}