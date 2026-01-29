/**
 * Agenda Page - Client Appointments Calendar
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { getDay, getDaysInMonth, isSameDay, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import { CardTech } from '@acme/ui'
import { PageHeader } from '@/components/page-header'
import { mockAppointments } from '@/mocks'

type CalendarMonth = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11

export interface Appointment {
  id: string
  clientName: string
  service: string
  startAt: Date
  endAt: Date
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled'
  color: string
}

const STATUS_LABELS: Record<Appointment['status'], string> = {
  scheduled: 'Agendado',
  confirmed: 'Confirmado',
  completed: 'Concluído',
  cancelled: 'Cancelado',
}

export default function AgendaPage() {
  const [mounted, setMounted] = useState(false)
  const [month, setMonth] = useState<CalendarMonth>(new Date().getMonth() as CalendarMonth)
  const [year, setYear] = useState(new Date().getFullYear())
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  useEffect(() => {
    setMounted(true)
    setAppointments(mockAppointments)
  }, [])

  // Memoize expensive date calculations
  const currentMonthDate = useMemo(() => new Date(year, month, 1), [year, month])
  const daysInMonth = useMemo(() => getDaysInMonth(currentMonthDate), [currentMonthDate])
  const firstDay = useMemo(() => (getDay(currentMonthDate) + 6) % 7, [currentMonthDate]) // Start on Monday

  // Memoize previous month calculations
  const prevMonthData = useMemo(() => {
    const prevMonth = month === 0 ? 11 : (month - 1) as CalendarMonth
    const prevMonthYear = month === 0 ? year - 1 : year
    const prevMonthDays = getDaysInMonth(new Date(prevMonthYear, prevMonth, 1))
    const prevMonthDaysArray = Array.from({ length: prevMonthDays }, (_, i) => i + 1)
    return { prevMonthDays, prevMonthDaysArray }
  }, [month, year])

  // Memoize next month calculations
  const nextMonthData = useMemo(() => {
    const nextMonth = month === 11 ? 0 : (month + 1) as CalendarMonth
    const nextMonthYear = month === 11 ? year + 1 : year
    const nextMonthDays = getDaysInMonth(new Date(nextMonthYear, nextMonth, 1))
    const nextMonthDaysArray = Array.from({ length: nextMonthDays }, (_, i) => i + 1)
    return { nextMonthDaysArray }
  }, [month, year])

  // Memoize appointments filtering by day
  const appointmentsByDay = useMemo(() => {
    const result: { [day: number]: Appointment[] } = {}
    for (let day = 1; day <= daysInMonth; day++) {
      result[day] = appointments.filter(appointment => {
        return isSameDay(new Date(appointment.startAt), new Date(year, month, day))
      })
    }
    return result
  }, [appointments, daysInMonth, year, month])

  const monthName = format(currentMonthDate, 'MMMM', { locale: ptBR })

  // Get day names in Portuguese starting from Monday
  const weekDays = useMemo(() => {
    const days: string[] = []
    const baseDate = new Date(2024, 0, 1) // Monday

    for (let i = 0; i < 7; i++) {
      const date = new Date(baseDate)
      date.setDate(baseDate.getDate() + i)
      days.push(format(date, 'EEE', { locale: ptBR }))
    }

    return days
  }, [])

  const handlePreviousMonth = useCallback(() => {
    if (month === 0) {
      setMonth(11)
      setYear(year - 1)
    } else {
      setMonth((month - 1) as CalendarMonth)
    }
  }, [month, year])

  const handleNextMonth = useCallback(() => {
    if (month === 11) {
      setMonth(0)
      setYear(year + 1)
    } else {
      setMonth((month + 1) as CalendarMonth)
    }
  }, [month, year])

  const selectedDayAppointments = selectedDate
    ? appointments.filter(appointment =>
        isSameDay(new Date(appointment.startAt), selectedDate)
      )
    : []

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Agenda</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Visualize e gerencie seus agendamentos.
          </p>
        </div>
        <CardTech className="p-12 text-center">
          <div className="h-64 bg-gray-100 dark:bg-gray-700 animate-pulse rounded-lg" />
        </CardTech>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Agenda"
        subtitle="Visualize e gerencie seus agendamentos."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <CardTech className="lg:col-span-2 p-0 overflow-hidden">
          <div className="flex flex-col h-full">
            {/* Calendar Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={handlePreviousMonth}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                aria-label="Previous month"
              >
                <ChevronLeft className="size-5" />
              </button>

              <h2 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                {monthName} {year}
              </h2>

              <button
                type="button"
                onClick={handleNextMonth}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                aria-label="Next month"
              >
                <ChevronRight className="size-5" />
              </button>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="p-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 flex-grow">
              {/* Previous month days */}
              {Array.from({ length: firstDay }).map((_, i) => {
                const day = prevMonthData.prevMonthDaysArray[prevMonthData.prevMonthDays - firstDay + i]
                return (
                  <div
                    key={`prev-${i}`}
                    className="relative aspect-square p-1 bg-gray-50 dark:bg-gray-800/50"
                  >
                    <span className="text-xs text-gray-400 dark:text-gray-600">{day}</span>
                  </div>
                )
              })}

              {/* Current month days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const dayAppointments = appointmentsByDay[day] || []
                const date = new Date(year, month, day)
                const isToday = isSameDay(date, new Date())
                const isSelected = selectedDate && isSameDay(date, selectedDate)

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setSelectedDate(date)}
                    className={`
                      relative aspect-square p-1 border-t border-r border-gray-200 dark:border-gray-700
                      hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors
                      ${isSelected ? 'bg-primary-50 dark:bg-primary-900/20' : ''}
                    `}
                  >
                    <span
                      className={`
                        text-xs font-medium
                        ${isToday
                          ? 'inline-flex items-center justify-center w-6 h-6 bg-primary-500 text-white rounded-full'
                          : 'text-gray-900 dark:text-gray-100'
                        }
                      `}
                    >
                      {day}
                    </span>
                    <div className="mt-1 space-y-0.5">
                      {dayAppointments.slice(0, 2).map((appointment) => (
                        <div
                          key={appointment.id}
                          className="text-[10px] truncate px-1 py-0.5 rounded text-white"
                          style={{ backgroundColor: appointment.color }}
                        >
                          {appointment.clientName}
                        </div>
                      ))}
                      {dayAppointments.length > 2 && (
                        <span className="text-[10px] text-gray-500 dark:text-gray-400">
                          +{dayAppointments.length - 2}
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}

              {/* Next month days */}
              {(() => {
                const totalCells = firstDay + daysInMonth
                const remainingCells = 7 - (totalCells % 7)
                if (remainingCells >= 7) return null

                return Array.from({ length: remainingCells }).map((_, i) => {
                  const day = nextMonthData.nextMonthDaysArray[i]
                  return (
                    <div
                      key={`next-${i}`}
                      className="relative aspect-square p-1 bg-gray-50 dark:bg-gray-800/50"
                    >
                      <span className="text-xs text-gray-400 dark:text-gray-600">{day}</span>
                    </div>
                  )
                })
              })()}
            </div>
          </div>
        </CardTech>

        {/* Day Details */}
        <CardTech className="p-6">
          {selectedDate ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CalendarDays className="size-5 text-primary-500" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                </h3>
              </div>

              {selectedDayAppointments.length > 0 ? (
                <div className="space-y-3">
                  {selectedDayAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {appointment.clientName}
                        </span>
                        <span
                          className="text-xs px-2 py-1 rounded-full text-white"
                          style={{ backgroundColor: appointment.color }}
                        >
                          {STATUS_LABELS[appointment.status]}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {appointment.service}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {format(appointment.startAt, 'HH:mm')} - {format(appointment.endAt, 'HH:mm')}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">
                    Nenhum agendamento para este dia.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <CalendarDays className="size-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                Selecione um dia para ver os agendamentos.
              </p>
            </div>
          )}
        </CardTech>
      </div>
    </div>
  )
}
