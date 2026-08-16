'use client'

import { useEffect, useState, useMemo } from 'react'
import { toast } from 'sonner'
import { Loader2, Calendar as CalendarIcon, Clock, Users, ShieldCheck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { ptBR } from 'date-fns/locale'

type Quadra = {
  id: string
  nome: string
}

type Time = {
  id: string
  nome: string
  status: string
}

type Agenda = {
  id: string
  data: string
  horarios: string[]
}

type Reserva = {
  slot: string
}

function formatarDataLocal(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export default function AdminReservaFutebolPage() {
  const [quadras, setQuadras] = useState<Quadra[]>([])
  const [times, setTimes] = useState<Time[]>([])
  const [agendas, setAgendas] = useState<Agenda[]>([])
  const [reservasExistentes, setReservasExistentes] = useState<Reserva[]>([])

  const [quadraId, setQuadraId] = useState('')
  const [timeId, setTimeId] = useState('')
  const [dataSelecionada, setDataSelecionada] = useState<Date | undefined>(new Date())
  const [slotSelecionado, setSlotSelecionado] = useState<string | null>(null)
  
  const [isFetchingAgendas, setIsFetchingAgendas] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 1. Carregar Quadras de Futebol e Times Aptos
  useEffect(() => {
    async function carregarDados() {
      try {
        const [resQuadras, resTimes] = await Promise.all([
          fetch('/api/quadras?modalidade=futebol'),
          fetch('/api/admin/times')
        ])

        if (resQuadras.ok) {
          const dataQ = await resQuadras.json()
          setQuadras(dataQ)
          if (dataQ.length > 0) setQuadraId(dataQ[0].id)
        }

        if (resTimes.ok) {
          const dataT = await resTimes.json()
          setTimes(dataT.filter((t: Time) => t.status === 'APTO'))
        }
      } catch (error) {
        toast.error('Erro ao carregar dados iniciais.')
      }
    }
    carregarDados()
  }, [])

  // 2. Carregar Agenda da Quadra
  useEffect(() => {
    const controller = new AbortController()
    async function carregarAgendas() {
      if (!quadraId) return
      setIsFetchingAgendas(true)
      try {
        const res = await fetch(`/api/agenda?quadraId=${quadraId}`, { signal: controller.signal })
        if (res.ok) {
          setAgendas(await res.json())
        }
      } catch (err: unknown) {
        if (err.name !== 'AbortError') console.error(err)
      } finally {
        setIsFetchingAgendas(false)
      }
    }
    carregarAgendas()
    return () => controller.abort()
  }, [quadraId])

  // 3. Carregar Reservas do Dia selecionado para bloquear slots ocupados
  useEffect(() => {
    const controller = new AbortController()
    async function carregarReservas() {
      if (!dataSelecionada || !quadraId) return
      const dataFormatada = formatarDataLocal(dataSelecionada)
      setIsFetchingAgendas(true)
      try {
        const res = await fetch(`/api/reservas?data=${dataFormatada}&quadraId=${quadraId}`, { signal: controller.signal })
        if (res.ok) {
          setReservasExistentes(await res.json())
        }
      } catch (err: unknown) {
        if (err.name !== 'AbortError') console.error(err)
      } finally {
        setIsFetchingAgendas(false)
      }
    }
    carregarReservas()
    return () => controller.abort()
  }, [dataSelecionada, quadraId])

  // Lógica de Renderização de Calendário
  const datasDisponiveisStr = useMemo(() => agendas.map(a => a.data.split('T')[0]), [agendas])
  
  const agendaDoDia = useMemo(() => {
    if (!dataSelecionada) return undefined
    return agendas.find(a => a.data.split('T')[0] === formatarDataLocal(dataSelecionada))
  }, [dataSelecionada, agendas])

  const slotsAtuais = agendaDoDia?.horarios || []
  const slotsOcupados = reservasExistentes.map(r => r.slot)

  async function realizarAgendamento() {
    if (!timeId) {
      toast.error('Selecione um time apto para agendar.')
      return
    }
    if (!dataSelecionada || !slotSelecionado || !quadraId) {
      toast.error('Dados de agendamento incompletos.')
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch('/api/admin/reservas/futebol', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timeId,
          quadraId,
          data: formatarDataLocal(dataSelecionada),
          slot: slotSelecionado
        })
      })

      if (res.ok) {
        toast.success('Reserva administrativa de futebol realizada com sucesso!')
        setSlotSelecionado(null)
        // Atualizar reservas visíveis
        const resRefresh = await fetch(`/api/reservas?data=${formatarDataLocal(dataSelecionada)}&quadraId=${quadraId}`)
        if (resRefresh.ok) setReservasExistentes(await resRefresh.json())
      } else {
        const err = await res.json()
        toast.error(err.error || 'Falha ao agendar.')
      }
    } catch (e) {
      toast.error('Erro de conexão ao salvar reserva.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-[#009A44]" />
          Agendamento Administrativo (Futebol)
        </h1>
        <p className="text-slate-500 mt-1">
          Crie reservas atreladas diretamente a times aptos, validando a cota de final de semana.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[400px_1fr]">
        <div className="space-y-6">
          <Card className="border-0 shadow-lg rounded-2xl overflow-hidden bg-white">
            <CardHeader className="bg-[#004B87] text-white p-6">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Users className="w-5 h-5" /> 1. Selecionar Time
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <select
                value={timeId}
                onChange={(e) => setTimeId(e.target.value)}
                className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#004B87] outline-none"
              >
                <option value="" disabled>Escolha um time validado...</option>
                {times.map(t => (
                  <option key={t.id} value={t.id}>{t.nome}</option>
                ))}
              </select>
              {times.length === 0 && (
                <p className="text-xs text-orange-500 mt-2 font-medium">Nenhum time APTO encontrado. Aprove a documentação de um time primeiro.</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg rounded-2xl overflow-hidden bg-white">
            <CardHeader className="bg-[#004B87] text-white p-6">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" /> 2. Escolher Data
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex justify-center">
              <Calendar
                locale={ptBR}
                mode="single"
                selected={dataSelecionada}
                onSelect={setDataSelecionada}
                disabled={(date) => {
                  const hoje = new Date()
                  hoje.setHours(0, 0, 0, 0)
                  if (date < hoje) return true
                  return !datasDisponiveisStr.includes(formatarDataLocal(date))
                }}
                className="rounded-xl border border-slate-100 shadow-sm p-4 bg-white"
                classNames={{
                  day_selected: "bg-[#009A44] text-white hover:bg-[#008A3D] hover:text-white focus:bg-[#009A44] focus:text-white",
                  day_today: "bg-slate-100 text-slate-900",
                }}
              />
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-lg rounded-2xl overflow-hidden bg-white h-fit">
          <CardHeader className="bg-white border-b border-slate-100 p-6 flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-semibold text-slate-800 flex items-center gap-2">
              <Clock className="w-6 h-6 text-[#004B87]" /> 3. Horários e Quadras
            </CardTitle>
            {isFetchingAgendas && <Loader2 className="w-5 h-5 text-[#004B87] animate-spin" />}
          </CardHeader>
          <CardContent className="p-6 space-y-8">
            {/* Seleção de Quadras */}
            <div className="flex flex-wrap gap-3">
              {quadras.map((quadra) => (
                <Button
                  key={quadra.id}
                  variant={quadraId === quadra.id ? 'default' : 'outline'}
                  onClick={() => {
                    setQuadraId(quadra.id)
                    setSlotSelecionado(null)
                  }}
                  className={`rounded-full px-6 transition-all ${quadraId === quadra.id ? 'bg-[#004B87] hover:bg-[#003865] text-white' : 'hover:text-[#004B87] hover:border-[#004B87]'}`}
                >
                  {quadra.nome}
                </Button>
              ))}
            </div>

            {/* Renderização de Slots */}
            {dataSelecionada && slotsAtuais.length === 0 ? (
              <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-xl border border-slate-100">
                Nenhum horário liberado nesta quadra para esta data.
              </div>
            ) : (
              <div className={`grid gap-4 sm:grid-cols-2 xl:grid-cols-3 transition-opacity duration-300 ${isFetchingAgendas ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                {slotsAtuais.map((slot) => {
                  const ocupado = slotsOcupados.includes(slot)
                  const selecionado = slot === slotSelecionado

                  return (
                    <button
                      key={slot}
                      disabled={ocupado || isSubmitting}
                      onClick={() => setSlotSelecionado(slot)}
                      className={`group relative overflow-hidden rounded-xl p-4 text-left transition-all duration-300 border-2
                        ${ocupado 
                          ? 'bg-slate-100 border-slate-200 cursor-not-allowed opacity-70' 
                          : selecionado
                            ? 'bg-[#009A44]/10 border-[#009A44] shadow-md'
                            : 'bg-white border-slate-200 hover:border-[#009A44] hover:shadow-lg cursor-pointer active:scale-95'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-lg font-bold ${ocupado ? 'text-slate-500' : selecionado ? 'text-[#009A44]' : 'text-slate-800 group-hover:text-[#009A44]'}`}>
                          {slot}
                        </span>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full uppercase tracking-wider
                          ${ocupado 
                            ? 'bg-slate-200 text-slate-600' 
                            : selecionado
                              ? 'bg-[#009A44] text-white'
                              : 'bg-slate-100 text-slate-600'
                          }
                        `}>
                          {ocupado ? 'Ocupado' : selecionado ? 'Selecionado' : 'Livre'}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            {/* Resumo e Botão de Ação */}
            {slotSelecionado && (
              <div className="bg-[#004B87]/5 border border-[#004B87]/20 p-6 rounded-2xl flex items-center justify-between animate-in slide-in-from-bottom-4">
                <div>
                  <h4 className="font-bold text-[#004B87]">Confirmar Reserva</h4>
                  <p className="text-sm text-slate-600 mt-1">
                    {dataSelecionada?.toLocaleDateString('pt-BR')} às {slotSelecionado}
                  </p>
                </div>
                <Button 
                  onClick={realizarAgendamento}
                  disabled={isSubmitting || !timeId}
                  className="bg-[#009A44] hover:bg-[#008A3D] text-white px-8 py-6 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all"
                >
                  {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : null}
                  Efetivar Agendamento
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
