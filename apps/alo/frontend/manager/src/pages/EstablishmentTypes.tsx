import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { establishmentTypesService } from '../services/establishmentTypes';
import type { EstablishmentType } from '../types';
import { useState } from 'react';

export default function EstablishmentTypes() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [newType, setNewType] = useState({
    name: '',
    description: '',
    requires_delivery: false,
    requires_location: true,
    requires_menu: false,
    requires_hours: true,
  });

  const { data: types, isLoading } = useQuery({
    queryKey: ['establishment-types'],
    queryFn: establishmentTypesService.getAll,
  });

  const createMutation = useMutation({
    mutationFn: establishmentTypesService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['establishment-types'] });
      setNewType({
        name: '',
        description: '',
        requires_delivery: false,
        requires_location: true,
        requires_menu: false,
        requires_hours: true,
      });
      setIsCreating(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: establishmentTypesService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['establishment-types'] });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(newType);
  };

  if (isLoading) {
    return <div className="text-center py-12 text-gray-900 dark:text-white">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Establishment Types</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage establishment types like Restaurant, Pharmacy, Gas Station, etc.</p>
        </div>

        <div className="flex gap-3">
          {!isCreating && (
            <button
              onClick={() => setIsCreating(true)}
              className="px-6 py-2 bg-linear-to-r from-primary-500 to-primary-400 text-white rounded-lg hover:shadow-primary transition-all"
            >
              + Add New Type
            </button>
          )}

          <Link
            to="/establishments"
            className="px-4 py-2 bg-linear-to-r from-primary-500 to-primary-400 text-white rounded-lg hover:shadow-primary transition-all"
          >
            Back to Establishments
          </Link>
        </div>
      </div>

      {isCreating && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/50 p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">New Establishment Type</h2>
          <form onSubmit={handleCreate} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Name *
              </label>
              <input
                type="text"
                value={newType.name}
                onChange={(e) => setNewType({ ...newType, name: e.target.value })}
                required
                placeholder="e.g., Restaurante, Farmácia, Posto de Gasolina"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <input
                type="text"
                value={newType.description}
                onChange={(e) => setNewType({ ...newType, description: e.target.value })}
                placeholder="Brief description of this establishment type"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Required Fields
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newType.requires_delivery}
                    onChange={(e) => setNewType({ ...newType, requires_delivery: e.target.checked })}
                    className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Requires Delivery</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newType.requires_location}
                    onChange={(e) => setNewType({ ...newType, requires_location: e.target.checked })}
                    className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Requires Location</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newType.requires_menu}
                    onChange={(e) => setNewType({ ...newType, requires_menu: e.target.checked })}
                    className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Requires Menu</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newType.requires_hours}
                    onChange={(e) => setNewType({ ...newType, requires_hours: e.target.checked })}
                    className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Requires Operating Hours</span>
                </label>
              </div>
            </div>
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="px-4 py-2 bg-linear-to-r from-primary-500 to-primary-400 text-white rounded-lg hover:shadow-primary disabled:opacity-50 transition-all"
              >
                {createMutation.isPending ? 'Creating...' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setNewType({
                    name: '',
                    description: '',
                    requires_delivery: false,
                    requires_location: true,
                    requires_menu: false,
                    requires_hours: true,
                  });
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/50 overflow-hidden border border-gray-200 dark:border-gray-700">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Requirements
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {types?.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  No establishment types found. Create your first one!
                </td>
              </tr>
            ) : (
              types?.map((type: EstablishmentType) => (
                <tr key={type.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-lg bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold mr-3">
                        {type.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{type.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {type.description || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {type.requires_delivery && (
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">Delivery</span>
                      )}
                      {type.requires_location && (
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded-full">Location</span>
                      )}
                      {type.requires_menu && (
                        <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs rounded-full">Menu</span>
                      )}
                      {type.requires_hours && (
                        <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs rounded-full">Hours</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this establishment type?')) {
                          deleteMutation.mutate(type.id);
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
