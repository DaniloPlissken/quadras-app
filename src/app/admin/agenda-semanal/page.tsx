'use client'

import { useEffect, useState, useMemo } from 'react'
import { toast } from 'sonner'
import { Printer, Lock, Loader2, Calendar as CalendarIcon, User, Users, X } from 'lucide-react'

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

type Responsavel = {
  nome: string
  cpf: string
  telefone: string
}

type Time = {
  id: string
  nome: string
  responsaveis: Responsavel[]
}

type Reserva = {
  id: string
  data: string
  slot: string
  status: string
  user: { id: string; name: string; email: string }
  time?: Time
}

// Utilitários de data
function getMonday(d: Date) {
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const mon = new Date(d.setDate(diff))
  mon.setHours(0, 0, 0, 0)
  return mon
}

function getWeekDays(monday: Date) {
  const days = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    days.push(d)
  }
  return days
}

function formatarDataLocal(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function gerarSlotsUnicos(agendas: Agenda[]) {
  const slots = new Set<string>()
  agendas.forEach(a => {
    a.horarios.forEach(h => slots.add(h))
  })
  return Array.from(slots).sort()
}

export default function AgendaSemanalPage() {
  const [quadras, setQuadras] = useState<Quadra[]>([])
  const [quadraId, setQuadraId] = useState('')
  const [dataBase, setDataBase] = useState<string>(formatarDataLocal(getMonday(new Date())))
  
  const [agendas, setAgendas] = useState<Agenda[]>([])
  const [reservas, setReservas] = useState<Reserva[]>([])
  
  const [carregando, setCarregando] = useState(false)
  const [bloqueando, setBloqueando] = useState(false)
  
  const [reservaModal, setReservaModal] = useState<Reserva | null>(null)

  // 1. Carregar Quadras
  useEffect(() => {
    async function carregarQuadras() {
      const res = await fetch('/api/admin/quadras')
      if (res.ok) {
        const data = await res.json()
        const ativas = data.filter((q: any) => q.ativa !== false)
        setQuadras(ativas)
        if (ativas.length > 0) setQuadraId(ativas[0].id)
      }
    }
    carregarQuadras()
  }, [])

  // 2. Carregar Agenda da Semana
  useEffect(() => {
    async function carregarSemana() {
      if (!quadraId || !dataBase) return
      setCarregando(true)
      const res = await fetch(`/api/admin/agenda-semanal?dataBase=${dataBase}&quadraId=${quadraId}`)
      if (res.ok) {
        const data = await res.json()
        setAgendas(data.agendas)
        setReservas(data.reservas)
      }
      setCarregando(false)
    }
    carregarSemana()
  }, [quadraId, dataBase])

  const handlePrint = () => {
    window.print()
  }

  const handleBloquear = async () => {
    if (!confirm('Tem certeza que deseja fechar todos os horários livres desta semana?\nEles ficarão indisponíveis para novas reservas.')) {
      return
    }

    setBloqueando(true)
    const res = await fetch('/api/admin/agenda-semanal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataBase, quadraId })
    })
    
    setBloqueando(false)

    if (res.ok) {
      const data = await res.json()
      toast.success(`Semana bloqueada! ${data.horariosBloqueados} horários livres foram fechados.`)
      
      // Recarrega os dados
      setCarregando(true)
      const reload = await fetch(`/api/admin/agenda-semanal?dataBase=${dataBase}&quadraId=${quadraId}`)
      if (reload.ok) {
        const d = await reload.json()
        setAgendas(d.agendas)
        setReservas(d.reservas)
      }
      setCarregando(false)
    } else {
      toast.error('Erro ao bloquear a semana.')
    }
  }

  // Preparação de dados para a Grid
  const mondayDate = useMemo(() => {
    const d = new Date(dataBase + 'T12:00:00Z')
    const day = d.getUTCDay()
    const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1)
    const mon = new Date(d)
    mon.setUTCDate(diff)
    return mon
  }, [dataBase])

  const weekDays = useMemo(() => getWeekDays(mondayDate), [mondayDate])
  const allSlots = useMemo(() => gerarSlotsUnicos(agendas), [agendas])
  const quadraSelecionada = quadras.find(q => q.id === quadraId)

  // CSS for printing
  const printStyles = `
    @media print {
      body * {
        visibility: hidden;
      }
      #print-area, #print-area * {
        visibility: visible;
      }
      #print-area {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        margin: 0;
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
      table { page-break-inside:auto }
      tr    { page-break-inside:avoid; page-break-after:auto }
      thead { display:table-header-group }
      tfoot { display:table-footer-group }
    }
  `

  return (
    <div className="p-8 space-y-6">
      <style>{printStyles}</style>
      
      {/* Controles (não aparecem na impressão) */}
      <div className="no-print space-y-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Agenda Semanal</h1>
            <p className="text-slate-500 mt-1">Gerencie, visualize e extraia relatórios da grade de horários da semana.</p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-sm"
            >
              <Printer className="w-4 h-4" /> Exportar / Imprimir
            </button>
            <button
              onClick={handleBloquear}
              disabled={bloqueando || carregando}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-400 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-sm"
            >
              {bloqueando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              Bloquear Semana
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-wrap gap-6 items-end">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Quadra / Campo</label>
            <select
              value={quadraId}
              onChange={e => setQuadraId(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#004B87] text-slate-800 bg-white min-w-[200px]"
            >
              {quadras.map(q => (
                <option key={q.id} value={q.id}>{q.nome} ({q.modalidade.nome})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Data (Qualquer dia da semana)</label>
            <input
              type="date"
              value={dataBase}
              onChange={e => setDataBase(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#004B87] text-slate-800 bg-white"
            />
          </div>
        </div>
      </div>

      {/* Área de Impressão */}
      <div id="print-area" className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 lg:p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-800 uppercase tracking-widest">Relatório Semanal de Agenda</h2>
          <p className="text-lg text-slate-600 font-medium mt-2">
            {quadraSelecionada?.nome} — {quadraSelecionada?.modalidade.nome}
          </p>
          <p className="text-slate-500 mt-1">
            Semana de {weekDays[0].toLocaleDateString('pt-BR')} até {weekDays[6].toLocaleDateString('pt-BR')}
          </p>
        </div>

        {carregando ? (
          <div className="flex justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#004B87]" />
          </div>
        ) : allSlots.length === 0 ? (
          <div className="text-center p-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
            Nenhuma agenda aberta para esta quadra nesta semana.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse table-fixed min-w-[900px]">
              <thead>
                <tr>
                  <th className="w-24 border border-slate-300 bg-slate-100 p-3 text-sm font-bold text-slate-700 uppercase">
                    <Clock className="w-4 h-4 mx-auto mb-1" />
                    Horário
                  </th>
                  {weekDays.map(day => {
                    const str = formatarDataLocal(day)
                    const isToday = str === formatarDataLocal(new Date())
                    return (
                      <th key={str} className={`border border-slate-300 p-3 text-sm font-bold uppercase ${isToday ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-50 text-slate-700'}`}>
                        {day.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}
                        <div className="text-lg font-black mt-1">
                          {day.getDate().toString().padStart(2, '0')}
                        </div>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {allSlots.map(slot => (
                  <tr key={slot}>
                    <td className="border border-slate-300 bg-slate-50 font-bold text-sm text-slate-700 p-2">
                      {slot}
                    </td>
                    {weekDays.map(day => {
                      const dataStr = formatarDataLocal(day)
                      // Verifica se existe agenda pra essa data contendo esse slot
                      const agendaDoDia = agendas.find(a => a.data.split('T')[0] === dataStr)
                      const isSlotAberto = agendaDoDia?.horarios.includes(slot)

                      if (!isSlotAberto) {
                        return (
                          <td key={dataStr} className="border border-slate-300 bg-slate-100/50 p-2 text-transparent select-none">
                            -
                          </td>
                        )
                      }

                      // Verifica se tem reserva
                      const reserva = reservas.find(r => r.data.split('T')[0] === dataStr && r.slot === slot)

                      if (reserva) {
                        return (
                          <td 
                            key={dataStr} 
                            onClick={() => setReservaModal(reserva)}
                            className="border border-slate-300 bg-blue-50 hover:bg-blue-100 cursor-pointer p-2 align-middle no-print-hover transition-colors"
                          >
                            <div className="flex flex-col items-center justify-center h-full min-h-[4rem]">
                              {reserva.time ? (
                                <>
                                  <Users className="w-4 h-4 text-[#004B87] mb-1" />
                                  <span className="text-xs font-bold text-[#004B87] leading-tight line-clamp-2">
                                    {reserva.time.nome}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <User className="w-4 h-4 text-emerald-700 mb-1" />
                                  <span className="text-xs font-bold text-emerald-700 leading-tight line-clamp-2">
                                    {reserva.user.name}
                                  </span>
                                </>
                              )}
                            </div>
                          </td>
                        )
                      }

                      return (
                        <td key={dataStr} className="border border-slate-300 bg-white p-2">
                          <div className="flex items-center justify-center h-full min-h-[4rem] text-xs font-semibold text-emerald-500 uppercase tracking-widest opacity-60">
                            Livre
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Detalhamento da Reserva (não imprime) */}
      {reservaModal && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-slate-50 px-6 py-5 border-b border-slate-200 flex items-center justify-between shrink-0">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-[#004B87]" />
                Detalhes da Reserva
              </h2>
              <button
                onClick={() => setReservaModal(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Data</p>
                  <p className="font-semibold text-slate-800">
                    {new Date(reservaModal.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Horário</p>
                  <p className="font-semibold text-[#004B87]">{reservaModal.slot}</p>
                </div>
              </div>

              {reservaModal.time ? (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-blue-50 px-4 py-3 border-b border-slate-200">
                    <h3 className="font-bold text-[#004B87] flex items-center gap-2">
                      <Users className="w-4 h-4" /> Time: {reservaModal.time.nome}
                    </h3>
                  </div>
                  <div className="p-4 space-y-4">
                    {reservaModal.time.responsaveis?.map((r, i) => (
                      <div key={i} className="text-sm">
                        <p className="font-bold text-slate-700">Responsável {i + 1}: {r.nome}</p>
                        <p className="text-slate-500">CPF: {r.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}</p>
                        <p className="text-slate-500">Telefone: {r.telefone}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-emerald-50 px-4 py-3 border-b border-slate-200">
                    <h3 className="font-bold text-emerald-800 flex items-center gap-2">
                      <User className="w-4 h-4" /> Usuário Avulso
                    </h3>
                  </div>
                  <div className="p-4 text-sm">
                    <p className="font-bold text-slate-700">Nome: {reservaModal.user.name}</p>
                    <p className="text-slate-500">CPF: {reservaModal.user.id.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}</p>
                    <p className="text-slate-500">Email: {reservaModal.user.email}</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 text-right">
              <button
                onClick={() => setReservaModal(null)}
                className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
