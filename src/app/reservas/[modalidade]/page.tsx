'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Calendar } from '@/components/ui/calendar'
import { Loader2 } from 'lucide-react'
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

function getSemanaRangeLocal(data: Date) {
  const diaSemana = data.getDay() // 0=Dom, 1=Seg, ..., 6=Sáb
  const inicio = new Date(data)
  const diasAteSegunda = diaSemana === 0 ? 6 : diaSemana - 1
  inicio.setDate(inicio.getDate() - diasAteSegunda)
  inicio.setHours(0, 0, 0, 0)

  const fim = new Date(inicio)
  fim.setDate(fim.getDate() + 6)
  fim.setHours(23, 59, 59, 999)
  return { inicio, fim }
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
  const { data: session, status } = useSession()

  const [dataSelecionada, setDataSelecionada] = useState<Date | undefined>(new Date())

  const [quadras, setQuadras] = useState<Quadra[]>([])
  const [quadraId, setQuadraId] = useState('')
  const [agendas, setAgendas] = useState<Agenda[]>([])
  const [reservas, setReservas] = useState<Reserva[]>([])
  const [minhasReservas, setMinhasReservas] = useState<Reserva[]>([])
  const [carregando, setCarregando] = useState(false) // Para o submit do modal
  const [isFetching, setIsFetching] = useState(false) // Para carregamento visual em background
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
    const controller = new AbortController()
    async function carregarAgendas() {
      if (modalidade === 'futebol' || !quadraId) return
      setIsFetching(true)

      try {
        const res = await fetch(`/api/agenda?quadraId=${quadraId}`, { signal: controller.signal })
        const data = await res.json()
        setAgendas(data)
      } catch (err: any) {
        if (err.name !== 'AbortError') console.error(err)
      } finally {
        setIsFetching(false)
      }
    }
    carregarAgendas()
    return () => controller.abort()
  }, [quadraId, modalidade])

  useEffect(() => {
    const controller = new AbortController()
    async function carregarReservas() {
      if (modalidade === 'futebol') return
      if (!dataSelecionada || !quadraId) return
      setIsFetching(true)

      const dataFormatada = formatarDataLocal(dataSelecionada)

      try {
        const res = await fetch(
          `/api/reservas?data=${dataFormatada}&quadraId=${quadraId}`,
          { signal: controller.signal }
        )
        const data = await res.json()
        setReservas(data)
      } catch (err: any) {
        if (err.name !== 'AbortError') console.error(err)
      } finally {
        setIsFetching(false)
      }
    }

    carregarReservas()
    return () => controller.abort()
  }, [dataSelecionada, quadraId, modalidade])

  useEffect(() => {
    async function carregarMinhasReservas() {
      if (status !== 'authenticated') return
      const res = await fetch('/api/reservas/minhas')
      if (res.ok) {
        const data = await res.json()
        setMinhasReservas(data)
      }
    }
    carregarMinhasReservas()
  }, [status])

  useEffect(() => {
  if (status === 'unauthenticated') {
    router.replace('/login')
    }
  }, [status, router])

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

    setIsModalOpen(false)
    
    const reservaCriada = await res.json()
    
    if (reservaCriada.emailStatus === 'FALHOU') {
      toast.success('Reserva realizada! Porém houve uma falha ao enviar o e-mail de confirmação.', { duration: 5000 })
    } else {
      toast.success('Reserva realizada com sucesso e e-mail enviado!')
    }

    const atualizadas = await fetch(
      `/api/reservas?data=${dataFormatada}&quadraId=${quadraId}`
    )
    setReservas(await atualizadas.json())

    const atualizadasMinhas = await fetch('/api/reservas/minhas')
    if (atualizadasMinhas.ok) {
      setMinhasReservas(await atualizadasMinhas.json())
    }
  }

  const slotsReservados = reservas.map((reserva) => reserva.slot)

  let usuarioJaReservouNestaSemana = false;
  if (dataSelecionada) {
    const { inicio, fim } = getSemanaRangeLocal(dataSelecionada);
    usuarioJaReservouNestaSemana = minhasReservas.some((r) => {
      const [ano, mes, dia] = r.data.split('T')[0].split('-').map(Number);
      const dataReserva = new Date(ano, mes - 1, dia);
      return dataReserva >= inicio && dataReserva <= fim;
    });
  }

  const datasDisponiveisStr = agendas.map(a => a.data.split('T')[0])

  const agendaDoDia = dataSelecionada 
    ? agendas.find(a => a.data.split('T')[0] === formatarDataLocal(dataSelecionada))
    : undefined

  const slotsAtuais = agendaDoDia?.horarios || []

  if (status === 'loading') {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50">
      <p className="text-slate-600">Carregando...</p>
    </main>
  )
}

if (!session) {
  return null
}

  if (modalidade === 'futebol') {
    return (
      <main className="min-h-screen bg-slate-100 p-6">
        <div className="mx-auto max-w-3xl">
          <Card className="rounded-3xl border-0 shadow-lg">
            <CardHeader className="bg-linear-to-r from-emerald-600 to-emerald-800 rounded-t-3xl text-white">
              <CardTitle className="text-3xl">
                Agendamento de Futebol
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 text-slate-700 p-8">
              <p className="text-lg font-semibold text-center mb-4">
                Agendamento realizado diretamente pela FUTEL
              </p>

              <p className="text-center">
                Para reservar um campo, o responsável deve estar vinculado a um
                time cadastrado administrativamente com a documentação conferida.
                Entre em contato com os canais institucionais para realizar seu agendamento.
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
            Reserva - <span className="text-primary">{nomeModalidade(modalidade)}</span>
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
                    const hoje = new Date();
                    hoje.setHours(0, 0, 0, 0);
                    if (date < hoje) return true;
                    
                    const str = formatarDataLocal(date);
                    return !datasDisponiveisStr.includes(str);
                  }}
                  className="rounded-xl border border-slate-100 shadow-sm p-4 bg-white"
                  classNames={{
                    day_selected: "bg-primary text-white hover:bg-primary/90 hover:text-white focus:bg-primary focus:text-white",
                    day_today: "bg-slate-100 text-slate-900",
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden bg-white">
            <CardHeader className="bg-white border-b border-slate-100 p-6 flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-semibold text-slate-800">
                Horários disponíveis
              </CardTitle>
              {isFetching && (
                <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
              )}
            </CardHeader>

            <CardContent className="p-6 space-y-8">
              <div className="flex flex-wrap gap-3">
                {quadras.map((quadra) => (
                  <Button
                    key={quadra.id}
                    variant={quadraId === quadra.id ? 'default' : 'outline'}
                    onClick={() => setQuadraId(quadra.id)}
                    className={`rounded-full px-6 transition-all ${quadraId === quadra.id ? 'bg-primary hover:bg-primary/90 text-white shadow-md' : 'hover:border-primary hover:text-primary'}`}
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

              {userId && usuarioJaReservouNestaSemana && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 font-medium">
                  Você já possui uma reserva para este fim de semana. Limite de 1 reserva por fim de semana.
                </div>
              )}

              {dataSelecionada && slotsAtuais.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  Nenhum horário liberado para esta data.
                </div>
              ) : (
                <div className={`grid gap-4 sm:grid-cols-2 xl:grid-cols-3 transition-opacity duration-300 ${isFetching ? 'opacity-60 pointer-events-none' : 'opacity-100'}`}>
                  {slotsAtuais.map((slot) => {
                    const ocupado = slotsReservados.includes(slot)
                    const bloqueado = usuarioJaReservouNestaSemana || !userId

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
                              : 'bg-white border-2 border-slate-200 hover:border-secondary hover:shadow-lg cursor-pointer active:scale-95'
                          }
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-lg font-bold ${ocupado ? 'text-slate-500' : 'text-slate-800 group-hover:text-secondary'}`}>
                            {slot}
                          </span>
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full uppercase tracking-wider
                            ${ocupado 
                              ? 'bg-slate-200 text-slate-600' 
                              : bloqueado 
                                ? 'bg-slate-200 text-slate-500'
                                : 'bg-secondary/10 text-secondary'
                            }
                          `}>
                            {ocupado ? 'Ocupado' : bloqueado ? 'Bloqueado' : 'Livre'}
                          </span>
                        </div>
                        {(!ocupado && !bloqueado) && (
                          <div className="absolute inset-0 bg-secondary/5 translate-y-full transition-transform group-hover:translate-y-0" />
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
             if (slotSelecionado) reservar(slotSelecionado, email)
          }}
          quadraNome={quadras.find(q => q.id === quadraId)?.nome || ''}
          data={dataSelecionada?.toLocaleDateString('pt-BR') || ''}
          horario={slotSelecionado || ''}
          emailPadrao={session?.user?.email || ''}
          isSubmitting={carregando}
        />
      </div>
    </main>
  )
}
