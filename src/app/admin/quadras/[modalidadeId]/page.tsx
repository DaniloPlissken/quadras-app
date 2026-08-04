'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ArrowLeft, Edit2, Loader2, Trash2, X } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

type Modalidade = {
  id: string
  nome: string
}

type Quadra = {
  id: string
  nome: string
  ativa: boolean
  modalidade: Modalidade
}

export default function ModalidadeQuadrasPage() {
  const params = useParams()
  const modalidadeId = params.modalidadeId as string

  const [quadras, setQuadras] = useState<Quadra[]>([])
  const [modalidades, setModalidades] = useState<Modalidade[]>([])
  const [loading, setLoading] = useState(true)

  // Edit Modal State
  const [quadraEditando, setQuadraEditando] = useState<Quadra | null>(null)
  const [editNome, setEditNome] = useState('')
  const [editAtiva, setEditAtiva] = useState(true)
  const [editModalidadeId, setEditModalidadeId] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [excluindo, setExcluindo] = useState(false)

  const modalidadeAtual = modalidades.find(m => m.id === modalidadeId)
  const quadrasFiltradas = quadras.filter(q => q.modalidade.id === modalidadeId)

  const isFutebol = modalidadeAtual?.nome === 'Futebol'
  const termo = isFutebol ? 'Campos' : 'Quadras'
  const termoSingular = isFutebol ? 'Campo' : 'Quadra'
  const termoAcao = isFutebol ? 'campo cadastrado' : 'quadra cadastrada'

  async function carregarDados() {
    setLoading(true)
    try {
      const [resQ, resM] = await Promise.all([
        fetch('/api/admin/quadras'),
        fetch('/api/admin/modalidades'),
      ])
      if (resQ.ok) setQuadras(await resQ.json())
      if (resM.ok) setModalidades(await resM.json())
    } catch {
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!modalidadeId) return
    let ignore = false
    async function carregar() {
      setLoading(true)
      try {
        const [resQ, resM] = await Promise.all([
          fetch('/api/admin/quadras'),
          fetch('/api/admin/modalidades'),
        ])
        if (!ignore) {
          if (resQ.ok) setQuadras(await resQ.json())
          if (resM.ok) setModalidades(await resM.json())
        }
      } catch {
        if (!ignore) toast.error('Erro ao carregar dados')
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    carregar()
    return () => {
      ignore = true
    }
  }, [modalidadeId])

  function abrirModal(quadra: Quadra) {
    setQuadraEditando(quadra)
    setEditNome(quadra.nome)
    setEditAtiva(quadra.ativa ?? true)
    setEditModalidadeId(quadra.modalidade.id)
  }

  function fecharModal() {
    setQuadraEditando(null)
    setEditNome('')
    setEditAtiva(true)
    setEditModalidadeId('')
  }

  async function salvarEdicao(e: React.FormEvent) {
    e.preventDefault()
    if (!quadraEditando || !editNome.trim() || !editModalidadeId) return

    setSalvando(true)
    const res = await fetch('/api/admin/quadras', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        id: quadraEditando.id, 
        nome: editNome.trim(), 
        modalidadeId: editModalidadeId,
        ativa: editAtiva
      }),
    })
    setSalvando(false)

    if (res.ok) {
      toast.success(`${termoSingular} atualizada com sucesso!`)
      fecharModal()
      carregarDados()
    } else {
      const err = await res.json()
      toast.error(err.error || 'Erro ao atualizar.')
    }
  }

  async function excluirQuadra() {
    if (!quadraEditando) return
    if (!confirm(`Tem certeza que deseja excluir permanentemente "${quadraEditando.nome}"?`)) return

    setExcluindo(true)
    const res = await fetch(`/api/admin/quadras?id=${quadraEditando.id}`, { method: 'DELETE' })
    setExcluindo(false)

    if (res.ok) {
      toast.success(`${termoSingular} excluída!`)
      fecharModal()
      carregarDados()
    } else {
      const err = await res.json()
      toast.error(err.error || 'Erro ao excluir.')
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#004B87]" />
      </div>
    )
  }

  if (!modalidadeAtual) {
    return (
      <div className="p-8 space-y-6">
        <Link href="/admin/quadras" className="text-[#004B87] hover:underline flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Link>
        <p className="text-slate-500">Modalidade não encontrada.</p>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <Link href="/admin/quadras" className="text-slate-500 hover:text-[#004B87] flex items-center gap-2 text-sm font-semibold mb-4 w-max transition-colors">
          <ArrowLeft className="w-4 h-4" /> Voltar para modalidades
        </Link>
        <h1 className="text-3xl font-bold text-slate-800">{termo} de {modalidadeAtual.nome}</h1>
        <p className="text-slate-500 mt-1">{quadrasFiltradas.length} {termoAcao}(s) nesta modalidade</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {quadrasFiltradas.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            Nenhum {termoSingular.toLowerCase()} cadastrado para {modalidadeAtual.nome}.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="p-4">Nome do {termoSingular}</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
              {quadrasFiltradas.map((quadra) => (
                <tr key={quadra.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-medium flex items-center gap-3">
                    {quadra.nome}
                    {!quadra.ativa && (
                      <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-slate-200">
                        Desativada
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => abrirModal(quadra)}
                      className="text-[#004B87] hover:text-[#003865] hover:bg-blue-50 px-4 py-2 rounded-lg transition-colors font-semibold flex items-center gap-2 ml-auto"
                    >
                      <Edit2 className="w-4 h-4" /> Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de Edição */}
      {quadraEditando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-50 w-full max-w-lg rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-white px-6 py-5 border-b border-slate-200 flex items-center justify-between shrink-0">
              <h2 className="text-xl font-bold text-slate-800">Editar {termoSingular}</h2>
              <button
                onClick={fecharModal}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={salvarEdicao} className="p-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Nome do {termoSingular}
                  </label>
                  <input
                    type="text"
                    value={editNome}
                    onChange={(e) => setEditNome(e.target.value)}
                    className="w-full mt-1 px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#004B87] bg-white shadow-sm"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Modalidade
                  </label>
                  <select
                    value={editModalidadeId}
                    onChange={(e) => setEditModalidadeId(e.target.value)}
                    className="w-full mt-1 px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#004B87] bg-white shadow-sm"
                    required
                  >
                    {modalidades.map((m) => (
                      <option key={m.id} value={m.id}>{m.nome}</option>
                    ))}
                  </select>
                </div>
                
                <div className="pt-2">
                  <label className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 hover:border-slate-300 transition-all shadow-sm">
                    <input 
                      type="checkbox" 
                      checked={editAtiva} 
                      onChange={(e) => setEditAtiva(e.target.checked)}
                      className="w-5 h-5 text-[#009A44] rounded focus:ring-[#009A44] cursor-pointer"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-800">Local Ativo</span>
                      <span className="text-xs text-slate-500">Se desativado, o local não receberá novos horários no calendário.</span>
                    </div>
                  </label>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={excluirQuadra}
                  disabled={excluindo}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
                  title="Excluir Permanentemente"
                >
                  {excluindo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Excluir
                </button>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={fecharModal}
                    className="text-slate-500 hover:text-slate-700 hover:bg-slate-200 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={salvando || excluindo}
                    className="bg-[#004B87] hover:bg-[#003865] text-white px-6 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all shadow-sm disabled:opacity-50"
                  >
                    {salvando && <Loader2 className="w-4 h-4 animate-spin" />}
                    Salvar Alterações
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
