import { Link } from 'react-router-dom'
import { PageHeader, DataTable } from '@/components/shared'
import { useServiceProviders, useServiceCategories, useDeleteServiceProvider, useToggleServiceProviderAvailability } from '@/hooks'
import { ButtonTech as TechButton } from '@acme/ui'
import { Pencil, Trash2, Package, FileText } from 'lucide-react'
import type { ServiceProvider } from '@/types'

/**
 * Service providers list view
 */
export function ServiceProvidersView() {
  const { data: providers, isLoading } = useServiceProviders()
  const { data: categories } = useServiceCategories()
  const deleteMutation = useDeleteServiceProvider()
  const toggleMutation = useToggleServiceProviderAvailability()

  const handleDelete = (id: number, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteMutation.mutate(id)
    }
  }

  const handleToggleAvailability = (id: number, available: boolean) => {
    toggleMutation.mutate({ id, available: !available })
  }

  const getCategoryName = (categoryId: number) => {
    return categories?.find((c) => c.id === categoryId)?.name || 'N/A'
  }

  const columns = [
    { key: 'provider', label: 'Provider' },
    { key: 'category', label: 'Category', className: 'text-gray-600 dark:text-gray-400' },
    { key: 'contact', label: 'Contact', className: 'text-gray-600 dark:text-gray-400' },
    { key: 'location', label: 'Location', className: 'text-gray-600 dark:text-gray-400' },
    { key: 'status', label: 'Status' },
    { key: 'actions', label: 'Actions', className: 'text-right' },
  ]

  const actions = (
    <>
      <Link to="/service-providers/categories">
        <TechButton variant="outline" size="default">
          Manage Categories
        </TechButton>
      </Link>
      <Link to="/service-providers/new">
        <TechButton variant="solid" size="default">
          Add Provider
        </TechButton>
      </Link>
    </>
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Service Providers"
        description="Manage local service providers"
        actions={actions}
      />

      <DataTable
        columns={columns}
        data={providers ?? []}
        isLoading={isLoading}
        rowKey="id"
        emptyMessage="No service providers found. Add your first one!"
        renderCell={(columnKey, row) => {
          const provider = row as ServiceProvider

          switch (columnKey) {
            case 'provider':
              return (
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-amber-600 text-lg font-semibold text-white shadow-lg">
                    {provider.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {provider.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">ID: {provider.id}</div>
                  </div>
                </div>
              )

            case 'category':
              return getCategoryName(provider.category_id)

            case 'contact':
              return (
                <div>
                  <div className="text-sm text-gray-900 dark:text-white">{provider.phone}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{provider.email}</div>
                </div>
              )

            case 'location':
              return (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {provider.city}, {provider.state}
                </span>
              )

            case 'status':
              return (
                <button
                  onClick={() => handleToggleAvailability(provider.id, provider.available)}
                  className="cursor-pointer"
                  disabled={toggleMutation.isPending}
                >
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      provider.available
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200'
                    }`}
                  >
                    {provider.available ? 'Available' : 'Unavailable'}
                  </span>
                </button>
              )

            case 'actions':
              return (
                <div className="flex justify-end gap-2">
                  <Link to={`/service-providers/${provider.id}/catalog`}>
                    <Package className="inline size-4 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300" />
                  </Link>
                  <Link to={`/service-providers/${provider.id}/orders`}>
                    <FileText className="inline size-4 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300" />
                  </Link>
                  <Link to={`/service-providers/${provider.id}`}>
                    <Pencil className="inline size-4 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300" />
                  </Link>
                  <button
                    onClick={() => handleDelete(provider.id, provider.name)}
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="inline size-4" />
                  </button>
                </div>
              )

            default:
              return null
          }
        }}
      />
    </div>
  )
}
