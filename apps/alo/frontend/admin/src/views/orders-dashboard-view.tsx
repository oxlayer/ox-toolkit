import { useState } from 'react'
import { PageHeader } from '@/components/shared'
import { useOrdersDashboard, useServiceProviderOrders, useUpdateOrderStatus } from '@/hooks'
import type { ServiceProviderOrder, Establishment, ServiceProvider } from '@/types'

/**
 * Orders dashboard view with real-time monitoring
 */
export function OrdersDashboardView() {
  const { establishments, providers } = useOrdersDashboard()
  const updateStatusMutation = useUpdateOrderStatus()

  const [selectedProviderId, setSelectedProviderId] = useState<number | undefined>()
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const { data: allOrders, isLoading } = useServiceProviderOrders(selectedProviderId)

  // Calculate metrics
  const totalOrders = allOrders?.length || 0
  const pendingOrders = allOrders?.filter(o => o.status === 'pending').length || 0
  const confirmedOrders = allOrders?.filter(o => o.status === 'confirmed').length || 0
  const inProgressOrders = allOrders?.filter(o => o.status === 'in_progress').length || 0
  const completedOrders = allOrders?.filter(o => o.status === 'completed').length || 0
  const cancelledOrders = allOrders?.filter(o => o.status === 'cancelled').length || 0

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
      case 'confirmed': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400'
      case 'in_progress': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400'
      case 'completed': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
      case 'cancelled': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente'
      case 'confirmed': return 'Confirmado'
      case 'in_progress': return 'Em Andamento'
      case 'completed': return 'Concluído'
      case 'cancelled': return 'Cancelado'
      default: return status
    }
  }

  const handleStatusChange = (orderId: number, newStatus: string) => {
    updateStatusMutation.mutate({ id: String(orderId), status: newStatus })
  }

  const filteredOrders = allOrders?.filter(order => filterStatus === 'all' || order.status === filterStatus) ?? []

  const metricsCards = [
    { label: 'Total Orders', value: totalOrders, color: 'bg-blue-100 dark:bg-blue-900/30', textColor: 'text-gray-900 dark:text-white', dotColor: 'bg-blue-500' },
    { label: 'Pending', value: pendingOrders, color: 'bg-yellow-100 dark:bg-yellow-900/30', textColor: 'text-yellow-600 dark:text-yellow-400', dotColor: 'bg-yellow-500' },
    { label: 'In Progress', value: inProgressOrders, color: 'bg-purple-100 dark:bg-purple-900/30', textColor: 'text-purple-600 dark:text-purple-400', dotColor: 'bg-purple-500' },
    { label: 'Confirmed', value: confirmedOrders, color: 'bg-blue-100 dark:bg-blue-900/30', textColor: 'text-blue-600 dark:text-blue-400', dotColor: 'bg-blue-500' },
    { label: 'Completed', value: completedOrders, color: 'bg-green-100 dark:bg-green-900/30', textColor: 'text-green-600 dark:text-green-400', dotColor: 'bg-green-500' },
    { label: 'Cancelled', value: cancelledOrders, color: 'bg-red-100 dark:bg-red-900/30', textColor: 'text-red-600 dark:text-red-400', dotColor: 'bg-red-500' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders Dashboard"
        description="Monitor orders in real-time"
      />

      {/* Filters */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Filter by Service Provider
            </label>
            <select
              value={selectedProviderId ?? ''}
              onChange={(e) => setSelectedProviderId(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2 text-gray-900 dark:text-white focus:border-transparent focus:ring-2 focus:ring-primary-500 transition-all"
            >
              <option value="">All Providers</option>
              {providers.map((provider: ServiceProvider) => (
                <option key={provider.id} value={provider.id}>{provider.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Filter by Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2 text-gray-900 dark:text-white focus:border-transparent focus:ring-2 focus:ring-primary-500 transition-all"
            >
              <option value="all">All Status</option>
              <option value="pending">Pendente</option>
              <option value="confirmed">Confirmado</option>
              <option value="in_progress">Em Andamento</option>
              <option value="completed">Concluído</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metricsCards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{card.label}</p>
                <p className={`text-3xl font-bold ${card.textColor}`}>{card.value}</p>
              </div>
              <div className={`h-12 w-12 rounded-lg ${card.color} flex items-center justify-center`}>
                <div className={`h-6 w-6 rounded-full ${card.dotColor}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Orders Table */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Recent Orders {totalOrders > 0 && `(${totalOrders})`}
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Scheduled Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    Loading...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No orders found
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order: ServiceProviderOrder) => (
                  <tr key={order.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      #{order.id}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {order.customer_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {order.customer_phone || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {order.customer_address || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {order.scheduled_date ? new Date(order.scheduled_date).toLocaleString('pt-BR') : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id!, e.target.value)}
                        className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-1 text-sm text-gray-900 dark:text-white focus:border-transparent focus:ring-2 focus:ring-primary-500 transition-all"
                        disabled={updateStatusMutation.isPending}
                      >
                        <option value="pending">Pendente</option>
                        <option value="confirmed">Confirmado</option>
                        <option value="in_progress">Em Andamento</option>
                        <option value="completed">Concluído</option>
                        <option value="cancelled">Cancelado</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
        <span className="inline-flex items-center">
          <span className="mr-2 h-2 w-2 animate-pulse rounded-full bg-green-500" />
          Auto-refresh every 10 seconds
        </span>
      </div>
    </div>
  )
}
