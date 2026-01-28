import { Link } from 'react-router-dom'
import { PageHeader, DataTable } from '@/components/shared'
import { useDeliveryMen, useDeleteDeliveryMan } from '@/hooks'
import { ButtonTech as TechButton } from '@acme/ui'
import { Pencil, Trash2, Phone } from 'lucide-react'
import type { DeliveryMan } from '@/types'

/**
 * Delivery Men list view
 */
export function DeliveryMenView() {
  const { data: deliveryMen, isLoading } = useDeliveryMen()
  const deleteMutation = useDeleteDeliveryMan()

  const handleDelete = (id: number, name: string) => {
    if (confirm(`Are you sure you want to delete delivery man "${name}"?`)) {
      deleteMutation.mutate(id)
    }
  }

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email', className: 'text-gray-600 dark:text-gray-400' },
    { key: 'phone', label: 'Phone', className: 'text-gray-600 dark:text-gray-400' },
    { key: 'actions', label: 'Actions', className: 'text-right' },
  ]

  const actions = (
    <Link to="/delivery-men/new">
      <TechButton variant="solid" size="default">
        Add Delivery Man
      </TechButton>
    </Link>
  )

  return (
    <div className="space-y-6">
      <PageHeader title="Delivery Men" description="Manage delivery personnel" actions={actions} />

      <DataTable
        columns={columns}
        data={deliveryMen ?? []}
        isLoading={isLoading}
        rowKey="id"
        emptyMessage="No delivery men found. Add your first delivery man!"
        renderCell={(columnKey, row) => {
          const deliveryMan = row as DeliveryMan

          switch (columnKey) {
            case 'name':
              return (
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{deliveryMan.name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">ID: {deliveryMan.id}</div>
                </div>
              )

            case 'email':
              return deliveryMan.email

            case 'phone':
              return (
                <div className="flex items-center gap-2">
                  <Phone className="size-3" />
                  {deliveryMan.phone}
                </div>
              )

            case 'actions':
              return (
                <div className="flex justify-end gap-4">
                  <Link
                    to={`/delivery-men/${deliveryMan.id}`}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    <Pencil className="inline size-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(deliveryMan.id, deliveryMan.name)}
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
