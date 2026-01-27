import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { serviceProviderOrdersService, serviceProvidersService } from '../services/serviceProviders';
import type { ServiceProviderOrder } from '../types';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export default function ServiceProviderOrders() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const providerId = Number(id);

  const { data: provider } = useQuery({
    queryKey: ['service-providers', id],
    queryFn: () => serviceProvidersService.getById(providerId),
  });

  const { data: orders, isLoading } = useQuery({
    queryKey: ['service-orders', id],
    queryFn: () => serviceProviderOrdersService.getAll(providerId),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: number; status: string }) =>
      serviceProviderOrdersService.updateStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-orders', id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: serviceProviderOrdersService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-orders', id] });
    },
  });

  const handleStatusChange = (orderId: number, newStatus: string) => {
    updateStatusMutation.mutate({ orderId, status: newStatus });
  };

  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Service Orders</h1>
          <p className="text-gray-500 mt-1">
            {provider?.name} - Orders and scheduling
          </p>
        </div>
        <button
          onClick={() => navigate('/service-providers')}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Back to Providers
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Service
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Scheduled
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {orders?.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  No orders found for this provider.
                </td>
              </tr>
            ) : (
              orders?.map((order: ServiceProviderOrder) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">#{order.id}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(order.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{order.customer_name}</div>
                    <div className="text-sm text-gray-500">{order.customer_phone}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{order.catalog_item?.name}</div>
                    <div className="text-sm text-green-600 font-medium">
                      R$ {order.catalog_item?.price.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(order.scheduled_date).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border-0 ${statusColors[order.status]}`}
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    {order.notes && (
                      <div className="mb-2 text-xs text-gray-500 max-w-xs truncate" title={order.notes}>
                        📝 {order.notes}
                      </div>
                    )}
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this order?')) {
                          deleteMutation.mutate(order.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6">
        <Link
          to={`/service-providers/${providerId}/catalog`}
          className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors inline-block"
        >
          Manage Catalog
        </Link>
      </div>
    </div>
  );
}
