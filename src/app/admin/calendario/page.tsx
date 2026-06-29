'use client'

import { useEffect, useState, useCallback } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import { Plus, Trash2, CalendarPlus, Clock, Loader2 } from 'lucide-react'

type Quadra = {
  id: string
  nome: string
  modalidade: { id: string; nome: string }
}

type Agenda = {
  id: string
  data: string
  quadraId: string
  horarios: string[]
}

function formatarDataLocal(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const SLOTS_PADRAO = [
  '06:00-08:00', '08:00-10:00', '10:00-12:00', '12:00-14:00',
  '14:00-16:00', '16:00-18:00', '18:00-20:00', '20:00-21:45',
]

const SLOTS_TENIS = [
  '06:00-07:00', '07:00-08:00', '08:00-09:00', '09:00-10:00',
  '10:00-11:00', '11:00-12:00', '12:00-13:00', '13:00-14:00',
  '14:00-15:00', '15:00-16:00', '16:00-17:00', '17:00-18:00',
  '18:00-19:00', '19:00-20:00', '20:00-21:00', '21:00-21:45',
]

export default function AdminCalendarioPage() {
  const [quadras, setQuadras] = useState<Quadra[]>([])
  const [quadraId, setQuadraId] = useState('')
  const [dataSelecionada, setDataSelecionada] = useState<Date | undefined>(new Date())
  const [agendas, setAgendas] = useState<Agenda[]>([])
  const [agendaDoDia, setAgendaDoDia] = useState<Agenda | null>(null)
  const [horariosEditando, setHorariosEditando] = useState<string[]>([])
  const [salvando, setSalvando] = useState(false)
  const [novoSlot, setNovoSlot] = useState('')

  const quadraSelecionada = quadras.find(q => q.id === quadraId)
  const ehTenis = quadraSelecionada?.modalidade.nome === 'Tênis'

  useEffect(() => {
    async function carregarQuadras() {
      const res = await fetch('/api/admin/quadras')
      if (res.ok) {
        const data = await res.json()
        setQuadras(data)
        if (data.length > 0) setQuadraId(data[0].id)
      }
    }
    carregarQuadras()
  }, [])

  const carregarAgendas = useCallback(async () => {
    if (!quadraId) return
    const res = await fetch(`/api/agenda?quadraId=${quadraId}`)
    if (res.ok) {
      const data = await res.json()
      setAgendas(data)
    }
  }, [quadraId])

  useEffect(() => {
    carregarAgendas()
  }, [carregarAgendas])

  useEffect(() => {
    if (!dataSelecionada || !quadraId) {
      setAgendaDoDia(null)
      setHorariosEditando([])
      return
    }
    const str = formatarDataLocal(dataSelecionada)
    const encontrada = agendas.find(a => a.data.split('T')[0] === str)
    setAgendaDoDia(encontrada || null)
    setHorariosEditando(encontrada?.horarios || [])
  }, [dataSelecionada, agendas, quadraId])

  async function salvarAgenda() {
    if (!dataSelecionada || !quadraId) return
    if (horariosEditando.length === 0) {
      toast.error('Adicione pelo menos um horário.')
      return
    }

    setSalvando(true)
    const dataFormatada = formatarDataLocal(dataSelecionada)

    const res = await fetch('/api/admin/agenda', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: dataFormatada,
        quadraId,
        horarios: horariosEditando.sort(),
      }),
    })

    setSalvando(false)

    if (res.ok) {
      toast.success(agendaDoDia ? 'Agenda atualizada!' : 'Dia aberto com sucesso!')
      carregarAgendas()
    } else {
      const err = await res.json()
      toast.error(err.error || 'Erro ao salvar agenda.')
    }
  }

  async function removerAgenda() {
    if (!agendaDoDia) return

    if (!confirm('Tem certeza que deseja fechar este dia? Os horários serão removidos.')) return

    const res = await fetch(`/api/admin/agenda?id=${agendaDoDia.id}`, {
      method: 'DELETE',
    })

    if (res.ok) {
      toast.success('Dia fechado com sucesso!')
      carregarAgendas()
    } else {
      toast.error('Erro ao fechar dia.')
    }
  }

  function preencherPadrao() {
    setHorariosEditando(ehTenis ? [...SLOTS_TENIS] : [...SLOTS_PADRAO])
  }

  function toggleSlot(slot: string) {
    setHorariosEditando(prev =>
      prev.includes(slot)
        ? prev.filter(s => s !== slot)
        : [...prev, slot].sort()
    )
  }

  function adicionarSlotCustom() {
    const regex = /^\d{2}:\d{2}-\d{2}:\d{2}$/
    if (!regex.test(novoSlot)) {
      toast.error('Use o formato HH:MM-HH:MM (ex: 07:00-09:00)')
      return
    }
    if (horariosEditando.includes(novoSlot)) {
      toast.error('Esse horário já está na lista.')
      return
    }
    setHorariosEditando(prev => [...prev, novoSlot].sort())
    setNovoSlot('')
  }

  const datasComAgenda = agendas.map(a => a.data.split('T')[0])

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Calendário de Agendas</h1>
        <p className="text-slate-500 mt-1">Abra datas e defina os horários disponíveis para cada quadra.</p>
      </div>

      {/* Seleção de Quadra */}
      <div className="flex flex-wrap gap-3">
        {quadras.map((q) => (
          <button
            key={q.id}
            onClick={() => setQuadraId(q.id)}
            className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
              quadraId === q.id
                ? 'bg-[#004B87] text-white shadow-md'
                : 'bg-white text-slate-700 border border-slate-200 hover:border-[#004B87] hover:text-[#004B87]'
            }`}
          >
            {q.nome} <span className="text-xs opacity-70">({q.modalidade.nome})</span>
          </button>
        ))}
        {quadras.length === 0 && (
          <p className="text-slate-400 text-sm">Nenhuma quadra cadastrada. Cadastre uma quadra primeiro.</p>
        )}
      </div>

      {quadraId && (
        <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
          {/* Calendário */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-5">
              <h2 className="text-lg font-semibold">Selecionar Data</h2>
              <p className="text-slate-300 text-sm mt-1">Dias com agenda aberta ficam destacados.</p>
            </div>
            <div className="p-6 flex justify-center">
              <Calendar
                locale={ptBR}
                mode="single"
                selected={dataSelecionada}
                onSelect={setDataSelecionada}
                className="rounded-xl border border-slate-100 shadow-sm p-4 bg-white"
                modifiers={{
                  agendaAberta: (date) => {
                    const str = formatarDataLocal(date)
                    return datasComAgenda.includes(str)
                  },
                }}
                modifiersClassNames={{
                  agendaAberta: 'bg-emerald-100 text-emerald-800 font-bold',
                }}
              />
            </div>
            <div className="px-6 pb-6">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <div className="w-3 h-3 rounded-full bg-emerald-200 border border-emerald-400" />
                Dia com agenda aberta
              </div>
            </div>
          </div>

          {/* Editor de Horários */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  {dataSelecionada
                    ? dataSelecionada.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                    : 'Selecione uma data'}
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  {agendaDoDia ? '✅ Dia aberto — editando horários' : '🔒 Dia fechado — adicione horários e salve para abrir'}
                </p>
              </div>

              {agendaDoDia && (
                <button
                  onClick={removerAgenda}
                  className="flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-xl transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Fechar Dia
                </button>
              )}
            </div>

            <div className="p-6 space-y-6">
              {/* Quick Actions */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={preencherPadrao}
                  className="flex items-center gap-2 text-sm font-semibold text-[#004B87] bg-blue-50 hover:bg-blue-100 px-4 py-2.5 rounded-xl transition-colors"
                >
                  <CalendarPlus className="w-4 h-4" />
                  Gerar Horários Padrão {ehTenis ? '(Tênis 1h)' : '(2h)'}
                </button>

                <button
                  onClick={() => setHorariosEditando([])}
                  className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 px-4 py-2.5 rounded-xl transition-colors"
                >
                  Limpar Todos
                </button>
              </div>

              {/* Toggle de Slots */}
              <div>
                <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Horários ({horariosEditando.length} selecionados)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                  {(ehTenis ? SLOTS_TENIS : SLOTS_PADRAO).map((slot) => {
                    const ativo = horariosEditando.includes(slot)
                    return (
                      <button
                        key={slot}
                        onClick={() => toggleSlot(slot)}
                        className={`px-3 py-3 rounded-xl text-sm font-semibold border-2 transition-all ${
                          ativo
                            ? 'border-[#009A44] bg-emerald-50 text-emerald-800'
                            : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        {slot}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Slot customizado */}
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Adicionar horário customizado
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 07:00-09:00"
                    value={novoSlot}
                    onChange={(e) => setNovoSlot(e.target.value)}
                    className="w-full mt-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#004B87] focus:border-transparent"
                  />
                </div>
                <button
                  onClick={adicionarSlotCustom}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Horários Selecionados que não são padrão */}
              {horariosEditando.filter(h => !(ehTenis ? SLOTS_TENIS : SLOTS_PADRAO).includes(h)).length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Horários customizados</h4>
                  <div className="flex flex-wrap gap-2">
                    {horariosEditando.filter(h => !(ehTenis ? SLOTS_TENIS : SLOTS_PADRAO).includes(h)).map(slot => (
                      <span key={slot} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-50 text-violet-700 text-sm font-semibold border border-violet-200">
                        {slot}
                        <button onClick={() => toggleSlot(slot)} className="hover:text-red-600">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Botão Salvar */}
              <button
                onClick={salvarAgenda}
                disabled={salvando || horariosEditando.length === 0}
                className="w-full flex items-center justify-center gap-2 bg-[#009A44] hover:bg-[#008A3D] disabled:bg-slate-300 text-white font-bold py-3.5 rounded-xl text-base transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
              >
                {salvando ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <CalendarPlus className="w-5 h-5" />
                )}
                {salvando ? 'Salvando...' : agendaDoDia ? 'Atualizar Horários' : 'Abrir Este Dia'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
