import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { establishmentsService } from '../services/establishments';
import type { Establishment } from '../types';

export default function Establishments() {
  const queryClient = useQueryClient();

  const { data: establishments, isLoading } = useQuery({
    queryKey: ['establishments'],
    queryFn: establishmentsService.getAll,
  });

  const deleteMutation = useMutation({
    mutationFn: establishmentsService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['establishments'] });
    },
  });

  if (isLoading) {
    return <div className="text-center py-12 text-gray-900 dark:text-white">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Establishments</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage partner establishments</p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/establishments/types"
            className="px-4 py-2 border border-primary-500 text-primary-600 dark:text-primary-400 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
          >
            Manage Types
          </Link>
          <Link
            to="/establishments/new"
            className="px-4 py-2 bg-linear-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all"
          >
            Add Establishment
          </Link>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/50 overflow-hidden border border-gray-200 dark:border-gray-700">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Hours
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {establishments?.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  No establishments found. Create your first one!
                </td>
              </tr>
            ) : (
              establishments?.map((establishment: Establishment) => (
                <tr key={establishment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {establishment.image && (
                        <img
                          src={establishment.image}
                          alt={establishment.name}
                          className="h-10 w-10 rounded-lg object-cover mr-3"
                        />
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{establishment.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">ID: {establishment.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {establishment.location_string || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {establishment.horario_funcionamento || '-'}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <Link
                      to={`/establishments/${establishment.id}`}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mr-4"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this establishment?')) {
                          deleteMutation.mutate(establishment.id);
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
