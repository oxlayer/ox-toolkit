import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { deliveryMenService } from '../services/users';
import type { DeliveryMan } from '../types';

export default function DeliveryMen() {
  const queryClient = useQueryClient();

  const { data: deliveryMen, isLoading } = useQuery({
    queryKey: ['delivery-men'],
    queryFn: deliveryMenService.getAll,
  });

  const deleteMutation = useMutation({
    mutationFn: deliveryMenService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-men'] });
    },
  });

  if (isLoading) {
    return <div className="text-center py-12 text-gray-900 dark:text-white">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Delivery Men</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage delivery personnel</p>
        </div>
        <Link
          to="/delivery-men/new"
          className="px-4 py-2 bg-linear-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
        >
          Add Delivery Man
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/50 overflow-hidden border border-gray-200 dark:border-gray-700">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {deliveryMen?.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  No delivery men found. Create your first one!
                </td>
              </tr>
            ) : (
              deliveryMen?.map((person: DeliveryMan) => (
                <tr key={person.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-linear-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-semibold mr-3">
                        {person.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{person.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">ID: {person.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{person.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{person.phone || '-'}</td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <Link
                      to={`/delivery-men/${person.id}`}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mr-4"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this delivery person?')) {
                          deleteMutation.mutate(person.id);
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
