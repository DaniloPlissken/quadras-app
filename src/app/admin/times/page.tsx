'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2, Loader2, Users } from 'lucide-react'

type Time = {
  id: string
  nome: string
  createdAt: string
  responsavel: { name: string; id: string; email: string }
}

export default function AdminTimesPage() {
  const [times, setTimes] = useState<Time[]>([])
  const [showForm, setShowForm] = useState(false)
  const [nome, setNome] = useState('')
  const [cpfResponsavel, setCpfResponsavel] = useState('')
  const [salvando, setSalvando] = useState(false)

  async function carregarTimes() {
    const res = await fetch('/api/admin/times')
    if (res.ok) setTimes(await res.json())
  }

  useEffect(() => {
    carregarTimes()
  }, [])

  function formatarCPFinput(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 11)
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
  }

  async function criarTime(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim() || !cpfResponsavel.trim()) return

    setSalvando(true)
    const res = await fetch('/api/admin/times', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: nome.trim(), cpfResponsavel }),
    })
    setSalvando(false)

    if (res.ok) {
      toast.success('Time cadastrado com sucesso!')
      setNome('')
      setCpfResponsavel('')
      setShowForm(false)
      carregarTimes()
    } else {
      const err = await res.json()
      toast.error(err.error || 'Erro ao cadastrar time.')
    }
  }

  async function excluirTime(id: string, nomeTime: string) {
    if (!confirm(`Tem certeza que deseja excluir o time "${nomeTime}"?`)) return

    const res = await fetch(`/api/admin/times?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Time excluído!')
      carregarTimes()
    } else {
      const err = await res.json()
      toast.error(err.error || 'Erro ao excluir time.')
    }
  }

  function formatarCPF(cpf: string) {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Times de Futebol</h1>
          <p className="text-slate-500 mt-1">{times.length} time(s) cadastrado(s)</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-[#009A44] hover:bg-[#008A3D] text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-sm hover:shadow-md active:scale-95"
        >
          <Plus className="w-5 h-5" /> Cadastrar Time
        </button>
      </div>

      {/* Formulário */}
      {showForm && (
        <form
          onSubmit={criarTime}
          className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4"
        >
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#004B87]" />
            Novo Time
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Nome do Time
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Uberlândia EC Amador"
                className="w-full mt-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#004B87] focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                CPF do Responsável (Capitão)
              </label>
              <input
                type="text"
                value={cpfResponsavel}
                onChange={(e) => setCpfResponsavel(formatarCPFinput(e.target.value))}
                placeholder="000.000.000-00"
                className="w-full mt-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#004B87] focus:border-transparent"
                required
              />
              <p className="text-xs text-slate-400 mt-1">O responsável deve estar cadastrado no sistema.</p>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={salvando}
              className="bg-[#004B87] hover:bg-[#003865] text-white px-6 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all disabled:bg-slate-300"
            >
              {salvando && <Loader2 className="w-4 h-4 animate-spin" />}
              Salvar
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-slate-500 hover:text-slate-700 px-4 py-2.5 rounded-xl text-sm font-medium"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Tabela */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {times.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            Nenhum time cadastrado. Clique em "Cadastrar Time" para começar.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="p-4">Nome do Time</th>
                <th className="p-4">Responsável (Capitão)</th>
                <th className="p-4">CPF</th>
                <th className="p-4">Data de Cadastro</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
              {times.map((time) => (
                <tr key={time.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-medium">{time.nome}</td>
                  <td className="p-4">{time.responsavel.name}</td>
                  <td className="p-4 text-slate-500 font-mono text-xs">
                    {formatarCPF(time.responsavel.id)}
                  </td>
                  <td className="p-4 text-slate-500">
                    {new Date(time.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => excluirTime(time.id, time.nome)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                      title="Excluir time"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
