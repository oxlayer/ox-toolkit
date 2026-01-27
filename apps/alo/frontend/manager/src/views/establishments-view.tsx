import { Link } from 'react-router-dom'
import { PageHeader, DataTable } from '@/components/shared'
import { useEstablishments, useDeleteEstablishment } from '@/hooks'
import { Button } from '@acme/ui'
import { Pencil, Trash2 } from 'lucide-react'
import type { Establishment } from '@/types'

/**
 * Establishments list view
 */
export function EstablishmentsView() {
  const { data: establishments, isLoading } = useEstablishments()
  const deleteMutation = useDeleteEstablishment()

  const handleDelete = (id: number, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteMutation.mutate(id)
    }
  }

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'location', label: 'Location', className: 'text-gray-600 dark:text-gray-400' },
    { key: 'hours', label: 'Hours', className: 'text-gray-600 dark:text-gray-400' },
    { key: 'actions', label: 'Actions', className: 'text-right' },
  ]

  const actions = (
    <>
      <Link to="/establishments/types">
        <Button variant="outline" size="md">
          Manage Types
        </Button>
      </Link>
      <Link to="/establishments/new">
        <Button variant="primary" size="md">
          Add Establishment
        </Button>
      </Link>
    </>
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Establishments"
        description="Manage partner establishments"
        actions={actions}
      />

      <DataTable
        columns={columns}
        data={establishments ?? []}
        isLoading={isLoading}
        rowKey="id"
        emptyMessage="No establishments found. Create your first one!"
        renderCell={(columnKey, row) => {
          const establishment = row as Establishment

          switch (columnKey) {
            case 'name':
              return (
                <div className="flex items-center">
                  {establishment.image && (
                    <img
                      src={establishment.image}
                      alt={establishment.name}
                      className="mr-3 h-10 w-10 rounded-lg object-cover"
                    />
                  )}
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {establishment.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">ID: {establishment.id}</div>
                  </div>
                </div>
              )

            case 'location':
              return establishment.location_string ?? '-'

            case 'hours':
              return establishment.horario_funcionamento ?? '-'

            case 'actions':
              return (
                <div className="flex justify-end gap-4">
                  <Link
                    to={`/establishments/${establishment.id}`}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    <Pencil className="inline size-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(establishment.id, establishment.name)}
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
