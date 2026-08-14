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

export default function AgendaDiariaPage() {
  const [dataSelecionada, setDataSelecionada] = useState<string>(formatarDataLocal(new Date()))
  
  const [modalidadeSelecionada, setModalidadeSelecionada] = useState<string>('todas')
  const [quadraSelecionada, setQuadraSelecionada] = useState<string>('todas')

  const [modalidades, setModalidades] = useState<string[]>([])
  const [todasQuadras, setTodasQuadras] = useState<Quadra[]>([])
  
  const [quadras, setQuadras] = useState<Quadra[]>([])
  const [agendas, setAgendas] = useState<Agenda[]>([])
  const [reservas, setReservas] = useState<Reserva[]>([])
  
  const [carregando, setCarregando] = useState(false)

  // 1. Carregar Dados Iniciais (Para preencher os filtros)
  useEffect(() => {
    async function carregarFiltros() {
      const res = await fetch('/api/admin/quadras')
      if (res.ok) {
        const data: Quadra[] = await res.json()
        const ativas = data.filter((q: Quadra) => q.ativa !== false)
        setTodasQuadras(ativas)

        const mods = Array.from(new Set(ativas.map(q => q.modalidade.nome))).sort()
        setModalidades(mods)
      }
    }
    carregarFiltros()
  }, [])

  // 2. Carregar Agenda do Dia Selecionado com filtros
  useEffect(() => {
    async function carregarDia() {
      if (!dataSelecionada) return
      setCarregando(true)
      
      const queryParams = new URLSearchParams({ data: dataSelecionada })
      if (modalidadeSelecionada !== 'todas') queryParams.append('modalidade', modalidadeSelecionada)
      if (quadraSelecionada !== 'todas') queryParams.append('quadraId', quadraSelecionada)

      const res = await fetch(`/api/admin/agenda-diaria?${queryParams.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setQuadras(data.quadras || [])
        setAgendas(data.agendas || [])
        setReservas(data.reservas || [])
      }
      setCarregando(false)
    }
    carregarDia()
  }, [dataSelecionada, modalidadeSelecionada, quadraSelecionada])

  const handlePrint = () => {
    window.print()
  }

  // Preparação de dados para a Grid
  const allSlots = useMemo(() => gerarSlotsUnicos(agendas), [agendas])

  // O(1) Lookups
  const agendasMap = useMemo(() => {
    const map = new Map<string, Agenda>()
    agendas.forEach(a => {
      map.set(a.quadraId, a)
    })
    return map
  }, [agendas])

  const reservasMap = useMemo(() => {
    const map = new Map<string, Reserva>()
    reservas.forEach(r => {
      map.set(`${r.slot}-${r.quadraId}`, r)
    })
    return map
  }, [reservas])

  // Agrupar quadras por modalidade para exibição na tabela
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
            <h1 className="text-3xl font-bold text-slate-800">Agenda Diária</h1>
            <p className="text-slate-500 mt-1">Ocupação diária das quadras e campos.</p>
          </div>
          
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Data Base</label>
              <input
                type="date"
                value={dataSelecionada}
                onChange={e => setDataSelecionada(e.target.value)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#004B87] text-slate-800 bg-white min-w-[160px]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Modalidade</label>
              <select
                value={modalidadeSelecionada}
                onChange={e => {
                  setModalidadeSelecionada(e.target.value)
                  setQuadraSelecionada('todas') // Reseta a quadra ao mudar modalidade
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#004B87] text-slate-800 bg-white min-w-[140px]"
              >
                <option value="todas">Todas</option>
                {modalidades.map(mod => (
                  <option key={mod} value={mod}>{mod}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Quadra</label>
              <select
                value={quadraSelecionada}
                onChange={e => setQuadraSelecionada(e.target.value)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#004B87] text-slate-800 bg-white min-w-[140px]"
              >
                <option value="todas">Todas</option>
                {todasQuadras
                  .filter(q => modalidadeSelecionada === 'todas' || q.modalidade.nome === modalidadeSelecionada)
                  .map(q => (
                  <option key={q.id} value={q.id}>{q.nome}</option>
                ))}
              </select>
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
            Nenhuma quadra ativa ou com filtros correspondentes encontrada.
          </div>
        ) : (
          <div className="space-y-12">
            {quadrasPorModalidade.map(([modalidade, quadrasModalidade]) => (
              <div key={modalidade} className="break-inside-avoid">
                <h2 className="text-lg font-black text-slate-800 mb-3 px-1 uppercase tracking-widest border-b-2 border-slate-300 pb-2">
                  {modalidade} - {dataSelecionada.split('-').reverse().join('/')}
                </h2>
                
                <table className="w-full min-w-max border-collapse text-xs">
                  <thead>
                    <tr>
                      <th className="border border-slate-300 bg-slate-100 p-2 text-center font-bold text-slate-800 uppercase w-20">
                        Horário
                      </th>
                      {quadrasModalidade.map(q => (
                        <th 
                          key={q.id} 
                          className="border border-slate-300 bg-white p-2 text-center font-bold text-slate-700 uppercase"
                        >
                          {q.nome}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allSlots.map(slot => {
                      const hasAnyActivity = quadrasModalidade.some(quadra => {
                        const agenda = agendasMap.get(quadra.id)
                        const isAberto = agenda?.horarios.includes(slot)
                        const reserva = reservasMap.get(`${slot}-${quadra.id}`)
                        return isAberto || !!reserva
                      })

                      if (!hasAnyActivity) return null;

                      return (
                      <tr key={slot}>
                        <td className="border border-slate-300 bg-slate-50 font-bold p-2 text-center whitespace-nowrap text-slate-800">
                          {slot.split(' - ')[0] || slot}
                        </td>
                        {quadrasModalidade.map(quadra => {
                          const agenda = agendasMap.get(quadra.id)
                          const isAberto = agenda?.horarios.includes(slot)
                          const reserva = reservasMap.get(`${slot}-${quadra.id}`)

                          // Célula Fechada
                          if (!isAberto && !reserva) {
                            return (
                              <td key={quadra.id} className="border border-slate-200 bg-slate-100/50 p-2 text-center text-slate-400 italic">
                                Fechado
                              </td>
                            )
                          }

                          // Célula Reservada
                          if (reserva) {
                            const cpf = reserva.user.id.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
                            let infoTexto = ''
                            let subInfo = ''
                            
                            if (reserva.time && reserva.time.responsaveis && reserva.time.responsaveis.length > 0) {
                              const resp = reserva.time.responsaveis[0]
                              const telClean = resp.telefone || ''
                              infoTexto = `${reserva.time.nome.toUpperCase()} (TIME)`
                              subInfo = `Resp: ${resp.nome.toUpperCase()} - Tel: ${telClean}`
                            } else {
                              infoTexto = reserva.user.name.toUpperCase()
                              subInfo = `CPF: ${cpf}`
                            }

                            return (
                              <td key={quadra.id} className="border-2 border-[#004B87] bg-blue-50/30 p-2 align-middle hover:bg-blue-50 transition-colors cursor-default">
                                <div className="font-bold text-slate-900 text-sm">{infoTexto}</div>
                                <div className="text-slate-600 font-medium mt-1">{subInfo}</div>
                              </td>
                            )
                          }

                          // Célula Livre
                          return (
                            <td key={quadra.id} className="border border-slate-300 bg-white p-2 text-center text-emerald-600 font-semibold align-middle hover:bg-slate-50 transition-colors">
                              Livre
                            </td>
                          )
                        })}
                      </tr>
                      )
                    })}
                    {allSlots.length === 0 && (
                      <tr>
                        <td colSpan={quadrasModalidade.length + 1} className="p-8 text-center text-slate-500 border border-slate-300 font-medium">
                          Nenhuma agenda disponível nesta data.
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
