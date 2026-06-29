'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { XCircle, Filter, Loader2 } from 'lucide-react'

type Reserva = {
  id: string
  data: string
  slot: string
  status: string
  user: { name: string; id: string; email: string }
  quadra: { nome: string; modalidade: { nome: string } }
}

export default function AdminReservasPage() {
  const [reservas, setReservas] = useState<Reserva[]>([])
  const [carregando, setCarregando] = useState(true)
  const [filtroData, setFiltroData] = useState('')
  const [cancelando, setCancelando] = useState<string | null>(null)

  async function carregarReservas() {
    setCarregando(true)
    const params = new URLSearchParams()
    if (filtroData) params.set('data', filtroData)

    const res = await fetch(`/api/admin/reservas?${params.toString()}`)
    if (res.ok) setReservas(await res.json())
    setCarregando(false)
  }

  useEffect(() => {
    carregarReservas()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroData])

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

  function formatarCPF(cpf: string) {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Gestão de Reservas</h1>
          <p className="text-slate-500 mt-1">{reservas.length} reserva(s) encontrada(s)</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex flex-wrap gap-4 items-end">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
          <Filter className="w-4 h-4" />
          Filtrar
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Data</label>
          <input
            type="date"
            value={filtroData}
            onChange={(e) => setFiltroData(e.target.value)}
            className="mt-1 block px-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#004B87] focus:border-transparent"
          />
        </div>
        {filtroData && (
          <button
            onClick={() => setFiltroData('')}
            className="text-sm text-slate-500 hover:text-slate-700 underline"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {carregando ? (
          <div className="p-12 flex items-center justify-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Carregando...
          </div>
        ) : reservas.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            Nenhuma reserva encontrada.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="p-4">Data</th>
                  <th className="p-4">Horário</th>
                  <th className="p-4">Quadra</th>
                  <th className="p-4">Modalidade</th>
                  <th className="p-4">Responsável</th>
                  <th className="p-4">CPF</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
                {reservas.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-medium whitespace-nowrap">
                      {new Date(r.data).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="p-4">
                      <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-lg text-xs font-semibold">
                        {r.slot}
                      </span>
                    </td>
                    <td className="p-4">{r.quadra.nome}</td>
                    <td className="p-4 text-slate-500">{r.quadra.modalidade.nome}</td>
                    <td className="p-4">{r.user.name}</td>
                    <td className="p-4 text-slate-500 font-mono text-xs">
                      {formatarCPF(r.user.id)}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        r.status === 'CONFIRMADA'
                          ? 'bg-green-100 text-green-800'
                          : r.status === 'CONCLUIDA'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {r.status === 'CONFIRMADA' ? 'Confirmada' : r.status === 'CONCLUIDA' ? 'Concluída' : 'Cancelada'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {r.status === 'CONFIRMADA' && (
                        <button
                          onClick={() => cancelarReserva(r.id)}
                          disabled={cancelando === r.id}
                          className="inline-flex items-center gap-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1.5 rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
