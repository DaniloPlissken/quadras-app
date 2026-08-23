'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2, Loader2, Users, CheckCircle, XCircle, FileText, Pencil } from 'lucide-react'

type FormResponsavel = {
  cpf: string
  nome: string
  telefone: string
  comprovanteResidencia: boolean
  urlComprovante?: string
  antecedentesCriminais: boolean
  urlAntecedentes?: string
  fileComprovante: File | null
  fileAntecedentes: File | null
}

type ResponsavelResponse = {
  id: string
  pessoa: {
    cpf: string
    nome: string
    telefone: string
    comprovanteResidencia: boolean
    urlComprovante?: string
    antecedentesCriminais: boolean
    urlAntecedentes?: string
  }
}

type Time = {
  id: string
  nome: string
  status: 'PENDENTE' | 'APTO' | 'SUSPENSO' | 'INATIVO' | 'INAPTO'
  metodoConferencia?: string
  conferidoEm?: string
  conferidoPorId?: string
  motivoInaptidao?: string
  createdAt: string
  responsaveis: ResponsavelResponse[]
}

export default function AdminTimesPage() {
  const [times, setTimes] = useState<Time[]>([])
  const [showForm, setShowForm] = useState(false)
  const [nome, setNome] = useState('')
  const [editandoId, setEditandoId] = useState<string | null>(null)
  
  const initialResp: FormResponsavel = {
    cpf: '',
    nome: '',
    telefone: '',
    comprovanteResidencia: false,
    urlComprovante: '',
    antecedentesCriminais: false,
    urlAntecedentes: '',
    fileComprovante: null,
    fileAntecedentes: null
  }
  
  const [resp1, setResp1] = useState<FormResponsavel>(initialResp)
  const [resp2, setResp2] = useState<FormResponsavel>(initialResp)

  const [salvando, setSalvando] = useState(false)

  async function carregarTimes() {
    const res = await fetch('/api/admin/times')
    if (res.ok) setTimes(await res.json())
  }

  useEffect(() => {
    let ignore = false
    async function carregar() {
      const res = await fetch('/api/admin/times')
      if (res.ok && !ignore) {
        setTimes(await res.json())
      }
    }
    carregar()
    return () => {
      ignore = true
    }
  }, [])

  function formatarCPFinput(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 11)
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
  }

  function formatarTelefoneInput(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 11)
    if (digits.length <= 2) return digits
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }

  async function uploadFile(file: File | null): Promise<string | undefined> {
    if (!file) return undefined
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    if (!res.ok) throw new Error('Falha no upload')
    const data = await res.json()
    return data.url
  }

  async function criarTime(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim() || !resp1.cpf.trim() || !resp2.cpf.trim()) return
    
    if (resp1.cpf === resp2.cpf) {
      toast.error('Os CPFs dos responsáveis não podem ser iguais.')
      return
    }

    setSalvando(true)
    
    try {
      // 1. Fazer upload dos arquivos primeiro
      const r1UrlComp = await uploadFile(resp1.fileComprovante)
      const r1UrlAnt = await uploadFile(resp1.fileAntecedentes)
      
      const r2UrlComp = await uploadFile(resp2.fileComprovante)
      const r2UrlAnt = await uploadFile(resp2.fileAntecedentes)

      // 2. Montar payload
      const payload = {
        nome: nome.trim(),
        responsaveis: [
          {
            ...resp1,
            urlComprovante: r1UrlComp || resp1.urlComprovante,
            urlAntecedentes: r1UrlAnt || resp1.urlAntecedentes,
          },
          {
            ...resp2,
            urlComprovante: r2UrlComp || resp2.urlComprovante,
            urlAntecedentes: r2UrlAnt || resp2.urlAntecedentes,
          }
        ]
      }

      const method = editandoId ? 'PUT' : 'POST'
      const payloadWithId = editandoId ? { id: editandoId, ...payload } : payload

      // 3. Salvar ou atualizar time
      const res = await fetch('/api/admin/times', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadWithId),
      })

      if (res.ok) {
        toast.success(editandoId ? 'Time atualizado com sucesso!' : 'Time cadastrado com sucesso!')
        setNome('')
        setResp1(initialResp)
        setResp2(initialResp)
        setEditandoId(null)
        setShowForm(false)
        carregarTimes()
      } else {
        const err = await res.json()
        toast.error(err.error || (editandoId ? 'Erro ao editar time.' : 'Erro ao cadastrar time.'))
      }
    } catch {
      toast.error('Erro ao processar arquivos ou salvar time.')
    } finally {
      setSalvando(false)
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

  function abrirEdicao(time: Time) {
    setEditandoId(time.id)
    setNome(time.nome)
    
    if (time.responsaveis.length > 0) {
      const r1 = time.responsaveis[0].pessoa
      setResp1({
        cpf: r1.cpf,
        nome: r1.nome,
        telefone: r1.telefone || '',
        comprovanteResidencia: r1.comprovanteResidencia,
        urlComprovante: r1.urlComprovante || '',
        antecedentesCriminais: r1.antecedentesCriminais,
        urlAntecedentes: r1.urlAntecedentes || '',
        fileComprovante: null,
        fileAntecedentes: null
      })
    } else {
      setResp1(initialResp)
    }

    if (time.responsaveis.length > 1) {
      const r2 = time.responsaveis[1].pessoa
      setResp2({
        cpf: r2.cpf,
        nome: r2.nome,
        telefone: r2.telefone || '',
        comprovanteResidencia: r2.comprovanteResidencia,
        urlComprovante: r2.urlComprovante || '',
        antecedentesCriminais: r2.antecedentesCriminais,
        urlAntecedentes: r2.urlAntecedentes || '',
        fileComprovante: null,
        fileAntecedentes: null
      })
    } else {
      setResp2(initialResp)
    }

    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function formatarCPF(cpf: string) {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }

  const renderResponsavelForm = (
    titulo: string, 
    resp: FormResponsavel, 
    setResp: React.Dispatch<React.SetStateAction<FormResponsavel>>
  ) => (
    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
      <h3 className="font-semibold text-slate-700">{titulo}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Nome Completo</label>
          <input
            type="text"
            value={resp.nome}
            onChange={(e) => setResp({ ...resp, nome: e.target.value })}
            className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#004B87]"
            required
          />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">CPF</label>
          <input
            type="text"
            value={resp.cpf}
            onChange={(e) => setResp({ ...resp, cpf: formatarCPFinput(e.target.value) })}
            className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#004B87]"
            required
          />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Telefone</label>
          <input
            type="text"
            value={resp.telefone}
            onChange={(e) => setResp({ ...resp, telefone: formatarTelefoneInput(e.target.value) })}
            className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#004B87]"
            required
          />
        </div>
      </div>
      
      <div className="space-y-4 mt-4 border-t border-slate-200 pt-4">
        <h4 className="text-sm font-semibold text-slate-700">Documentação</h4>
        
        {/* Comprovante de Residência */}
        <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer font-medium">
            <input 
              type="checkbox" 
              checked={resp.comprovanteResidencia}
              onChange={(e) => setResp({ ...resp, comprovanteResidencia: e.target.checked })}
              className="w-4 h-4 text-[#004B87] rounded border-slate-300 focus:ring-[#004B87]" 
            />
            Comprovante de Residência
          </label>
          <input 
            type="file" 
            accept="image/*,application/pdf"
            onChange={(e) => setResp({ ...resp, fileComprovante: e.target.files?.[0] || null })}
            className="block w-full text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#004B87]/10 file:text-[#004B87] hover:file:bg-[#004B87]/20 cursor-pointer"
          />
        </div>

        {/* Antecedentes Criminais */}
        <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer font-medium">
            <input 
              type="checkbox" 
              checked={resp.antecedentesCriminais}
              onChange={(e) => setResp({ ...resp, antecedentesCriminais: e.target.checked })}
              className="w-4 h-4 text-[#004B87] rounded border-slate-300 focus:ring-[#004B87]" 
            />
            Antecedentes Criminais
          </label>
          <input 
            type="file" 
            accept="image/*,application/pdf"
            onChange={(e) => setResp({ ...resp, fileAntecedentes: e.target.files?.[0] || null })}
            className="block w-full text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#004B87]/10 file:text-[#004B87] hover:file:bg-[#004B87]/20 cursor-pointer"
          />
        </div>

      </div>
    </div>
  )

  const [modalConferenciaAberto, setModalConferenciaAberto] = useState(false)
  const [timeParaConferir, setTimeParaConferir] = useState<string | null>(null)
  const [metodoConf, setMetodoConf] = useState('CONFERENCIA_EXTERNA')
  const [obsConf, setObsConf] = useState('')

  const [modalInapto, setModalInapto] = useState<{isOpen: boolean, timeId: string, motivo: string, action: 'INAPTO' | 'APTO'}>({isOpen: false, timeId: '', motivo: '', action: 'INAPTO'})

  async function confirmarConferencia(e: React.FormEvent) {
    e.preventDefault()
    if (!timeParaConferir) return

    setSalvando(true)
    const res = await fetch('/api/admin/times/conferencia', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        timeId: timeParaConferir,
        metodoConferencia: metodoConf,
        observacaoConferencia: obsConf
      })
    })
    setSalvando(false)

    if (res.ok) {
      toast.success('Time conferido e marcado como APTO com sucesso!')
      setModalConferenciaAberto(false)
      setTimeParaConferir(null)
      carregarTimes()
    } else {
      const err = await res.json()
      toast.error(err.error || 'Erro ao conferir time.')
    }
  }

  async function toggleAptidao(e: React.FormEvent) {
    e.preventDefault()
    if (modalInapto.action === 'INAPTO' && !modalInapto.motivo.trim()) {
      toast.error('O motivo é obrigatório para tornar inapto.')
      return
    }
    
    setSalvando(true)
    try {
      const res = await fetch('/api/admin/times/aptidao', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timeId: modalInapto.timeId,
          novoStatus: modalInapto.action,
          motivo: modalInapto.motivo
        })
      })
      if (res.ok) {
        toast.success(modalInapto.action === 'INAPTO' ? 'Time marcado como INAPTO.' : 'Time reativado como APTO.')
        setModalInapto({ isOpen: false, timeId: '', motivo: '', action: 'INAPTO' })
        carregarTimes()
      } else {
        const error = await res.json()
        toast.error(error.error || 'Erro ao alterar aptidão.')
      }
    } catch (err) {
      toast.error('Erro de conexão ao alterar aptidão.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="hidden md:block text-3xl font-bold text-slate-800">Times de Futebol</h1>
          <p className="text-slate-500 mt-1">{times.length} time(s) cadastrado(s)</p>
        </div>
        <button
          onClick={() => {
            setEditandoId(null)
            setNome('')
            setResp1(initialResp)
            setResp2(initialResp)
            setShowForm(!showForm)
          }}
          className="bg-[#009A44] hover:bg-[#008A3D] text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-sm hover:shadow-md active:scale-95 whitespace-nowrap self-start md:self-auto"
        >
          <Plus className="w-5 h-5" /> Cadastrar Time
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={criarTime}
          className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6"
        >
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#004B87]" />
            {editandoId ? 'Editar Time e Responsáveis' : 'Novo Time e Responsáveis'}
          </h2>
          
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Nome do Time
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Uberlândia EC Amador"
              className="w-full mt-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#004B87] focus:border-transparent max-w-md"
              required
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {renderResponsavelForm('Responsável 1', resp1, setResp1)}
            {renderResponsavelForm('Responsável 2', resp2, setResp2)}
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={salvando}
              className="bg-[#004B87] hover:bg-[#003865] text-white px-6 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all disabled:bg-slate-300"
            >
              {salvando && <Loader2 className="w-4 h-4 animate-spin" />}
              {editandoId ? 'Salvar Edição' : 'Salvar Cadastro'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false)
                setEditandoId(null)
              }}
              className="text-slate-500 hover:text-slate-700 px-4 py-2.5 rounded-xl text-sm font-medium"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {times.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            Nenhum time cadastrado. Clique em &quot;Cadastrar Time&quot; para começar.
          </div>
        ) : (
          <>
            {/* Mobile Cards View */}
            <div className="md:hidden flex flex-col divide-y divide-slate-100">
              {times.map((time) => (
                <div key={time.id} className="p-4 flex flex-col gap-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-slate-800 text-base">{time.nome}</span>
                    <div className="shrink-0">
                      {time.status === 'APTO' && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="inline-flex items-center gap-1 text-[#009A44] bg-[#009A44]/10 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">
                            <CheckCircle className="w-3 h-3" /> Apto
                          </span>
                          <button
                            onClick={() => setModalInapto({ isOpen: true, timeId: time.id, motivo: '', action: 'INAPTO' })}
                            className="text-[10px] font-bold tracking-wider text-red-500 hover:text-red-700 bg-transparent hover:bg-red-50 px-2 py-1 rounded-md transition-colors border border-red-100 uppercase flex items-center"
                          >
                            Tornar Inapto
                          </button>
                        </div>
                      )}
                      {time.status === 'INAPTO' && (
                        <div className="flex flex-col gap-1 items-start mt-1">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border border-red-200">
                              <XCircle className="w-3 h-3" /> Inapto
                            </span>
                            <button
                              onClick={() => setModalInapto({ isOpen: true, timeId: time.id, motivo: 'Reativado pela administração', action: 'APTO' })}
                              className="text-[10px] font-bold tracking-wider text-[#009A44] hover:text-[#008A3D] bg-transparent hover:bg-[#009A44]/10 px-2 py-1 rounded-md transition-colors border border-[#009A44]/20 uppercase flex items-center"
                            >
                              Reativar
                            </button>
                          </div>
                          <span className="text-[9px] font-medium text-red-500 opacity-80 max-w-[200px] truncate" title={time.motivoInaptidao || ''}>{time.motivoInaptidao}</span>
                        </div>
                      )}
                      {time.status === 'PENDENTE' && (
                        <span className="inline-flex items-center gap-1 text-orange-500 bg-orange-500/10 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">
                          <Loader2 className="w-3 h-3 animate-spin" /> Pendente
                        </span>
                      )}
                      {time.status === 'SUSPENSO' && (
                        <span className="inline-flex items-center gap-1 text-red-500 bg-red-500/10 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">
                          <XCircle className="w-3 h-3" /> Suspenso
                        </span>
                      )}
                      {time.status === 'INATIVO' && (
                        <span className="inline-flex items-center gap-1 text-slate-500 bg-slate-500/10 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">
                          Inativo
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 flex flex-col gap-3">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Responsáveis</span>
                    <div className="flex flex-col gap-3">
                      {time.responsaveis?.map((r, index) => (
                        <div key={r.id || index} className="flex flex-col gap-1 border-b border-slate-200 last:border-0 pb-2 last:pb-0">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-semibold text-slate-700">{r.pessoa?.nome}</span>
                            <span className="text-slate-400 font-mono text-xs">({formatarCPF(r.pessoa?.cpf || '')})</span>
                          </div>
                          
                          {(r.pessoa?.urlComprovante || r.pessoa?.urlAntecedentes) && (
                            <div className="flex items-center gap-3 text-xs mt-0.5">
                              {r.pessoa?.urlComprovante && (
                                <a href={r.pessoa.urlComprovante} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[#004B87] hover:underline font-semibold">
                                  <FileText className="w-3 h-3" /> Comprovante
                                </a>
                              )}
                              {r.pessoa?.urlAntecedentes && (
                                <a href={r.pessoa.urlAntecedentes} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[#004B87] hover:underline font-semibold">
                                  <FileText className="w-3 h-3" /> Antecedentes
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <span className="text-xs text-slate-400 font-medium">
                      Cadastrado em {new Date(time.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                    <div className="flex items-center gap-2">
                      {time.status === 'PENDENTE' && (
                        <button
                          onClick={() => {
                            setTimeParaConferir(time.id)
                            setModalConferenciaAberto(true)
                          }}
                          className="text-xs bg-[#004B87] hover:bg-[#003865] text-white px-3 py-1.5 rounded-lg transition-colors font-semibold"
                        >
                          Conferir
                        </button>
                      )}

                      <button
                        onClick={() => abrirEdicao(time)}
                        className="text-blue-500 hover:text-blue-700 bg-blue-50 p-2 rounded-lg transition-colors"
                        title="Editar time"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => excluirTime(time.id, time.nome)}
                        className="text-red-500 hover:text-red-700 bg-red-50 p-2 rounded-lg transition-colors"
                        title="Excluir time"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-max text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="p-4">Nome do Time</th>
                <th className="p-4">Responsáveis</th>
                <th className="p-4">Data de Cadastro</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
              {times.map((time) => (
                <tr key={time.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{time.nome}</span>
                      <div>
                        {time.status === 'APTO' && (
                          <div className="flex items-center gap-2 mt-1">
                            <span className="inline-flex items-center gap-1 text-[#009A44] bg-[#009A44]/10 px-2 py-0.5 rounded-full text-xs font-semibold" title="Time Apto">
                              <CheckCircle className="w-3 h-3" /> Apto
                            </span>
                            <button
                              onClick={() => setModalInapto({ isOpen: true, timeId: time.id, motivo: '', action: 'INAPTO' })}
                              className="text-[10px] font-bold uppercase tracking-wider text-red-500 hover:text-red-700 bg-transparent hover:bg-red-50 px-2 py-0.5 rounded-full transition-colors opacity-0 group-hover:opacity-100 flex items-center"
                            >
                              Tornar Inapto
                            </button>
                          </div>
                        )}
                        {time.status === 'INAPTO' && (
                          <div className="flex flex-col items-start mt-1 gap-1">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-2 py-0.5 rounded-full text-xs font-semibold border border-red-200">
                                <XCircle className="w-3 h-3" /> Inapto
                              </span>
                              <button
                                onClick={() => setModalInapto({ isOpen: true, timeId: time.id, motivo: 'Reativado pela administração', action: 'APTO' })}
                                className="text-[10px] font-bold uppercase tracking-wider text-[#009A44] hover:text-[#008A3D] bg-transparent hover:bg-[#009A44]/10 px-2 py-0.5 rounded-full transition-colors opacity-0 group-hover:opacity-100 flex items-center"
                              >
                                Reativar
                              </button>
                            </div>
                            <span className="text-[10px] font-medium text-red-500 opacity-80 max-w-[200px] truncate" title={time.motivoInaptidao || ''}>{time.motivoInaptidao}</span>
                          </div>
                        )}
                        {time.status === 'PENDENTE' && (
                          <span className="inline-flex items-center gap-1 text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-full text-xs font-semibold" title="Aguardando Conferência">
                            <Loader2 className="w-3 h-3 animate-spin" /> Pendente
                          </span>
                        )}
                        {time.status === 'SUSPENSO' && (
                          <span className="inline-flex items-center gap-1 text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full text-xs font-semibold">
                            <XCircle className="w-3 h-3" /> Suspenso
                          </span>
                        )}
                        {time.status === 'INATIVO' && (
                          <span className="inline-flex items-center gap-1 text-slate-500 bg-slate-500/10 px-2 py-0.5 rounded-full text-xs font-semibold">
                            Inativo
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-3">
                      {time.responsaveis?.map((r, index) => (
                        <div key={r.id || index} className="flex flex-col gap-1 border-b border-slate-100 last:border-0 pb-2 last:pb-0">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-semibold text-slate-700">{r.pessoa?.nome}</span>
                            <span className="text-slate-400 font-mono">({formatarCPF(r.pessoa?.cpf || '')})</span>
                          </div>
                          
                          {/* Links de Documentos */}
                          {(r.pessoa?.urlComprovante || r.pessoa?.urlAntecedentes) && (
                            <div className="flex items-center gap-3 text-xs mt-0.5">
                              {r.pessoa?.urlComprovante && (
                                <a href={r.pessoa.urlComprovante} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[#004B87] hover:underline">
                                  <FileText className="w-3 h-3" /> Comprovante
                                </a>
                              )}
                              {r.pessoa?.urlAntecedentes && (
                                <a href={r.pessoa.urlAntecedentes} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[#004B87] hover:underline">
                                  <FileText className="w-3 h-3" /> Antecedentes
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="p-4 text-slate-500">
                    {new Date(time.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="p-4 text-right space-x-2">
                    {time.status === 'PENDENTE' && (
                      <button
                        onClick={() => {
                          setTimeParaConferir(time.id)
                          setModalConferenciaAberto(true)
                        }}
                        className="text-xs bg-[#004B87] hover:bg-[#003865] text-white px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Conferir Time
                      </button>
                    )}

                    <button
                      onClick={() => abrirEdicao(time)}
                      className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title="Editar time"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => excluirTime(time.id, time.nome)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title="Excluir time"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {modalConferenciaAberto && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form onSubmit={confirmarConferencia} className="bg-white rounded-2xl w-full max-w-md p-6 space-y-6 shadow-xl">
            <h2 className="text-xl font-bold text-slate-800">Conferência Documental</h2>
            
            <div>
              <label className="text-sm font-semibold text-slate-700">Método de Conferência</label>
              <select
                value={metodoConf}
                onChange={(e) => setMetodoConf(e.target.value)}
                className="w-full mt-1 border border-slate-300 rounded-lg p-2 text-sm"
              >
                <option value="CONFERENCIA_EXTERNA">Foram Conferidos Externamente (Balcão/E-mail)</option>
                <option value="ANEXOS_SISTEMA">Documentos Anexados no Sistema</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">Observação (Opcional)</label>
              <textarea
                value={obsConf}
                onChange={(e) => setObsConf(e.target.value)}
                rows={3}
                className="w-full mt-1 border border-slate-300 rounded-lg p-2 text-sm"
                placeholder="Ex: Documentos entregues fisicamente no dia X."
              />
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalConferenciaAberto(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={salvando}
                className="px-4 py-2 text-sm font-medium text-white bg-[#009A44] hover:bg-[#008A3D] rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {salvando && <Loader2 className="w-4 h-4 animate-spin" />}
                Tornar Time APTO
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Inapto */}
      {modalInapto.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form onSubmit={toggleAptidao} className="bg-white rounded-2xl w-full max-w-md p-6 space-y-6 shadow-xl">
            <h2 className="text-xl font-bold text-slate-800">
              {modalInapto.action === 'INAPTO' ? 'Tornar Time Inapto' : 'Reativar Time'}
            </h2>
            
            {modalInapto.action === 'INAPTO' ? (
              <>
                <p className="text-sm text-slate-500">
                  Um time Inapto não poderá realizar novas reservas até ser reativado.
                </p>
                <div>
                  <label className="text-sm font-semibold text-slate-700">Motivo da inaptidão / infração <span className="text-red-500">*</span></label>
                  <textarea
                    value={modalInapto.motivo}
                    onChange={(e) => setModalInapto(prev => ({...prev, motivo: e.target.value}))}
                    rows={3}
                    required
                    className="w-full mt-1 border border-slate-300 rounded-lg p-2 text-sm"
                    placeholder="Ex: Time não compareceu ao jogo sem aviso prévio."
                  />
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-500">
                Tem certeza que deseja reativar a aptidão deste time?
              </p>
            )}

            <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalInapto({isOpen: false, timeId: '', motivo: '', action: 'INAPTO'})}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={salvando}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 ${modalInapto.action === 'INAPTO' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
              >
                {salvando && <Loader2 className="w-4 h-4 animate-spin" />}
                {modalInapto.action === 'INAPTO' ? 'Tornar Inapto' : 'Confirmar Reativação'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
