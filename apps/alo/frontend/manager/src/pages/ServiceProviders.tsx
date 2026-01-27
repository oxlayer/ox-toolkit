import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { serviceProvidersService, serviceCategoriesService } from '../services/serviceProviders';
import type { ServiceProvider } from '../types';

export default function ServiceProviders() {
  const queryClient = useQueryClient();

  const { data: providers, isLoading } = useQuery({
    queryKey: ['service-providers'],
    queryFn: serviceProvidersService.getAll,
  });

  const { data: categories } = useQuery({
    queryKey: ['service-categories'],
    queryFn: serviceCategoriesService.getAll,
  });

  const deleteMutation = useMutation({
    mutationFn: serviceProvidersService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-providers'] });
    },
  });

  const toggleAvailabilityMutation = useMutation({
    mutationFn: ({ id, available }: { id: number; available: boolean }) =>
      serviceProvidersService.toggleAvailability(id, available),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-providers'] });
    },
  });

  const getCategoryName = (categoryId: number) => {
    return categories?.find((c) => c.id === categoryId)?.name || 'N/A';
  };

  if (isLoading) {
    return <div className="text-center py-12 text-gray-900 dark:text-white">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Service Providers</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage local service providers</p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/service-providers/categories"
            className="px-4 py-2 bg-gray-600 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
          >
            Manage Categories
          </Link>
          <Link
            to="/service-providers/new"
            className="px-4 py-2 bg-linear-to-r from-primary-500 to-primary-400 text-white rounded-lg hover:shadow-primary transition-all"
          >
            Add Provider
          </Link>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/50 overflow-hidden border border-gray-200 dark:border-gray-700">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Provider
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {providers?.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  No service providers found. Add your first one!
                </td>
              </tr>
            ) : (
              providers?.map((provider: ServiceProvider) => (
                <tr key={provider.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-linear-to-br from-primary-500 to-amber-600 flex items-center justify-center text-white font-semibold mr-3 shadow-primary">
                        {provider.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{provider.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">ID: {provider.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {getCategoryName(provider.category_id)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white">{provider.phone}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{provider.email}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {provider.city}, {provider.state}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() =>
                        toggleAvailabilityMutation.mutate({
                          id: provider.id,
                          available: !provider.available,
                        })
                      }
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                        provider.available
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      }`}
                    >
                      {provider.available ? 'Available' : 'Unavailable'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <Link
                      to={`/service-providers/${provider.id}/catalog`}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mr-3"
                    >
                      Catalog
                    </Link>
                    <Link
                      to={`/service-providers/${provider.id}/orders`}
                      className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 mr-3"
                    >
                      Orders
                    </Link>
                    <Link
                      to={`/service-providers/${provider.id}`}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mr-3"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this provider?')) {
                          deleteMutation.mutate(provider.id);
                        }
                      }}
                      className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
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
    </div>
  );
}
