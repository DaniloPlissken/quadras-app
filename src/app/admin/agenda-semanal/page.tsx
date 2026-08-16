'use client'

import { useEffect, useState, useMemo } from 'react'
import { Printer, Loader2, FileText, FileSpreadsheet } from 'lucide-react'
import { CellFechado, CellLivre, CellReserva } from '@/components/AgendaCells'
import { prepareExportData, downloadCSV, downloadExcel } from '@/lib/exportUtils'

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
  pessoa: {
    nome: string
    cpf: string
    telefone: string
  }
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
  user: { id: string; name: string; email: string; telefone?: string }
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

function formatarDataLocal(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function gerarSlotsUnicos(reservas: Reserva[]) {
  const slots = new Set<string>()
  reservas.forEach(r => slots.add(r.slot))
  return Array.from(slots).sort()
  return Array.from(slots).sort()
}

export default function AgendaSemanalPage() {
  const [dataBase, setDataBase] = useState<string>(formatarDataLocal(getMonday(new Date())))
  
  const [modalidadeSelecionada, setModalidadeSelecionada] = useState<string>('todas')
  const [quadraSelecionada, setQuadraSelecionada] = useState<string>('todas')

  const [modalidades, setModalidades] = useState<string[]>([])
  const [todasQuadras, setTodasQuadras] = useState<Quadra[]>([])
  
  const [agendas, setAgendas] = useState<Agenda[]>([])
  const [reservas, setReservas] = useState<Reserva[]>([])
  
  const [carregando, setCarregando] = useState(true)
  const [isFetching, setIsFetching] = useState(false)

  // 1. Carregar Quadras (Para preencher filtros)
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

  // 2. Carregar Agenda da Semana (Com filtro de Quadra opcional)
  useEffect(() => {
    const controller = new AbortController()
    const signal = controller.signal

    async function carregarSemana() {
      if (!dataBase) return
      setIsFetching(true)
      
      const queryParams = new URLSearchParams({ dataBase })
      if (quadraSelecionada !== 'todas') queryParams.append('quadraId', quadraSelecionada)

      try {
        const res = await fetch(`/api/admin/agenda-semanal?${queryParams.toString()}`, { signal })
        if (res.ok) {
          const data = await res.json()
          setAgendas(data.agendas || [])
          setReservas(data.reservas || [])
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Erro ao buscar agenda da semana:', err)
        }
      } finally {
        setIsFetching(false)
        setCarregando(false)
      }
    }
    carregarSemana()

    return () => { controller.abort() }
  }, [dataBase, quadraSelecionada])

  const handlePrint = () => {
    window.print()
  }

  // Filtrar quadras baseado na seleção (modalidade e quadra específica)
  const quadrasFiltradas = useMemo(() => {
    return todasQuadras.filter(q => {
      const matchModalidade = modalidadeSelecionada === 'todas' || q.modalidade.nome === modalidadeSelecionada;
      const matchQuadra = quadraSelecionada === 'todas' || q.id === quadraSelecionada;
      return matchModalidade && matchQuadra;
    });
  }, [todasQuadras, modalidadeSelecionada, quadraSelecionada])

  // Preparação de dados para a Grid
  const allSlots = useMemo(() => {
    const resFiltradas = reservas.filter(r => quadrasFiltradas.some(q => q.id === r.quadraId))
    return gerarSlotsUnicos(resFiltradas)
  }, [reservas, quadrasFiltradas])

  // Dias Dinâmicos baseados nas reservas abertas
  const weekDays = useMemo(() => {
    // Pega as datas únicas no formato "YYYY-MM-DD" que têm alguma reserva
    const datasComReserva = reservas
      .filter(a => quadrasFiltradas.some(q => q.id === a.quadraId))
      .map(a => a.data.split('T')[0])

    const datasUnicasStr = Array.from(new Set(datasComReserva)).sort()
    
    return datasUnicasStr.map(str => {
      const [ano, mes, dia] = str.split('-').map(Number)
      return new Date(ano, mes - 1, dia, 12, 0, 0) // Usar meio-dia local para evitar problemas de timezone
    })
  }, [reservas, quadrasFiltradas])

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
    quadrasFiltradas.forEach(q => {
      const mod = q.modalidade.nome
      if (!grupos[mod]) grupos[mod] = []
      grupos[mod].push(q)
    })
    return Object.entries(grupos).sort((a, b) => a[0].localeCompare(b[0]))
  }, [quadrasFiltradas])

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
            <p className="text-slate-500 mt-1">Ocupação das quadras e campos.</p>
          </div>
          
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Semana Base</label>
              <input
                type="date"
                value={dataBase}
                onChange={e => setDataBase(e.target.value)}
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

            <div className="flex gap-2">
              <button
                onClick={() => {
                  const [ano, mes, dia] = dataBase.split('-');
                  const filename = `quadras-app-${dia}-${mes}-${ano}`;
                  const data = prepareExportData(weekDays, allSlots, quadrasFiltradas, agendasMap, reservasMap);
                  downloadCSV(data, filename);
                }}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-semibold transition-all shadow-sm h-11"
                title="Exportar para CSV"
              >
                <FileText className="w-4 h-4" /> CSV
              </button>
              <button
                onClick={() => {
                  const [ano, mes, dia] = dataBase.split('-');
                  const filename = `quadras-app-${dia}-${mes}-${ano}`;
                  downloadExcel(weekDays, allSlots, quadrasFiltradas, agendasMap, reservasMap, filename);
                }}
                className="flex items-center gap-2 bg-[#004B87] hover:bg-blue-800 text-white px-4 py-2.5 rounded-xl font-semibold transition-all shadow-sm h-11"
                title="Exportar para Excel"
              >
                <FileSpreadsheet className="w-4 h-4" /> Excel
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl font-semibold transition-all shadow-sm h-11"
                title="Imprimir Relatório"
              >
                <Printer className="w-4 h-4" /> Imprimir
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Área de Impressão */}
      <div id="print-area" className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-x-auto print:border-none print:shadow-none">
        
        {/* Indicador visual de background fetching */}
        <div className={`h-1 w-full bg-slate-100 overflow-hidden no-print transition-opacity duration-300 ${isFetching && !carregando ? 'opacity-100' : 'opacity-0'}`}>
          <div className="h-full bg-blue-500 w-1/3 animate-[slide_1.5s_ease-in-out_infinite]"></div>
        </div>

        {carregando ? (
          <div className="flex justify-center p-12 no-print">
            <Loader2 className="w-8 h-8 animate-spin text-[#004B87]" />
          </div>
        ) : quadrasFiltradas.length === 0 || allSlots.length === 0 ? (
          <div className="text-center p-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl m-6">
            Nenhuma reserva encontrada para a semana selecionada.
          </div>
        ) : (
          <div className={`transition-opacity duration-300 ${isFetching ? 'opacity-60 pointer-events-none' : 'opacity-100'}`}>
            <div className="space-y-12">
              {quadrasPorModalidade.filter(([mod]) => mod.toLowerCase() !== 'futebol').map(([modalidade, quadrasModalidade]) => (
                <div key={modalidade} className="break-inside-avoid">
                  <h2 className="text-lg font-black text-slate-800 mb-3 px-1 uppercase tracking-widest border-b-2 border-slate-300 pb-2">
                    {modalidade}
                  </h2>
                  <table className="w-full min-w-max border-collapse text-xs">
                  <thead>
                    {/* Dias da Semana (Primeira Linha) */}
                    <tr>
                      <th className="border border-slate-300 bg-slate-100 p-2 text-center font-bold text-slate-800 uppercase w-20">
                        Horário
                      </th>
                      {weekDays.map(day => (
                        <th 
                          key={formatarDataLocal(day)} 
                          colSpan={quadrasModalidade.length} 
                          className="border border-slate-300 bg-slate-200 p-2 text-center font-bold text-slate-800 uppercase"
                        >
                          {day.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}. {day.getDate()}/{day.getMonth() + 1}
                        </th>
                      ))}
                    </tr>
                    {/* Nomes das Quadras (Segunda Linha) */}
                    {weekDays.length > 0 && (
                      <tr>
                        <th className="border border-slate-300 bg-white p-1"></th>
                        {weekDays.map(day => (
                          quadrasModalidade.map(q => (
                            <th 
                              key={`${formatarDataLocal(day)}-${q.id}-header`} 
                              className="border border-slate-300 bg-white p-2 text-center font-bold text-slate-700 uppercase"
                            >
                              {q.nome}
                            </th>
                          ))
                        ))}
                      </tr>
                    )}
                  </thead>
                  <tbody>
                    {allSlots.map(slot => {
                      // Verifica se o slot tem alguma atividade em qualquer dia/quadra desta modalidade
                      const hasAnyActivityInSlot = weekDays.some(day => {
                        const dataStr = formatarDataLocal(day)
                        return quadrasModalidade.some(quadra => {
                          const reserva = reservasMap.get(`${dataStr}-${slot}-${quadra.id}`)
                          return !!reserva
                        })
                      })

                      if (!hasAnyActivityInSlot) return null;

                      return (
                      <tr key={slot}>
                        <td className="border border-slate-300 bg-slate-50 font-bold p-2 text-center whitespace-nowrap text-slate-800">
                          {slot.split(' - ')[0] || slot}
                        </td>
                        {weekDays.map(day => {
                          const dataStr = formatarDataLocal(day)
                          
                          return quadrasModalidade.map(quadra => {
                            const agenda = agendasMap.get(`${dataStr}-${quadra.id}`)
                            const isAberto = agenda?.horarios.includes(slot)
                            const reserva = reservasMap.get(`${dataStr}-${slot}-${quadra.id}`)

                            // Célula vazia/fechada
                            if (!reserva) {
                              return <td key={`${dataStr}-${quadra.id}`} className="bg-white border border-slate-200"></td>
                            }

                            // Célula com Reserva
                            const telClean = reserva.time ? (reserva.time.responsaveis[0]?.pessoa?.telefone || '') : (reserva.user?.telefone || '')
                            const telDisplay = telClean ? (
                              <a href={`tel:${telClean}`} className="hover:underline text-primary ml-1">{telClean}</a>
                            ) : (
                              <span className="text-slate-400 ml-1">[Sem Telefone]</span>
                            )

                            let infoTexto: React.ReactNode = ''
                            let subInfo: React.ReactNode = ''
                            
                            if (reserva.time && reserva.time.responsaveis && reserva.time.responsaveis.length > 0) {
                              const resp = reserva.time.responsaveis[0].pessoa
                              infoTexto = <>{reserva.time.nome.toUpperCase()} <span className="text-[10px] bg-primary text-white px-1.5 py-0.5 rounded ml-1 font-bold">TIME</span></>
                              subInfo = (
                                <div className="flex flex-col gap-0.5">
                                  <span>Resp: {resp?.nome?.toUpperCase() || ''}</span>
                                  <span>Tel: {telDisplay}</span>
                                </div>
                              )
                            } else {
                              infoTexto = reserva.user?.name?.toUpperCase() || 'ADMIN'
                              subInfo = <span>Tel: {telDisplay}</span>
                            }

                              return (
                                <CellReserva 
                                  key={`${dataStr}-${quadra.id}`}
                                  infoTexto={infoTexto}
                                  subInfo={subInfo}
                                />
                              )
                          })
                        })}
                      </tr>
                      )
                    })}
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
            
            {/* Renderizar FUTEBOL separadamente com grande margem */}
            {quadrasPorModalidade.filter(([mod]) => mod.toLowerCase() === 'futebol').map(([modalidade, quadrasModalidade]) => (
              <div key={modalidade} className="mt-32 pt-16 border-t-[16px] border-slate-200 break-inside-avoid print:break-before-page print:mt-0 print:pt-0 print:border-none">
                <h2 className="text-xl font-black text-slate-800 mb-3 px-1 uppercase tracking-widest border-b-2 border-slate-300 pb-2">
                  {modalidade}
                </h2>
                <table className="w-full min-w-max border-collapse text-xs">
                  <thead>
                    <tr>
                      <th className="border border-slate-300 bg-slate-100 p-2 text-center font-bold text-slate-800 uppercase w-20">
                        Horário
                      </th>
                      {weekDays.map(day => (
                        <th key={formatarDataLocal(day)} colSpan={quadrasModalidade.length} className="border border-slate-300 bg-slate-200 p-2 text-center font-bold text-slate-800 uppercase">
                          {day.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}. {day.getDate()}/{day.getMonth() + 1}
                        </th>
                      ))}
                    </tr>
                    {weekDays.length > 0 && (
                      <tr>
                        <th className="border border-slate-300 bg-white p-1"></th>
                        {weekDays.map(day => (
                          quadrasModalidade.map(q => (
                            <th key={`${formatarDataLocal(day)}-${q.id}-header`} className="border border-slate-300 bg-white p-2 text-center font-bold text-slate-700 uppercase">
                              {q.nome}
                            </th>
                          ))
                        ))}
                      </tr>
                    )}
                  </thead>
                  <tbody>
                    {allSlots.map(slot => {
                      const hasAnyActivityInSlot = weekDays.some(day => {
                        const dataStr = formatarDataLocal(day)
                        return quadrasModalidade.some(quadra => !!reservasMap.get(`${dataStr}-${slot}-${quadra.id}`))
                      })
                      if (!hasAnyActivityInSlot) return null;

                      return (
                      <tr key={slot}>
                        <td className="border border-slate-300 bg-slate-50 font-bold p-2 text-center whitespace-nowrap text-slate-800">{slot.split(' - ')[0] || slot}</td>
                        {weekDays.map(day => {
                          const dataStr = formatarDataLocal(day)
                          return quadrasModalidade.map(quadra => {
                            const reserva = reservasMap.get(`${dataStr}-${slot}-${quadra.id}`)
                            if (!reserva) return <td key={`${dataStr}-${quadra.id}`} className="bg-white border border-slate-200"></td>
                            
                            const telClean = reserva.time ? (reserva.time.responsaveis[0]?.pessoa?.telefone || '') : (reserva.user?.telefone || '')
                            const telDisplay = telClean ? <a href={`tel:${telClean}`} className="hover:underline text-primary ml-1">{telClean}</a> : <span className="text-slate-400 ml-1">[Sem Telefone]</span>
                            
                            let infoTexto: React.ReactNode = ''
                            let subInfo: React.ReactNode = ''
                            
                            if (reserva.time && reserva.time.responsaveis && reserva.time.responsaveis.length > 0) {
                              infoTexto = <>{reserva.time.nome.toUpperCase()} <span className="text-[10px] bg-primary text-white px-1.5 py-0.5 rounded ml-1 font-bold">TIME</span></>
                              subInfo = <div className="flex flex-col gap-0.5"><span>Resp: {reserva.time.responsaveis[0].pessoa?.nome?.toUpperCase() || ''}</span><span>Tel: {telDisplay}</span></div>
                            } else {
                              infoTexto = reserva.user?.name?.toUpperCase() || 'ADMIN'
                              subInfo = <span>Tel: {telDisplay}</span>
                            }

                            return <CellReserva key={`${dataStr}-${quadra.id}`} infoTexto={infoTexto} subInfo={subInfo} />
                          })
                        })}
                      </tr>
                      )
                    })}
                    {allSlots.length === 0 && (
                      <tr>
                        <td colSpan={(weekDays.length * quadrasModalidade.length) + 1} className="p-8 text-center text-slate-500 border border-slate-300 font-medium">Nenhuma agenda disponível para a semana base selecionada.</td>
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
