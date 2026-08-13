'use client'

import { useEffect, useState, useMemo } from 'react'
import { Printer, Loader2 } from 'lucide-react'

type Quadra = {
  id: string
  nome: string
  ativa?: boolean
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
  quadraId: string
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

export default function ReservasMatrixPage() {
  const [quadras, setQuadras] = useState<Quadra[]>([])
  const [dataBase, setDataBase] = useState<string>(formatarDataLocal(getMonday(new Date())))
  
  const [agendas, setAgendas] = useState<Agenda[]>([])
  const [reservas, setReservas] = useState<Reserva[]>([])
  
  const [carregando, setCarregando] = useState(false)

  // 1. Carregar Quadras
  useEffect(() => {
    async function carregarQuadras() {
      const res = await fetch('/api/admin/quadras')
      if (res.ok) {
        const data: Quadra[] = await res.json()
        const ativas = data.filter((q: Quadra) => q.ativa !== false)
        setQuadras(ativas)
      }
    }
    carregarQuadras()
  }, [])

  // 2. Carregar Agenda da Semana (Todas as Quadras)
  useEffect(() => {
    async function carregarSemana() {
      if (!dataBase) return
      setCarregando(true)
      // Chama sem quadraId para pegar todas
      const res = await fetch(`/api/admin/agenda-semanal?dataBase=${dataBase}`)
      if (res.ok) {
        const data = await res.json()
        setAgendas(data.agendas || [])
        setReservas(data.reservas || [])
      }
      setCarregando(false)
    }
    carregarSemana()
  }, [dataBase])

  const handlePrint = () => {
    window.print()
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

  // O(1) Lookups
  const agendasMap = useMemo(() => {
    const map = new Map<string, Agenda>()
    agendas.forEach(a => {
      const dataStr = a.data.split('T')[0]
      map.set(`${dataStr}-${a.quadraId}`, a)
    })
    return map
  }, [agendas])

  const reservasMap = useMemo(() => {
    const map = new Map<string, Reserva>()
    reservas.forEach(r => {
      const dataStr = r.data.split('T')[0]
      map.set(`${dataStr}-${r.slot}-${r.quadraId}`, r)
    })
    return map
  }, [reservas])

  // Agrupar quadras por modalidade
  const quadrasPorModalidade = useMemo(() => {
    const grupos: Record<string, Quadra[]> = {}
    quadras.forEach(q => {
      const mod = q.modalidade.nome
      if (!grupos[mod]) grupos[mod] = []
      grupos[mod].push(q)
    })
    return Object.entries(grupos).sort((a, b) => a[0].localeCompare(b[0]))
  }, [quadras])

  // CSS for printing - landscape, full width, compact
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
        font-family: Arial, sans-serif;
      }
      .no-print {
        display: none !important;
      }
      @page {
        size: landscape;
        margin: 5mm;
      }
      table { page-break-inside:auto; width: 100%; }
      tr    { page-break-inside:avoid; page-break-after:auto }
      thead { display:table-header-group }
      tfoot { display:table-footer-group }
    }
  `

  return (
    <div className="p-4 md:p-8 space-y-6">
      <style>{printStyles}</style>
      
      {/* Controles (não aparecem na impressão) */}
      <div className="no-print space-y-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Agenda Geral</h1>
            <p className="text-slate-500 mt-1">Visão em matriz (relatório) de todas as quadras.</p>
          </div>
          
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Semana Base</label>
              <input
                type="date"
                value={dataBase}
                onChange={e => setDataBase(e.target.value)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#004B87] text-slate-800 bg-white min-w-[200px]"
              />
            </div>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-sm h-11"
            >
              <Printer className="w-4 h-4" /> Gerar Relatório
            </button>
          </div>
        </div>
      </div>

      {/* Área de Impressão */}
      <div id="print-area" className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-x-auto print:border-none print:shadow-none">
        
        {carregando ? (
          <div className="flex justify-center p-12 no-print">
            <Loader2 className="w-8 h-8 animate-spin text-[#004B87]" />
          </div>
        ) : quadras.length === 0 ? (
          <div className="text-center p-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl m-6">
            Nenhuma quadra ativa encontrada no sistema.
          </div>
        ) : (
          <div className="space-y-12">
            {quadrasPorModalidade.map(([modalidade, quadrasModalidade]) => (
              <div key={modalidade} className="break-inside-avoid">
                <h2 className="text-lg font-black text-slate-800 mb-3 px-1 uppercase tracking-widest border-b-2 border-slate-300 pb-2">{modalidade}</h2>
                <table className="w-full min-w-max border-collapse text-xs">
                  <thead>
                    {/* Título Principal */}
                    <tr>
                      <th colSpan={1} className="border border-slate-300 bg-white p-2 text-left font-bold uppercase tracking-wider whitespace-nowrap">
                        ARENA PARQUETENIS
                      </th>
                      <th colSpan={weekDays.length * quadrasModalidade.length} className="border border-slate-300 bg-slate-100 p-2 text-right text-slate-700 font-medium tracking-wide">
                        {weekDays[0].toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' }).replace('.', '')} – {weekDays[6].toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).replace('.', '')} (Horário Padrão de Brasília - São Paulo)
                      </th>
                    </tr>
                    {/* Dias da Semana */}
                    <tr>
                      <th className="border border-slate-300 bg-slate-50 w-16 p-1"></th>
                      {weekDays.map(day => (
                        <th 
                          key={formatarDataLocal(day)} 
                          colSpan={quadrasModalidade.length} 
                          className="border border-slate-300 bg-slate-200 p-1.5 text-center font-bold text-slate-800 uppercase text-xs"
                        >
                          {day.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}. {day.getDate()}/{day.getMonth() + 1}
                        </th>
                      ))}
                    </tr>
                    {/* Nomes das Quadras */}
                    <tr>
                      <th className="border border-slate-300 bg-white p-1"></th>
                      {weekDays.map(day => (
                        quadrasModalidade.map(q => (
                          <th 
                            key={`${formatarDataLocal(day)}-${q.id}-header`} 
                            className="border border-slate-300 bg-white p-1 text-center font-semibold text-slate-700 min-w-[150px] max-w-[200px]"
                          >
                            {q.nome.toUpperCase()}
                          </th>
                        ))
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allSlots.map(slot => (
                      <tr key={slot}>
                        <td className="border border-slate-300 bg-slate-50 font-bold p-1.5 text-center align-top whitespace-nowrap">
                          {slot.split(' - ')[0] || slot}
                        </td>
                        {weekDays.map(day => {
                          const dataStr = formatarDataLocal(day)
                          
                          return quadrasModalidade.map(quadra => {
                            const agenda = agendasMap.get(`${dataStr}-${quadra.id}`)
                            const isAberto = agenda?.horarios.includes(slot)
                            const reserva = reservasMap.get(`${dataStr}-${slot}-${quadra.id}`)

                            // Célula vazia/fechada
                            if (!isAberto && !reserva) {
                              return (
                                <td key={`${dataStr}-${quadra.id}`} className="border border-slate-200 bg-slate-50/40 p-1">
                                  {/* Fechado */}
                                </td>
                              )
                            }

                            // Célula com Reserva
                            if (reserva) {
                              const cpf = reserva.user.id.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
                              let infoTexto = ''
                              
                              if (reserva.time && reserva.time.responsaveis && reserva.time.responsaveis.length > 0) {
                                const resp = reserva.time.responsaveis[0]
                                const cpfClean = resp.cpf.replace(/\D/g, '')
                                const telClean = resp.telefone || ''
                                infoTexto = `${reserva.time.nome.toUpperCase()} CPF ${cpfClean} TEF ${telClean}`
                              } else {
                                infoTexto = `${reserva.user.name.toUpperCase()} CPF ${cpf}`
                              }

                              return (
                                <td key={`${dataStr}-${quadra.id}`} className="border-[1.5px] border-slate-800 bg-white p-1.5 align-top hover:bg-slate-50 transition-colors cursor-default">
                                  <div className="font-bold leading-[1.1] break-words text-[10px] text-slate-900 uppercase">
                                    {quadra.nome.toUpperCase()} {infoTexto} {slot}
                                  </div>
                                </td>
                              )
                            }

                            // Célula Livre
                            return (
                              <td key={`${dataStr}-${quadra.id}`} className="border border-slate-300 bg-white p-1 text-center text-[10px] text-slate-300 font-medium align-middle hover:bg-slate-50 transition-colors">
                                {/* Opcional: exibir "Livre" ou deixar em branco como na imagem */}
                              </td>
                            )
                          })
                        })}
                      </tr>
                    ))}
                    {allSlots.length === 0 && (
                      <tr>
                        <td colSpan={(weekDays.length * quadrasModalidade.length) + 1} className="p-8 text-center text-slate-500 border border-slate-300 font-medium">
                          Nenhuma agenda disponível para a semana base selecionada.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
