import { useNavigate, useParams, Link } from 'react-router-dom'
import { useState } from 'react'
import { useServiceProvider, useServiceCatalog, useCreateCatalogItem, useUpdateCatalogItem, useDeleteCatalogItem, useToggleCatalogItemActive } from '@/hooks'
import { ButtonTech as TechButton, CardTech, FieldTech, InputTech, LabelTech, TextareaTech } from '@acme/ui'
import { Pencil, Trash2 } from 'lucide-react'
import type { ServiceCatalogItem, CreateCatalogItemInput } from '@/types'

/**
 * Service catalog management for a specific provider
 */
export function ServiceCatalogView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const providerId = Number(id)

  const { data: provider } = useServiceProvider(providerId)
  const { data: catalog, isLoading } = useServiceCatalog(providerId)
  const createMutation = useCreateCatalogItem()
  const updateMutation = useUpdateCatalogItem()
  const deleteMutation = useDeleteCatalogItem()
  const toggleMutation = useToggleCatalogItemActive()

  const [isCreating, setIsCreating] = useState(false)
  const [isEditing, setIsEditing] = useState<ServiceCatalogItem | null>(null)
  const [newItem, setNewItem] = useState<CreateCatalogItemInput>({
    provider_id: providerId,
    name: '',
    description: '',
    price: 0,
    estimated_duration: 0,
    active: true,
    image: '',
    stock: undefined,
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate(newItem, {
      onSuccess: () => {
        setNewItem({
          provider_id: providerId,
          name: '',
          description: '',
          price: 0,
          estimated_duration: 0,
          active: true,
          image: '',
          stock: undefined,
        })
        setIsCreating(false)
      },
    })
  }

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isEditing) {
      updateMutation.mutate(
        { id: isEditing.id, input: newItem },
        {
          onSuccess: () => {
            setIsEditing(null)
            setIsCreating(false)
          },
        }
      )
    }
  }

  const startEdit = (item: ServiceCatalogItem) => {
    setIsEditing(item)
    setNewItem({
      provider_id: providerId,
      name: item.name,
      description: item.description,
      price: item.price,
      estimated_duration: item.estimated_duration,
      active: item.active,
      image: item.image || '',
      stock: item.stock,
    })
    setIsCreating(true)
  }

  const cancelEdit = () => {
    setIsEditing(null)
    setNewItem({
      provider_id: providerId,
      name: '',
      description: '',
      price: 0,
      estimated_duration: 0,
      active: true,
      image: '',
      stock: undefined,
    })
    setIsCreating(false)
  }

  const handleDelete = (id: number, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteMutation.mutate(id)
    }
  }

  const handleToggleActive = (id: number, active: boolean) => {
    toggleMutation.mutate({ id, active: !active })
  }

  if (isLoading) {
    return <div className="py-12 text-center">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Service Catalog</h1>
          <p className="mt-1 text-gray-500">
            {provider?.name} - Manage their service offerings
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

      {(isCreating || isEditing) && (
        <CardTech className="p-6">
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            {isEditing ? 'Edit Service Item' : 'Add Service Item'}
          </h2>
          <form onSubmit={isEditing ? handleEdit : handleCreate} className="max-w-2xl space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FieldTech>
                <LabelTech htmlFor="name" required>Service Name</LabelTech>
                <InputTech
                  type="text"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  required
                  placeholder="e.g., Faxina casa 200m²"
                />
              </FieldTech>
              <FieldTech>
                <LabelTech htmlFor="price" required>Price (R$)</LabelTech>
                <InputTech
                  type="number"
                  step="0.01"
                  value={newItem.price}
                  onChange={(e) => setNewItem({ ...newItem, price: Number(e.target.value) })}
                  required
                  placeholder="150.00"
                />
              </FieldTech>
            </div>

            <FieldTech>
              <LabelTech htmlFor="description">Description</LabelTech>
              <TextareaTech
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                placeholder="Details about the service"
              />
            </FieldTech>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <FieldTech>
                <LabelTech htmlFor="estimated_duration" required>Duration (min)</LabelTech>
                <InputTech
                  type="number"
                  value={newItem.estimated_duration}
                  onChange={(e) => setNewItem({ ...newItem, estimated_duration: Number(e.target.value) })}
                  required
                  placeholder="120"
                />
              </FieldTech>
              <FieldTech>
                <LabelTech htmlFor="stock">Stock (optional)</LabelTech>
                <InputTech
                  type="number"
                  value={newItem.stock ?? ''}
                  onChange={(e) => setNewItem({ ...newItem, stock: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="10"
                />
              </FieldTech>
              <FieldTech>
                <LabelTech htmlFor="image">Image URL</LabelTech>
                <InputTech
                  type="text"
                  value={newItem.image}
                  onChange={(e) => setNewItem({ ...newItem, image: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </FieldTech>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={newItem.active}
                onChange={(e) => setNewItem({ ...newItem, active: e.target.checked })}
                className="mr-2 h-4 w-4 text-orange-600 focus:ring-orange-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
            </div>

            <div className="flex gap-4">
              <TechButton
                type="submit"
                variant="solid"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending
                  ? 'Saving...'
                  : isEditing
                    ? 'Update'
                    : 'Add Service'}
              </TechButton>
              <TechButton type="button" variant="outline" onClick={cancelEdit}>
                Cancel
              </TechButton>
            </div>
          </form>
        </CardTech>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
        <table className="w-full">
          <thead className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Service
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Stock
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {catalog?.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  No catalog items found. Add your first service!
                </td>
              </tr>
            ) : (
              catalog?.map((item: ServiceCatalogItem) => (
                <tr key={item.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="mr-3 h-12 w-12 rounded object-cover"
                        />
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">ID: {item.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {item.description || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                    R$ {item.price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {item.estimated_duration} min
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {item.stock !== undefined ? item.stock : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleActive(item.id, item.active)}
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        item.active
                          ? 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400'
                      }`}
                      disabled={toggleMutation.isPending}
                    >
                      {item.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => startEdit(item)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400"
                      >
                        <Pencil className="inline size-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, item.name)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400"
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="inline size-4" />
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
          <TechButton
            variant="solid"
            size="default"
            onClick={() => setIsCreating(true)}
          >
            + Add Service Item
          </TechButton>
          <Link
            to={`/service-providers/${providerId}/orders`}
            className="inline-block"
          >
            <TechButton variant="outline" size="default">
              View Orders
            </TechButton>
          </Link>
        </div>
      )}
    </div>
  )
}
