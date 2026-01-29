/**
 * Clients List Page
 */

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Users, Calendar, DollarSign, MoreVertical, ArrowRight, Filter } from 'lucide-react'
import { CardTech, ButtonTech, InputTech } from '@acme/ui'
import { PageHeader } from '@/components/page-header'
import { mockClients, mockAppointments } from '@/mocks'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ClientStats {
  totalSpent: number
  totalAppointments: number
  lastVisit: Date | null
  nextAppointment: Date | null
}

export default function ClientsPage() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

  // Calculate stats for each client
  const clientsWithStats = mockClients.map(client => {
    const clientAppointments = mockAppointments.filter(a => a.clientName === client.name)
    const completedAppointments = clientAppointments.filter(a => a.status === 'completed')

    return {
      ...client,
      stats: {
        totalSpent: completedAppointments.reduce((sum, a) => sum + (a.price || 0), 0),
        totalAppointments: completedAppointments.length,
        lastVisit: completedAppointments.length > 0
          ? new Date(Math.max(...completedAppointments.map(a => new Date(a.startAt).getTime())))
          : null,
        nextAppointment: clientAppointments.find(a => new Date(a.startAt) > new Date())?.startAt || null,
      } as ClientStats,
    }
  }).sort((a, b) => b.stats.totalSpent - a.stats.totalSpent)

  // Filter by search
  const filteredClients = clientsWithStats.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.phone?.includes(searchQuery)
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes"
        subtitle="Gerencie seus clientes e acompanhe o histórico."
      />

      {/* Search and Filters */}
      <CardTech className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <InputTech
              placeholder="Buscar por nome, email ou telefone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <ButtonTech variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            Filtros
          </ButtonTech>
        </div>
      </CardTech>

      {/* Clients Grid */}
      {filteredClients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => (
            <Link to={`/clients/${client.id}`}>
              <CardTech
                key={client.id}
                className="p-5 cursor-pointer hover:shadow-lg hover:border-primary-200 dark:hover:border-primary-800 transition-all"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                      {client.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {client.name}
                      </h3>
                      {client.email && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[150px]">
                          {client.email}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      // TODO: Open menu
                    }}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <MoreVertical className="w-4 h-4 text-gray-400" />
                  </button>
                </div>

                {/* Stats */}
                <div className="space-y-3">
                  {/* Total Spent */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                      Total gasto
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(client.stats.totalSpent)}
                    </span>
                  </div>

                  {/* Appointments */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      Atendimentos
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {client.stats.totalAppointments}
                    </span>
                  </div>

                  {/* Last Visit */}
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    {client.stats.nextAppointment ? (
                      <div className="flex items-center gap-2 text-xs text-primary-600 dark:text-primary-400">
                        <Calendar className="w-3.5 h-3.5" />
                        Próximo: {format(new Date(client.stats.nextAppointment), "dd 'de' MMM, HH:mm", { locale: ptBR })}
                      </div>
                    ) : client.stats.lastVisit ? (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Última visita: {format(client.stats.lastVisit, "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Nenhum atendimento ainda
                      </p>
                    )}
                  </div>
                </div>

                {/* View Details Link */}
                <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-sm">
                  <span className="text-primary-600 dark:text-primary-400 font-medium">
                    Ver histórico completo
                  </span>
                  <ArrowRight className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                </div>
              </CardTech>
            </Link>
          ))}
        </div>
      ) : (
        <CardTech className="p-12 text-center">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Nenhum cliente encontrado
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {searchQuery ? 'Tente buscar com outro termo.' : 'Comece adicionando clientes.'}
          </p>
        </CardTech>
      )}
    </div>
  )
}
