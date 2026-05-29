'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'

type Quadra = {
  id: string
  nome: string
}

type Reserva = {
  id: string
  data: string
  slot: string
  quadraId: string
  userId: string
}

const SLOTS_PADRAO = [
  '06:00-08:00',
  '08:00-10:00',
  '10:00-12:00',
  '12:00-14:00',
  '14:00-16:00',
  '16:00-18:00',
  '18:00-20:00',
  '20:00-21:45',
]

const SLOTS_TENIS = [
  '06:00-07:00',
  '07:00-08:00',
  '08:00-09:00',
  '09:00-10:00',
  '10:00-11:00',
  '11:00-12:00',
  '12:00-13:00',
  '13:00-14:00',
  '14:00-15:00',
  '15:00-16:00',
  '16:00-17:00',
  '17:00-18:00',
  '18:00-19:00',
  '19:00-20:00',
  '20:00-21:00',
  '21:00-21:45',
]

function inicioDaSemana(date: Date) {
  const d = new Date(date)
  const dia = d.getDay()
  const diff = dia === 0 ? -6 : 1 - dia

  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)

  return d
}

function getProximoSabadoDaSemanaAtual() {
  const hoje = new Date()
  const inicio = inicioDaSemana(hoje)

  const sabado = new Date(inicio)
  sabado.setDate(inicio.getDate() + 5)
  sabado.setHours(0, 0, 0, 0)

  return sabado
}

function fimDaSemana(date: Date) {
  const inicio = inicioDaSemana(date)
  const fim = new Date(inicio)

  fim.setDate(inicio.getDate() + 6)
  fim.setHours(23, 59, 59, 999)

  return fim
}

function isFimDeSemanaDaSemanaAtual(date: Date) {
  const hoje = new Date()
  const inicio = inicioDaSemana(hoje)
  const fim = fimDaSemana(hoje)

  const data = new Date(date)
  data.setHours(0, 0, 0, 0)

  const dia = data.getDay()
  const ehSabadoOuDomingo = dia === 0 || dia === 6

  return ehSabadoOuDomingo && data >= inicio && data <= fim
}

function nomeModalidade(slug: string) {
  const mapa: Record<string, string> = {
    volei: 'Vôlei',
    'beach-tenis': 'Beach Tênis',
    tenis: 'Tênis',
    futebol: 'Futebol',
  }

  return mapa[slug] ?? slug
}

export default function ReservaModalidadePage() {
  const params = useParams()
  const modalidade = String(params.modalidade)

  const slots = modalidade === 'tenis' ? SLOTS_TENIS : SLOTS_PADRAO

  const [dataSelecionada, setDataSelecionada] = useState<Date | undefined>(
    getProximoSabadoDaSemanaAtual()
  )

  const [quadras, setQuadras] = useState<Quadra[]>([])
  const [quadraId, setQuadraId] = useState('')
  const [reservas, setReservas] = useState<Reserva[]>([])
  const [carregando, setCarregando] = useState(false)

  const [userId, setUserId] = useState('cmpcsy2z10010u8u84iojshv2')

  useEffect(() => {
    async function carregarQuadras() {
      if (modalidade === 'futebol') return

      const res = await fetch(`/api/quadras?modalidade=${modalidade}`)
      const data = await res.json()

      setQuadras(data)

      if (data.length > 0) {
        setQuadraId(data[0].id)
      }
    }

    carregarQuadras()
  }, [modalidade])

  useEffect(() => {
    async function carregarReservas() {
      if (modalidade === 'futebol') return
      if (!dataSelecionada || !quadraId) return

      const dataFormatada = dataSelecionada.toISOString().split('T')[0]

      const res = await fetch(
        `/api/reservas?data=${dataFormatada}&quadraId=${quadraId}`
      )

      const data = await res.json()
      setReservas(data)
    }

    carregarReservas()
  }, [dataSelecionada, quadraId, modalidade])

  async function reservar(slot: string) {
    if (!dataSelecionada || !quadraId) return

    setCarregando(true)

    const dataFormatada = dataSelecionada.toISOString().split('T')[0]

    const res = await fetch('/api/reservas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        quadraId,
        userId,
        data: dataFormatada,
        slot,
      }),
    })

    setCarregando(false)

    if (!res.ok) {
      const erro = await res.json()
      toast.error(erro.error || 'Não foi possível realizar a reserva.')
      return
    }

    toast.success('Reserva realizada com sucesso!')

    const atualizadas = await fetch(
      `/api/reservas?data=${dataFormatada}&quadraId=${quadraId}`
    )

    setReservas(await atualizadas.json())
  }

  const slotsReservados = reservas.map((reserva) => reserva.slot)

  const usuarioJaReservouNesteFimDeSemana = reservas.some(
    (reserva) => reserva.userId === userId
  )

  if (modalidade === 'futebol') {
    return (
      <main className="min-h-screen bg-slate-100 p-6">
        <div className="mx-auto max-w-3xl">
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle className="text-3xl">
                Agendamento de Futebol
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 text-slate-700">
              <p className="text-lg font-semibold">
                O agendamento de campos de futebol exige cadastro prévio do time.
              </p>

              <p>
                Para reservar um campo, o responsável deverá estar vinculado a um
                time cadastrado pela administração.
              </p>

              <p>
                Esta funcionalidade será liberada em uma próxima etapa do sistema.
              </p>

              <Link
                href="/reservas"
                className="inline-flex rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
              >
                Voltar para modalidades
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-6 text-3xl font-bold">
          Reserva - {nomeModalidade(modalidade)}
        </h1>

        <div className="grid gap-6 md:grid-cols-[320px_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Escolha a data</CardTitle>
            </CardHeader>

            <CardContent>
              <div className="mb-4 rounded-lg border bg-blue-50 p-3 text-sm text-blue-900">
                <p className="font-semibold">
                  Agendamentos disponíveis apenas para sábados e domingos.
                </p>

                <p className="mt-1">
                  Nos demais dias, o uso das quadras é livre e não necessita reserva.
                </p>
              </div>

              <Calendar
                locale={ptBR}
                mode="single"
                selected={dataSelecionada}
                onSelect={setDataSelecionada}
                disabled={(date) => !isFimDeSemanaDaSemanaAtual(date)}
                className="rounded-md border"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Horários disponíveis</CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="mb-4 flex gap-2">
                <Button
                  variant={userId === 'cmpcsy2z10010u8u84iojshv2' ? 'default' : 'outline'}
                  onClick={() => setUserId('cmpcsy2z10010u8u84iojshv2')}
                >
                  Usuário 1
                </Button>

                <Button
                  variant={userId === 'cmpcsy4cb0011u8u8aaggnodn' ? 'default' : 'outline'}
                  onClick={() => setUserId('cmpcsy4cb0011u8u8aaggnodn')}
                >
                  Usuário 2
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {quadras.map((quadra) => (
                  <Button
                    key={quadra.id}
                    variant={quadraId === quadra.id ? 'default' : 'outline'}
                    onClick={() => setQuadraId(quadra.id)}
                  >
                    {quadra.nome}
                  </Button>
                ))}
              </div>

              {usuarioJaReservouNesteFimDeSemana && (
                <div className="rounded-lg border bg-yellow-50 p-3 text-sm text-yellow-900">
                  Você já possui uma reserva para este fim de semana.
                </div>
              )}

              <div className="grid gap-3 md:grid-cols-2">
                {slots.map((slot) => {
                  const ocupado = slotsReservados.includes(slot)

                  return (
                    <Button
                      key={slot}
                      disabled={
                        ocupado ||
                        carregando ||
                        usuarioJaReservouNesteFimDeSemana
                      }
                      variant={ocupado ? 'secondary' : 'default'}
                      className="h-16 text-lg"
                      onClick={() => reservar(slot)}
                    >
                      {ocupado
                        ? `${slot} - Ocupado`
                        : usuarioJaReservouNesteFimDeSemana
                          ? `${slot} - Bloqueado`
                          : `${slot} - Reservar`}
                    </Button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}