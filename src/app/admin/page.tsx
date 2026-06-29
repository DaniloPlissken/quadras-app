import { prisma } from '@/lib/prisma'
import { CalendarCheck, Users, XCircle, TrendingUp } from 'lucide-react'

export default async function AdminDashboard() {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const fimHoje = new Date(hoje)
  fimHoje.setHours(23, 59, 59, 999)

  const [reservasHoje, totalTimes, cancelamentos, totalQuadras] = await Promise.all([
    prisma.reserva.count({
      where: {
        data: { gte: hoje, lte: fimHoje },
        status: 'CONFIRMADA',
      },
    }),
    prisma.time.count(),
    prisma.reserva.count({
      where: { status: 'CANCELADA_ADMIN' },
    }),
    prisma.quadra.count(),
  ])

  const proximasReservas = await prisma.reserva.findMany({
    where: {
      data: { gte: hoje },
      status: 'CONFIRMADA',
    },
    include: {
      user: { select: { name: true } },
      quadra: { include: { modalidade: true } },
    },
    orderBy: [{ data: 'asc' }, { slot: 'asc' }],
    take: 8,
  })

  const cards = [
    {
      titulo: 'Reservas Hoje',
      valor: reservasHoje,
      icone: CalendarCheck,
      cor: 'text-[#004B87]',
      bg: 'bg-blue-50',
    },
    {
      titulo: 'Times Cadastrados',
      valor: totalTimes,
      icone: Users,
      cor: 'text-[#009A44]',
      bg: 'bg-emerald-50',
    },
    {
      titulo: 'Cancelamentos',
      valor: cancelamentos,
      icone: XCircle,
      cor: 'text-red-600',
      bg: 'bg-red-50',
    },
    {
      titulo: 'Quadras Ativas',
      valor: totalQuadras,
      icone: TrendingUp,
      cor: 'text-violet-600',
      bg: 'bg-violet-50',
    },
  ]

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Visão Geral</h1>
        <p className="text-slate-500 mt-1">Resumo do sistema de reservas</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {cards.map((card) => {
          const Icone = card.icone
          return (
            <div
              key={card.titulo}
              className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                  {card.titulo}
                </h3>
                <div className={`${card.bg} p-2.5 rounded-xl`}>
                  <Icone className={`w-5 h-5 ${card.cor}`} />
                </div>
              </div>
              <p className={`text-4xl font-bold ${card.cor}`}>{card.valor}</p>
            </div>
          )
        })}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Próximas Reservas</h2>
        </div>
        {proximasReservas.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            Nenhuma reserva futura encontrada.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="p-4">Data</th>
                <th className="p-4">Horário</th>
                <th className="p-4">Quadra</th>
                <th className="p-4">Modalidade</th>
                <th className="p-4">Responsável</th>
              </tr>
            </thead>
            <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
              {proximasReservas.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-medium">
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
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
