/**
 * Client Detail Page
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Users,
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  FileText,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  MapPin,
  MessageSquare,
  MoreVertical,
  Calendar1Icon,
} from 'lucide-react'
import { CardTech, ButtonTech } from '@acme/ui'
import { PageHeader } from '@/components/page-header'
import { mockClients, mockAppointments, getClients, getAppointments, resetClients } from '@/mocks'
import { format, differenceInYears, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [client, setClient] = useState(mockClients.find(c => c.id === id))
  const [appointments, setAppointments] = useState(
    mockAppointments.filter(a => a.clientId === id).sort((a, b) =>
      new Date(b.startAt).getTime() - new Date(a.startAt).getTime()
    )
  )

  useEffect(() => {
    setClient(mockClients.find(c => c.id === id))
    setAppointments(
      mockAppointments.filter(a => a.clientId === id).sort((a, b) =>
        new Date(b.startAt).getTime() - new Date(a.startAt).getTime()
      )
    )
  }, [id])

  if (!client) {
    return (
      <div className="space-y-6">
        <PageHeader title="Cliente não encontrado" subtitle="" />
        <CardTech className="p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Cliente não encontrado
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            O cliente "{id}" não foi encontrado no sistema.
          </p>
          <div className="flex items-center justify-center gap-3">
            <ButtonTech variant="outline" onClick={() => navigate('/clients')}>
              Voltar para Clientes
            </ButtonTech>
            <ButtonTech
              variant="outline"
              onClick={() => {
                navigate('/clients')
              }}
              className="text-red-600 hover:text-red-700 border-red-200 dark:border-red-800"
            >
              Resetar Dados
            </ButtonTech>
          </div>
        </CardTech>
      </div>
    )
  }

  const completedAppointments = appointments.filter(a => a.status === 'completed')
  const upcomingAppointments = appointments.filter(a => new Date(a.startAt) > new Date())
  const cancelledAppointments = appointments.filter(a => a.status === 'cancelled')

  const totalSpent = completedAppointments.reduce((sum, a) => sum + (a.price || 0), 0)
  const averageSpent = completedAppointments.length > 0 ? totalSpent / completedAppointments.length : 0

  // Calculate client age if birthdate exists
  const age = client.birthdate ? differenceInYears(new Date(), parseISO(client.birthdate)) : null

  // Monthly spending data for chart
  const monthlySpending = completedAppointments.reduce((acc, appointment) => {
    const month = format(new Date(appointment.startAt), 'MMM/yyyy', { locale: ptBR })
    acc[month] = (acc[month] || 0) + (appointment.price || 0)
    return acc
  }, {} as Record<string, number>)

  const monthlyData = Object.entries(monthlySpending)
    .map(([month, value]) => ({ month, value }))
    .slice(-6) // Last 6 months

  const maxMonthlyValue = Math.max(...monthlyData.map(d => d.value), 1)

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={client.name}
        subtitle=""
        breadcrumbs={[
          { label: 'Clientes', href: '/clients' },
          { label: client.name },
        ]}
      />

      {/* Client Info Card */}
      <CardTech className="p-6">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-3xl flex-shrink-0">
            {client.name.charAt(0)}
          </div>

          {/* Info */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {client.name}
              </h2>

              {client.email && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Mail className="w-4 h-4" />
                  <a href={`mailto:${client.email}`} className="hover:text-primary-600">
                    {client.email}
                  </a>
                </div>
              )}

              {client.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Phone className="w-4 h-4" />
                  <a href={`tel:${client.phone}`} className="hover:text-primary-600">
                    {client.phone}
                  </a>
                </div>
              )}

              {client.address && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <MapPin className="w-4 h-4" />
                  <span>{client.address}</span>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {age && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Calendar1Icon className="w-4 h-4" />
                  <span>{age} anos</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Calendar className="w-4 h-4" />
                <span>Cliente desde {format(new Date(client.createdAt), 'MMM/yyyy', { locale: ptBR })}</span>
              </div>

              {client.notes && (
                <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <FileText className="w-4 h-4 mt-0.5" />
                  <span className="line-clamp-2">{client.notes}</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            {client.chatId && (
              <ButtonTech variant="solid" size="sm" onClick={() => navigate(`/c/${client.chatId}`)}>
                <MessageSquare className="w-4 h-4" />
                Abrir Conversa
              </ButtonTech>
            )}
            <ButtonTech variant="outline" size="sm">
              <Calendar className="w-4 h-4" />
              Novo Agendamento
            </ButtonTech>
          </div>
        </div>
      </CardTech>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <CardTech className="p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Gasto</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(totalSpent)}
              </p>
            </div>
          </div>
        </CardTech>

        <CardTech className="p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Atendimentos</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {completedAppointments.length}
              </p>
            </div>
          </div>
        </CardTech>

        <CardTech className="p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
              <TrendingUp className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Ticket Médio</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(averageSpent)}
              </p>
            </div>
          </div>
        </CardTech>

        <CardTech className="p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Próximos</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {upcomingAppointments.length}
              </p>
            </div>
          </div>
        </CardTech>
      </div>

      {/* Spending Chart & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Spending Chart */}
        <CardTech className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Gastos por Mês
          </h3>

          {monthlyData.length > 0 ? (
            <div className="space-y-3">
              {monthlyData.map((item) => (
                <div key={item.month} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{item.month}</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(item.value)}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full"
                      style={{ width: `${(item.value / maxMonthlyValue) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Sem dados de gastos ainda</p>
            </div>
          )}
        </CardTech>

        {/* Recent Activity */}
        <CardTech className="lg:col-span-2 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Histórico de Atendimentos
          </h3>

          {appointments.length > 0 ? (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {appointments.map((appointment) => {
                const statusConfig = {
                  completed: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30', label: 'Concluído' },
                  confirmed: { icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30', label: 'Confirmado' },
                  pending: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30', label: 'Pendente' },
                  cancelled: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30', label: 'Cancelado' },
                }
                const config = statusConfig[appointment.status as keyof typeof statusConfig] || statusConfig.pending
                const StatusIcon = config.icon

                return (
                  <div
                    key={appointment.id}
                    className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className={`p-2 rounded-lg ${config.bg}`}>
                      <StatusIcon className={`w-5 h-5 ${config.color}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {appointment.service}
                        </h4>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}>
                          {config.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {format(new Date(appointment.startAt), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {format(new Date(appointment.startAt), 'HH:mm')}
                        </span>
                      </div>
                    </div>

                    {appointment.price && (
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(appointment.price)}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum atendimento registrado</p>
            </div>
          )}
        </CardTech>
      </div>
    </div>
  )
}
