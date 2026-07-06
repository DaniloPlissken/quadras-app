'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2, Loader2, ArrowRight } from 'lucide-react'
import Link from 'next/link'

type Modalidade = {
  id: string
  nome: string
}

type Quadra = {
  id: string
  nome: string
  modalidade: Modalidade
}

export default function AdminQuadrasPage() {
  const [quadras, setQuadras] = useState<Quadra[]>([])
  const [modalidades, setModalidades] = useState<Modalidade[]>([])
  const [showForm, setShowForm] = useState(false)
  const [nome, setNome] = useState('')
  const [modalidadeId, setModalidadeId] = useState('')
  const [salvando, setSalvando] = useState(false)

  function gerarNomeQuadra(modId: string, listaQuadras: Quadra[]) {
    const mod = modalidades.find(m => m.id === modId)
    if (!mod) return ''

    const quadrasDaModalidade = listaQuadras.filter(q => q.modalidade.id === modId)
    const isFutebol = mod.nome === 'Futebol'
    const prefixo = isFutebol ? 'Campo' : `Quadra de ${mod.nome}`
    
    let numero = 1
    while (quadrasDaModalidade.some(q => q.nome === `${prefixo} ${numero}`)) {
      numero++
    }
    return `${prefixo} ${numero}`
  }

  function selecionarModalidade(modId: string) {
    setModalidadeId(modId)
    setNome(gerarNomeQuadra(modId, quadras))
  }

  async function carregarDados() {
    const [resQ, resM] = await Promise.all([
      fetch('/api/admin/quadras'),
      fetch('/api/admin/modalidades'),
    ])
    let quadrasCarregadas: Quadra[] = []
    let modsCarregadas: Modalidade[] = []

    if (resQ.ok) {
      quadrasCarregadas = await resQ.json()
      setQuadras(quadrasCarregadas)
    }
    if (resM.ok) {
      modsCarregadas = await resM.json()
      setModalidades(modsCarregadas)
      if (modsCarregadas.length > 0 && !modalidadeId) {
        setModalidadeId(modsCarregadas[0].id)
      }
    }
  }

  useEffect(() => {
    carregarDados()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function criarQuadra(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim() || !modalidadeId) return

    setSalvando(true)
    const res = await fetch('/api/admin/quadras', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: nome.trim(), modalidadeId }),
    })
    setSalvando(false)

    if (res.ok) {
      toast.success('Quadra criada com sucesso!')
      setNome('')
      setShowForm(false)
      carregarDados()
    } else {
      const err = await res.json()
      toast.error(err.error || 'Erro ao criar quadra.')
    }
  }

  async function excluirQuadra(id: string, nomeQuadra: string) {
    if (!confirm(`Tem certeza que deseja excluir "${nomeQuadra}"?`)) return

    const res = await fetch(`/api/admin/quadras?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Quadra excluída!')
      carregarDados()
    } else {
      const err = await res.json()
      toast.error(err.error || 'Erro ao excluir.')
    }
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Gestão de Quadras</h1>
          <p className="text-slate-500 mt-1">{quadras.length} quadra(s) cadastrada(s)</p>
        </div>
        <button
          onClick={() => {
            if (!showForm) {
              setNome(gerarNomeQuadra(modalidadeId, quadras))
            }
            setShowForm(!showForm)
          }}
          className="bg-[#009A44] hover:bg-[#008A3D] text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-sm hover:shadow-md active:scale-95"
        >
          <Plus className="w-5 h-5" /> Nova Quadra / Campo
        </button>
      </div>

      {/* Formulário */}
      {showForm && (
        <form
          onSubmit={criarQuadra}
          className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4 mb-6"
        >
          <h2 className="text-lg font-bold text-slate-800">Cadastrar Nova Quadra / Campo</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Nome da Quadra / Campo
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Quadra de Vôlei 1"
                className="w-full mt-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#004B87] focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Modalidade
              </label>
              <select
                value={modalidadeId}
                onChange={(e) => selecionarModalidade(e.target.value)}
                className="w-full mt-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#004B87] focus:border-transparent bg-white"
                required
              >
                {modalidades.map((m) => (
                  <option key={m.id} value={m.id}>{m.nome}</option>
                ))}
              </select>
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

      {/* Tabela de Modalidades / Cards */}
      {!showForm && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {modalidades.length === 0 ? (
            <div className="col-span-full p-12 text-center text-slate-400 bg-white rounded-2xl shadow-sm border border-slate-200">
              Nenhuma modalidade encontrada. Cadastre uma modalidade primeiro.
            </div>
          ) : (
            modalidades.map((mod) => {
              const count = quadras.filter(q => q.modalidade.id === mod.id).length
              const isFutebol = mod.nome === 'Futebol'
              const termoSingular = isFutebol ? 'campo cadastrado' : 'quadra cadastrada'
              const termoPlural = isFutebol ? 'campos cadastrados' : 'quadras cadastradas'
              const termoAcao = isFutebol ? 'Gerenciar campos' : 'Gerenciar quadras'
              
              return (
                <Link
                  key={mod.id}
                  href={`/admin/quadras/${mod.id}`}
                  className="group bg-white rounded-2xl shadow-sm hover:shadow-md border border-slate-200 hover:border-[#004B87] p-6 transition-all flex flex-col justify-between cursor-pointer active:scale-[0.98]"
                >
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 group-hover:text-[#004B87] transition-colors">{mod.nome}</h2>
                    <p className="text-slate-500 mt-2 text-sm font-medium">
                      {count} {count === 1 ? termoSingular : termoPlural}
                    </p>
                  </div>
                  <div className="mt-6 flex items-center justify-between text-[#004B87] font-semibold text-sm">
                    <span>{termoAcao}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
