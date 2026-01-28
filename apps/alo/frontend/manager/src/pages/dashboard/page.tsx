/**
 * Dashboard Page
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, Calendar, MessageSquare, Wrench, TrendingUp, Clock,
  ArrowRight, Star, Bell
} from 'lucide-react'
import { CardTech, ButtonTech } from '@acme/ui'
import {
  mockClients,
  mockAppointments,
  mockChats,
  mockServices,
  mockNotifications,
  getMessagesByChatId,
  getUpcomingAppointments,
  getChatsWithUnread,
  getActiveServices,
  getUnreadCount,
  getTopClients,
  getRecentNotifications,
} from '@/mocks'
import { format, isToday, isTomorrow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function DashboardPage() {
  const navigate = useNavigate()
  const [mounted, setMounted] = useState(false)

  // Stats
  const totalClients = mockClients.length
  const upcomingAppointments = getUpcomingAppointments().slice(0, 5)
  const unreadChats = getChatsWithUnread().length
  const activeServices = getActiveServices().length
  const unreadNotifications = getUnreadCount()
  const topClients = getTopClients(5)
  const recentChats = mockChats.slice(0, 5)
  const recentNotifications = getRecentNotifications(5)

  useEffect(() => {
    setMounted(true)
  }, [])

  const formatAppointmentDate = (date: Date) => {
    if (isToday(date)) {
      return `Hoje, ${format(date, 'HH:mm')}`
    }
    if (isTomorrow(date)) {
      return `Amanhã, ${format(date, 'HH:mm')}`
    }
    return format(date, "dd 'de' MMM, HH:mm", { locale: ptBR })
  }

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Agora'
    if (diffMins < 60) return `${diffMins}min`
    if (diffHours < 24) return `${diffHours}h`
    if (diffDays < 7) return `${diffDays}d`
    return format(date, 'dd/MM', { locale: ptBR })
  }

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Visão geral do seu negócio.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-100 dark:bg-gray-700 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Visão geral do seu negócio.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <CardTech className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Clientes</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {totalClients}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
            Total de clientes cadastrados
          </p>
        </CardTech>

        <CardTech className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Agendamentos</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {upcomingAppointments.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <Calendar className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
            Próximos agendamentos
          </p>
        </CardTech>

        <CardTech className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Mensagens</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {unreadChats}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
            Conversas não lidas
          </p>
        </CardTech>

        <CardTech className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Serviços Ativos</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {activeServices}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
              <Wrench className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
            Serviços disponíveis
          </p>
        </CardTech>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Appointments */}
        <CardTech className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Próximos Agendamentos
              </h2>
            </div>
            <ButtonTech
              variant="ghost"
              size="sm"
              onClick={() => navigate('/agenda')}
            >
              Ver todos
              <ArrowRight className="w-4 h-4 ml-1" />
            </ButtonTech>
          </div>

          {upcomingAppointments.length > 0 ? (
            <div className="space-y-3">
              {upcomingAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                  onClick={() => navigate('/agenda')}
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex flex-col items-center justify-center">
                    <span className="text-xs font-medium text-primary-600 dark:text-primary-400">
                      {format(appointment.startAt, 'MMM', { locale: ptBR }).toUpperCase()}
                    </span>
                    <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                      {format(appointment.startAt, 'dd')}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {appointment.clientName}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {appointment.service}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatAppointmentDate(appointment.startAt)}
                    </p>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: appointment.color }}
                    >
                      {appointment.status === 'confirmed' ? 'Confirmado' : 'Agendado'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                Nenhum agendamento futuro.
              </p>
            </div>
          )}
        </CardTech>

        {/* Recent Notifications */}
        <CardTech className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Notificações
              </h2>
            </div>
            {unreadNotifications > 0 && (
              <span className="w-6 h-6 bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
                {unreadNotifications}
              </span>
            )}
          </div>

          {recentNotifications.length > 0 ? (
            <div className="space-y-3">
              {recentNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border transition-colors cursor-pointer
                    ${notification.status === 'unread'
                      ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800'
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                    }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl">{notification.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {formatRelativeTime(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                Nenhuma notificação.
              </p>
            </div>
          )}
        </CardTech>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Chats */}
        <CardTech className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Conversas Recentes
              </h2>
            </div>
            <ButtonTech
              variant="ghost"
              size="sm"
              onClick={() => navigate('/chats')}
            >
              Ver todas
              <ArrowRight className="w-4 h-4 ml-1" />
            </ButtonTech>
          </div>

          {recentChats.length > 0 ? (
            <div className="space-y-3">
              {recentChats.map((chat) => {
                const lastMessage = getMessagesByChatId(chat.id).slice(-1)[0]
                return (
                  <div
                    key={chat.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                    onClick={() => navigate(`/chats/${chat.id}`)}
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                      {chat.customerName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {chat.customerName}
                        </p>
                        <span className="text-xs text-gray-500 dark:text-gray-500 whitespace-nowrap ml-2">
                          {formatRelativeTime(chat.lastMessageAt || chat.createdAt)}
                        </span>
                      </div>
                      {lastMessage && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {lastMessage.senderId === chat.providerId ? 'Você: ' : ''}
                          {lastMessage.content}
                        </p>
                      )}
                    </div>
                    {chat.unreadCount > 0 && (
                      <span className="flex-shrink-0 w-5 h-5 bg-primary-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                Nenhuma conversa ainda.
              </p>
            </div>
          )}
        </CardTech>

        {/* Top Clients */}
        <CardTech className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Top Clientes
              </h2>
            </div>
            <ButtonTech
              variant="ghost"
              size="sm"
              onClick={() => navigate('/clients')}
            >
              Ver todos
              <ArrowRight className="w-4 h-4 ml-1" />
            </ButtonTech>
          </div>

          {topClients.length > 0 ? (
            <div className="space-y-3">
              {topClients.map((client, index) => (
                <div
                  key={client.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                    ${index === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-200 text-gray-700'}
                  `}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {client.name}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {client.totalAppointments} agendamento{client.totalAppointments !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(client.totalSpent)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">total gasto</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                Nenhum cliente cadastrado.
              </p>
            </div>
          )}
        </CardTech>
      </div>
    </div>
  )
}
