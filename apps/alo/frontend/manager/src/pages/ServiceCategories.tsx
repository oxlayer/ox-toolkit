import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { serviceCategoriesService } from '../services/serviceProviders';
import type { ServiceProviderCategory } from '../types';
import { useState } from 'react';

export default function ServiceCategories() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });

  const { data: categories, isLoading } = useQuery({
    queryKey: ['service-categories'],
    queryFn: serviceCategoriesService.getAll,
  });

  const createMutation = useMutation({
    mutationFn: serviceCategoriesService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-categories'] });
      setNewCategory({ name: '', description: '' });
      setIsCreating(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: serviceCategoriesService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-categories'] });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(newCategory);
  };

  if (isLoading) {
    return <div className="text-center py-12 text-gray-900 dark:text-white">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Service Categories</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage provider categories like Diarista, Eletricista, etc.</p>
        </div>

        <div className="flex gap-3">
          {!isCreating && (
            <button
              onClick={() => setIsCreating(true)}
              className="px-6 py-2 bg-linear-to-r from-primary-500 to-primary-400 text-white rounded-lg hover:shadow-primary transition-all"
            >
              + Add New Category
            </button>
          )}

          <button
            onClick={() => navigate('/service-providers')}
            className="px-4 py-2 bg-linear-to-r from-primary-500 to-primary-400 text-white rounded-lg hover:shadow-primary transition-all"
          >
            Back to Providers
          </button>
        </div>
      </div>

      {isCreating && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/50 p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">New Category</h2>
          <form onSubmit={handleCreate} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Name *
              </label>
              <input
                type="text"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                required
                placeholder="e.g., Diarista, Eletricista, Marceneiro"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <input
                type="text"
                value={newCategory.description}
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                placeholder="Brief description of the category"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
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
                  setNewCategory({ name: '', description: '' });
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
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {categories?.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  No categories found. Create your first one!
                </td>
              </tr>
            ) : (
              categories?.map((category: ServiceProviderCategory) => (
                <tr key={category.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-lg bg-linear-to-br from-primary-500 to-amber-600 flex items-center justify-center text-white font-semibold mr-3">
                        {category.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{category.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {category.description || '-'}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this category?')) {
                          deleteMutation.mutate(category.id);
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
