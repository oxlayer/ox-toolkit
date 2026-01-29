/**
 * Dashboard Page
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, Calendar, MessageSquare, Wrench, TrendingUp, Clock,
  ArrowRight, Star, Bell, Loader2, DollarSign, ArrowUpRight, ArrowDownRight,
  CheckCircle2, XCircle, Target, Repeat
} from 'lucide-react'
import { CardTech, ButtonTech } from '@acme/ui'
import { PageHeader } from '@/components/page-header'
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
} from '@/mocks'
import { format, isToday, isTomorrow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function DashboardPage() {
  const navigate = useNavigate()
  const [mounted, setMounted] = useState(false)

  // Infinite Scroll for Notifications
  const [visibleNotifications, setVisibleNotifications] = useState(5)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMoreNotifications, setHasMoreNotifications] = useState(true)
  const observerTarget = useRef<HTMLDivElement>(null)

  // Stats
  const totalClients = mockClients.length
  const upcomingAppointments = getUpcomingAppointments().slice(0, 5)
  const unreadChats = getChatsWithUnread().length
  const activeServices = getActiveServices().length
  const unreadNotifications = getUnreadCount()
  const topClients = getTopClients(5)
  const recentChats = mockChats.slice(0, 5)
  const displayedNotifications = mockNotifications.slice(0, visibleNotifications)

  // Business Metrics - Revenue & Performance
  const thisWeekRevenue = 4850
  const lastWeekRevenue = 3200
  const revenueChange = ((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100

  const completedAppointmentsThisWeek = 12
  const completedAppointmentsLastWeek = 10
  const appointmentsChange = ((completedAppointmentsThisWeek - completedAppointmentsLastWeek) / completedAppointmentsLastWeek) * 100

  // Conversion Funnel
  const totalChats = mockChats.length
  const chatsToAppointments = 15
  const appointmentsToCompleted = 12

  // Revenue Chart Data (last 7 days)
  const revenueData = [
    { day: 'Seg', value: 420 },
    { day: 'Ter', value: 580 },
    { day: 'Qua', value: 890 },
    { day: 'Qui', value: 650 },
    { day: 'Sex', value: 1120 },
    { day: 'Sáb', value: 780 },
    { day: 'Dom', value: 410 },
  ]
  const maxRevenue = Math.max(...revenueData.map(d => d.value))

  // Load more notifications
  const loadMoreNotifications = useCallback(() => {
    if (isLoadingMore || !hasMoreNotifications) return

    setIsLoadingMore(true)

    // Simulate API delay
    setTimeout(() => {
      setVisibleNotifications(prev => {
        const next = prev + 5
        if (next >= mockNotifications.length) {
          setHasMoreNotifications(false)
        }
        return next
      })
      setIsLoadingMore(false)
    }, 500)
  }, [isLoadingMore, hasMoreNotifications])

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreNotifications && !isLoadingMore) {
          loadMoreNotifications()
        }
      },
      { threshold: 0.1 }
    )

    const currentTarget = observerTarget.current
    if (currentTarget) {
      observer.observe(currentTarget)
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget)
      }
    }
  }, [hasMoreNotifications, isLoadingMore, loadMoreNotifications])

  // Update hasMore when notifications change
  useEffect(() => {
    setHasMoreNotifications(visibleNotifications < mockNotifications.length)
  }, [visibleNotifications])

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
        <PageHeader
          title="Relatórios"
          subtitle="Visão geral do seu negócio."
        />
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
      <PageHeader
        title="Relatórios"
        subtitle="Visão geral do seu negócio."
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <CardTech className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Faturamento</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(thisWeekRevenue)}
              </p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-3">
            {revenueChange >= 0 ? (
              <ArrowUpRight className="w-4 h-4 text-emerald-600" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-red-600" />
            )}
            <p className={`text-xs font-medium ${revenueChange >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {revenueChange >= 0 ? '+' : ''}{revenueChange.toFixed(0)}% vs semana anterior
            </p>
          </div>
        </CardTech>

        <CardTech className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Atendimentos</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {completedAppointmentsThisWeek}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-3">
            {appointmentsChange >= 0 ? (
              <ArrowUpRight className="w-4 h-4 text-blue-600" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-red-600" />
            )}
            <p className={`text-xs font-medium ${appointmentsChange >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
              {appointmentsChange >= 0 ? '+' : ''}{appointmentsChange.toFixed(0)}% vs semana anterior
            </p>
          </div>
        </CardTech>

        <CardTech className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Taxa de Conversão</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {((appointmentsToCompleted / chatsToAppointments) * 100).toFixed(0)}%
              </p>
            </div>
            <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/30 rounded-full flex items-center justify-center">
              <Target className="w-6 h-6 text-violet-600 dark:text-violet-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
            {appointmentsToCompleted} de {chatsToAppointments} agendamentos concluídos
          </p>
        </CardTech>

        <CardTech className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Clientes Recorrentes</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {Math.round(totalClients * 0.35)}
              </p>
            </div>
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
              <Repeat className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
            35% retornam para novos serviços
          </p>
        </CardTech>
      </div>

      {/* Revenue Chart & Conversion Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <CardTech className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary-500" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Receita da Semana
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(thisWeekRevenue)} esta semana
                </p>
              </div>
            </div>
          </div>

          {/* Simple CSS Bar Chart */}
          <div className="flex items-end justify-between gap-2 h-48">
            {revenueData.map((item) => {
              const height = (item.value / maxRevenue) * 100
              const isToday = item.day === format(new Date(), 'EEE', { locale: ptBR }).replace('.', '').charAt(0).toUpperCase() + item.day.slice(1)
              return (
                <div key={item.day} className="flex-1 flex flex-col items-center gap-2">
                  <div className="relative w-full flex items-end justify-center h-36">
                    <div
                      className={`w-full max-w-[40px] rounded-t-lg transition-all hover:opacity-80 ${
                        isToday ? 'bg-primary-500' : 'bg-primary-200 dark:bg-primary-800'
                      }`}
                      style={{ height: `${height}%` }}
                    >
                      <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(item.value)}
                      </span>
                    </div>
                  </div>
                  <span className={`text-xs font-medium ${isToday ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    {item.day}
                  </span>
                </div>
              )
            })}
          </div>
        </CardTech>

        {/* Conversion Funnel */}
        <CardTech className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Target className="w-5 h-5 text-primary-500" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Funil de Vendas
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Conversão esta semana
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Stage 1: Conversas */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Conversas
                </span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{totalChats}</span>
              </div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '100%' }} />
              </div>
            </div>

            {/* Stage 2: Agendamentos */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Agendamentos
                </span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{chatsToAppointments}</span>
              </div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-violet-500 rounded-full"
                  style={{ width: `${(chatsToAppointments / totalChats) * 100}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {((chatsToAppointments / totalChats) * 100).toFixed(0)}% de conversão
              </p>
            </div>

            {/* Stage 3: Concluídos */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Concluídos
                </span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{appointmentsToCompleted}</span>
              </div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${(appointmentsToCompleted / totalChats) * 100}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {((appointmentsToCompleted / totalChats) * 100).toFixed(0)}% do total
              </p>
            </div>

            {/* Summary */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Taxa de conclusão
                </span>
                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {((appointmentsToCompleted / chatsToAppointments) * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
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
              variant="outline"
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
        <CardTech className="p-6 flex flex-col max-h-[500px]">
          <div className="flex items-center justify-between mb-4 shrink-0">
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

          <div className="flex-1 overflow-y-auto space-y-3 min-h-0">
            {displayedNotifications.length > 0 ? (
              <>
                {displayedNotifications.map((notification) => (
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

                {/* Loading indicator */}
                {hasMoreNotifications && (
                  <div
                    ref={observerTarget}
                    className="flex items-center justify-center py-3"
                  >
                    {isLoadingMore ? (
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <Loader2 className="size-4 animate-spin" />
                        <span>Carregando...</span>
                      </div>
                    ) : (
                      <div className="h-1" />
                    )}
                  </div>
                )}

                {/* End of notifications */}
                {!hasMoreNotifications && displayedNotifications.length > 0 && (
                  <div className="text-center py-2">
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      Todas as notificações foram carregadas
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  Nenhuma notificação.
                </p>
              </div>
            )}
          </div>
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
              variant="outline"
              size="sm"
              onClick={() => navigate('/')}
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
                    onClick={() => navigate(`/c/${chat.id}`)}
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
              variant="outline"
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
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                  onClick={() => navigate(`/clients/${client.id}`)}
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
