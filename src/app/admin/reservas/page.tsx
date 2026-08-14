'use client'

import { useEffect, useState, useMemo } from 'react'
import { toast } from 'sonner'
import { XCircle, Filter, Loader2, Download, Printer } from 'lucide-react'

type Quadra = {
  id: string
  nome: string
  modalidade: { nome: string }
}

type Reserva = {
  id: string
  data: string
  slot: string
  status: string
  user: { name: string; email: string }
  quadra: { nome: string; modalidade: { nome: string } }
  time?: {
    nome: string
    responsaveis: { nome: string; telefone: string }[]
  }
}

export default function AdminReservasPage() {
  const [reservas, setReservas] = useState<Reserva[]>([])
  const [carregando, setCarregando] = useState(true)
  const [cancelando, setCancelando] = useState<string | null>(null)

  // Filtros
  const [filtroDataInicio, setFiltroDataInicio] = useState('')
  const [filtroDataFim, setFiltroDataFim] = useState('')
  const [filtroModalidade, setFiltroModalidade] = useState('todas')
  const [filtroQuadra, setFiltroQuadra] = useState('todas')
  const [filtroStatus, setFiltroStatus] = useState('todas')

  const [quadras, setQuadras] = useState<Quadra[]>([])
  const [modalidades, setModalidades] = useState<string[]>([])

  // 1. Carregar Dados de Filtro (Quadras e Modalidades)
  useEffect(() => {
    async function carregarFiltros() {
      const res = await fetch('/api/admin/quadras')
      if (res.ok) {
        const data: Quadra[] = await res.json()
        setQuadras(data)
        const mods = Array.from(new Set(data.map(q => q.modalidade.nome))).sort()
        setModalidades(mods)
      }
    }
    carregarFiltros()
  }, [])

  useEffect(() => {
    let ignore = false
    async function carregar() {
      setCarregando(true)
      const params = new URLSearchParams()
      if (filtroDataInicio) params.set('dataInicio', filtroDataInicio)
      if (filtroDataFim) params.set('dataFim', filtroDataFim)
      if (filtroModalidade !== 'todas') params.set('modalidade', filtroModalidade)
      if (filtroQuadra !== 'todas') params.set('quadraId', filtroQuadra)
      if (filtroStatus !== 'todas') params.set('status', filtroStatus)

      const res = await fetch(`/api/admin/reservas?${params.toString()}`)
      if (res.ok && !ignore) {
        setReservas(await res.json())
      }
      if (!ignore) {
        setCarregando(false)
      }
    }
    carregar()
    return () => { ignore = true }
  }, [filtroDataInicio, filtroDataFim, filtroModalidade, filtroQuadra, filtroStatus])

  async function carregarReservas() {
    const params = new URLSearchParams()
    if (filtroDataInicio) params.set('dataInicio', filtroDataInicio)
    if (filtroDataFim) params.set('dataFim', filtroDataFim)
    if (filtroModalidade !== 'todas') params.set('modalidade', filtroModalidade)
    if (filtroQuadra !== 'todas') params.set('quadraId', filtroQuadra)
    if (filtroStatus !== 'todas') params.set('status', filtroStatus)

    const res = await fetch(`/api/admin/reservas?${params.toString()}`)
    if (res.ok) {
      setReservas(await res.json())
    }
  }

  async function cancelarReserva(id: string) {
    if (!confirm('Tem certeza que deseja cancelar esta reserva?')) return

    setCancelando(id)
    const res = await fetch('/api/admin/reservas', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'CANCELADA_ADMIN' }),
    })
    setCancelando(null)

    if (res.ok) {
      toast.success('Reserva cancelada com sucesso!')
      carregarReservas()
    } else {
      toast.error('Erro ao cancelar reserva.')
    }
  }

  // Exportação CSV com BOM para Excel (UTF-8)
  const exportarCSV = () => {
    const BOM = '\uFEFF'
    const cabecalho = ['Data', 'Horário', 'Modalidade', 'Quadra', 'Status', 'Tipo', 'Responsável', 'Contato/Time']
    
    const linhas = reservas.map(r => {
      const data = new Date(r.data).toLocaleDateString('pt-BR')
      const isTime = !!r.time
      const tipo = isTime ? 'Time' : 'Cidadão'
      
      let responsavel = r.user.name
      let contato = r.user.email

      if (r.time && r.time.responsaveis.length > 0) {
        responsavel = r.time.responsaveis[0].nome
        contato = `Time: ${r.time.nome} | Tel: ${r.time.responsaveis[0].telefone || ''}`
      }

      return [
        data,
        r.slot,
        r.quadra.modalidade.nome,
        r.quadra.nome,
        r.status,
        tipo,
        responsavel,
        contato
      ].map(campo => `"${String(campo).replace(/"/g, '""')}"`).join(';')
    })

    const csvContent = BOM + [cabecalho.join(';'), ...linhas].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `relatorio_reservas_${new Date().getTime()}.csv`
    link.click()
  }

  const limparFiltros = () => {
    setFiltroDataInicio('')
    setFiltroDataFim('')
    setFiltroModalidade('todas')
    setFiltroQuadra('todas')
    setFiltroStatus('todas')
  }

  const quadrasFiltradas = useMemo(() => {
    if (filtroModalidade === 'todas') return quadras
    return quadras.filter(q => q.modalidade.nome === filtroModalidade)
  }, [quadras, filtroModalidade])

  const printStyles = `
    @media print {
      body * { visibility: hidden; }
      #print-area, #print-area * { visibility: visible; }
      #print-area {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        margin: 0;
      }
      .no-print { display: none !important; }
      @page { size: landscape; margin: 10mm; }
    }
  `

  return (
    <div className="p-4 md:p-8 space-y-6">
      <style>{printStyles}</style>

      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 no-print">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Gestão de Reservas</h1>
          <p className="text-slate-500 mt-1">{reservas.length} reserva(s) encontrada(s)</p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={exportarCSV}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-semibold transition-all shadow-sm"
          >
            <Download className="w-4 h-4" /> CSV
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl font-semibold transition-all shadow-sm"
          >
            <Printer className="w-4 h-4" /> Imprimir
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-wrap gap-4 items-end no-print">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 mb-2 w-full md:w-auto md:mb-0">
          <Filter className="w-4 h-4" />
          Filtros:
        </div>
        
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Data Início</label>
          <input
            type="date"
            value={filtroDataInicio}
            onChange={(e) => setFiltroDataInicio(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#004B87]"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Data Fim</label>
          <input
            type="date"
            value={filtroDataFim}
            onChange={(e) => setFiltroDataFim(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#004B87]"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Modalidade</label>
          <select
            value={filtroModalidade}
            onChange={(e) => {
              setFiltroModalidade(e.target.value)
              setFiltroQuadra('todas')
            }}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#004B87] min-w-[140px]"
          >
            <option value="todas">Todas</option>
            {modalidades.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Quadra</label>
          <select
            value={filtroQuadra}
            onChange={(e) => setFiltroQuadra(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#004B87] min-w-[140px]"
          >
            <option value="todas">Todas</option>
            {quadrasFiltradas.map(q => (
              <option key={q.id} value={q.id}>{q.nome}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Status</label>
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#004B87]"
          >
            <option value="todas">Ativas (Não Canceladas)</option>
            <option value="CONFIRMADA">Confirmada</option>
            <option value="CONCLUIDA">Concluída</option>
            <option value="CANCELADA_ADMIN">Cancelada</option>
          </select>
        </div>

        {(filtroDataInicio || filtroDataFim || filtroModalidade !== 'todas' || filtroQuadra !== 'todas' || filtroStatus !== 'todas') && (
          <button
            onClick={limparFiltros}
            className="text-sm text-slate-500 hover:text-slate-700 underline px-2 py-2"
          >
            Limpar
          </button>
        )}
      </div>

      {/* Tabela de Relatório */}
      <div id="print-area" className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden print:border-none print:shadow-none">
        
        <div className="hidden print:block p-6 border-b border-slate-200">
          <h2 className="text-2xl font-bold text-slate-800">Relatório de Reservas</h2>
          <p className="text-slate-500">Período: {filtroDataInicio || 'Sempre'} até {filtroDataFim || 'Sempre'} | Total: {reservas.length} registros.</p>
        </div>

        {carregando ? (
          <div className="p-12 flex items-center justify-center text-slate-400 no-print">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Carregando dados...
          </div>
        ) : reservas.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-medium">
            Nenhuma reserva encontrada para os filtros selecionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="p-4">Data</th>
                  <th className="p-4">Horário</th>
                  <th className="p-4">Quadra/Modalidade</th>
                  <th className="p-4">Tipo</th>
                  <th className="p-4">Responsável</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right no-print">Ações</th>
                </tr>
              </thead>
              <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
                {reservas.map((r) => {
                  const isTime = !!r.time
                  const tipoTexto = isTime ? 'Time' : 'Cidadão'
                  
                  let responsavelNome = r.user.name
                  let responsavelSub = r.user.email

                  if (r.time && r.time.responsaveis.length > 0) {
                    responsavelNome = r.time.nome
                    responsavelSub = `Resp: ${r.time.responsaveis[0].nome}`
                  }

                  return (
                  <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-semibold whitespace-nowrap text-slate-800">
                      {new Date(r.data).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="p-4">
                      <span className="bg-blue-50 text-blue-700 border border-blue-100 px-2 py-1 rounded-lg text-xs font-bold">
                        {r.slot}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-800">{r.quadra.nome}</div>
                      <div className="text-xs text-slate-500 uppercase tracking-wide">{r.quadra.modalidade.nome}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-semibold ${isTime ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                        {tipoTexto}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-800">{responsavelNome}</div>
                      <div className="text-xs text-slate-500 truncate max-w-[200px]" title={responsavelSub}>{responsavelSub}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        r.status === 'CONFIRMADA'
                          ? 'bg-emerald-100 text-emerald-800'
                          : r.status === 'CONCLUIDA'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {r.status === 'CONFIRMADA' ? 'Confirmada' : r.status === 'CONCLUIDA' ? 'Concluída' : 'Cancelada'}
                      </span>
                    </td>
                    <td className="p-4 text-right no-print">
                      {r.status === 'CONFIRMADA' && (
                        <button
                          onClick={() => cancelarReserva(r.id)}
                          disabled={cancelando === r.id}
                          className="inline-flex items-center gap-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1.5 rounded-lg font-medium text-xs transition-colors disabled:opacity-50 border border-transparent hover:border-red-200"
                        >
                          {cancelando === r.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5" />
                          )}
                          Cancelar
                        </button>
                      )}
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
