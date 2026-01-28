import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { serviceCatalogService, serviceProvidersService } from '../services/serviceProviders';
import type { ServiceCatalogItem, ServiceProvider } from '../types';
import { useState } from 'react';

export default function ServiceCatalog() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const providerId = Number(id);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState<ServiceCatalogItem | null>(null);
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    price: '',
    estimated_duration: '',
    active: true,
    image: '',
    stock: '',
  });

  const { data: provider } = useQuery({
    queryKey: ['service-providers', id],
    queryFn: () => serviceProvidersService.getById(providerId),
  });

  const { data: catalog, isLoading } = useQuery({
    queryKey: ['service-catalog', id],
    queryFn: () => serviceCatalogService.getByProvider(providerId),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) =>
      serviceCatalogService.create({
        provider_id: providerId,
        ...data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-catalog', id] });
      setNewItem({ name: '', description: '', price: '', estimated_duration: '', active: true, image: '', stock: '' });
      setIsCreating(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) =>
      serviceCatalogService.update(isEditing!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-catalog', id] });
      setIsEditing(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: serviceCatalogService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-catalog', id] });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ itemId, active }: { itemId: number; active: boolean }) =>
      serviceCatalogService.toggleActive(itemId, active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-catalog', id] });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      name: newItem.name,
      description: newItem.description,
      price: Number(newItem.price),
      estimated_duration: Number(newItem.estimated_duration),
      active: true,
      image: newItem.image,
      stock: newItem.stock ? Number(newItem.stock) : undefined,
    });
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      name: newItem.name,
      description: newItem.description,
      price: Number(newItem.price),
      estimated_duration: Number(newItem.estimated_duration),
      active: newItem.active,
      image: newItem.image,
      stock: newItem.stock ? Number(newItem.stock) : undefined,
    });
  };

  const startEdit = (item: ServiceCatalogItem) => {
    setIsEditing(item);
    setNewItem({
      name: item.name,
      description: item.description,
      price: String(item.price),
      estimated_duration: String(item.estimated_duration),
      active: item.active,
      image: item.image || '',
      stock: item.stock ? String(item.stock) : '',
    });
    setIsCreating(true);
  };

  const cancelEdit = () => {
    setIsEditing(null);
    setNewItem({ name: '', description: '', price: '', estimated_duration: '', active: true, image: '', stock: '' });
    setIsCreating(false);
  };

  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Service Catalog</h1>
          <p className="text-gray-500 mt-1">
            {provider?.name} - Manage their service offerings
          </p>
        </div>
        <button
          onClick={() => navigate('/service-providers')}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Back to Providers
        </button>
      </div>

      {(isCreating || isEditing) && (
        <div className=" bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {isEditing ? 'Edit Service Item' : 'Add Service Item'}
          </h2>
          <form onSubmit={isEditing ? handleEdit : handleCreate} className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Service Name *
                </label>
                <input
                  type="text"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  required
                  placeholder="e.g., Faxina casa 200m²"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Price (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newItem.price}
                  onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                  required
                  placeholder="150.00"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                placeholder="Details about the service"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Duration (min) *
                </label>
                <input
                  type="number"
                  value={newItem.estimated_duration}
                  onChange={(e) => setNewItem({ ...newItem, estimated_duration: e.target.value })}
                  required
                  placeholder="120"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Stock (optional)
                </label>
                <input
                  type="number"
                  value={newItem.stock}
                  onChange={(e) => setNewItem({ ...newItem, stock: e.target.value })}
                  placeholder="10"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Image URL
                </label>
                <input
                  type="text"
                  value={newItem.image}
                  onChange={(e) => setNewItem({ ...newItem, image: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={newItem.active}
                  onChange={(e) => setNewItem({ ...newItem, active: e.target.checked })}
                  className="mr-2 h-4 w-4 text-orange-600 focus:ring-orange-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
              </label>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
              >
                {createMutation.isPending || updateMutation.isPending ? 'Saving...' : isEditing ? 'Update' : 'Add Service'}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Service
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock
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
            {catalog?.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                  No catalog items found. Add your first service!
                </td>
              </tr>
            ) : (
              catalog?.map((item: ServiceCatalogItem) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-12 w-12 rounded object-cover mr-3"
                        />
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        <div className="text-xs text-gray-500">ID: {item.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {item.description || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    R$ {item.price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {item.estimated_duration} min
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {item.stock !== undefined ? item.stock : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() =>
                        toggleActiveMutation.mutate({
                          itemId: item.id,
                          active: !item.active,
                        })
                      }
                      className={`px-3 py-1 rounded-full text-xs font-medium ${item.active
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                    >
                      {item.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => startEdit(item)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this item?')) {
                            deleteMutation.mutate(item.id);
                          }
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!isCreating && (
        <div className="mt-6 flex gap-4">
          <button
            onClick={() => setIsCreating(true)}
            className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            + Add Service Item
          </button>
          <Link
            to={`/service-providers/${providerId}/orders`}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            View Orders
          </Link>
        </div>
      )}
    </div>
  );
}
