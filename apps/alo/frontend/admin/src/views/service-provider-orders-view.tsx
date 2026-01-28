import { useNavigate, useParams, Link } from 'react-router-dom'
import { useServiceProvider, useServiceProviderOrders, useUpdateOrderStatus } from '@/hooks'
import { ButtonTech as TechButton } from '@acme/ui'
import type { ServiceProviderOrder } from '@/types'

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  in_progress: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
}

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

/**
 * Service provider orders view
 */
export function ServiceProviderOrdersView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const providerId = Number(id)

  const { data: provider } = useServiceProvider(providerId)
  const { data: orders, isLoading } = useServiceProviderOrders(providerId)
  const updateMutation = useUpdateOrderStatus()

  const handleStatusChange = (orderId: number, newStatus: string) => {
    updateMutation.mutate({ id: String(orderId), status: newStatus })
  }

  if (isLoading) {
    return <div className="py-12 text-center">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Service Orders</h1>
          <p className="mt-1 text-gray-500">
            {provider?.name} - Orders and scheduling
          </p>
        </div>
        <TechButton
          variant="outline"
          size="default"
          onClick={() => navigate('/service-providers')}
        >
          Back to Providers
        </TechButton>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
        <table className="w-full">
          <thead className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Order
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Service
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Scheduled
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {orders?.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  No orders found for this provider.
                </td>
              </tr>
            ) : (
              orders?.map((order: ServiceProviderOrder) => (
                <tr key={order.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">#{order.id}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {order.created_at ? new Date(order.created_at).toLocaleDateString() : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white">{order.customer_name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{order.customer_phone}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white">{order.catalog_item?.name}</div>
                    <div className="text-sm font-medium text-green-600 dark:text-green-400">
                      R$ {order.catalog_item?.price.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {order.scheduled_date ? new Date(order.scheduled_date).toLocaleString() : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id!, e.target.value)}
                      className={`rounded-full border-0 px-3 py-1 text-xs font-medium ${statusColors[order.status]}`}
                      disabled={updateMutation.isPending}
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {order.notes && (
                      <div className="mb-2 max-w-xs truncate text-xs text-gray-500 dark:text-gray-400" title={order.notes}>
                        📝 {order.notes}
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6">
        <Link to={`/service-providers/${providerId}/catalog`}>
          <TechButton variant="solid" size="default">
            Manage Catalog
          </TechButton>
        </Link>
      </div>
    </div>
  )
}
