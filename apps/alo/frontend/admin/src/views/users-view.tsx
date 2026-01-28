import { Link } from 'react-router-dom'
import { PageHeader, DataTable } from '@/components/shared'
import { useUsers, useDeleteUser } from '@/hooks'
import { TechButton } from '@acme/ui'
import { Pencil, Trash2 } from 'lucide-react'
import type { User } from '@/types'

/**
 * Users list view
 */
export function UsersView() {
  const { data: users, isLoading } = useUsers()
  const deleteMutation = useDeleteUser()

  const handleDelete = (id: number, name: string) => {
    if (confirm(`Are you sure you want to delete user "${name}"?`)) {
      deleteMutation.mutate(id)
    }
  }

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email', className: 'text-gray-600 dark:text-gray-400' },
    { key: 'actions', label: 'Actions', className: 'text-right' },
  ]

  const actions = (
    <Link to="/users/new">
      <TechButton variant="solid" size="lg">
        Add User
      </TechButton>
    </Link>
  )

  return (
    <div className="space-y-6">
      <PageHeader title="Users" description="Manage system users" actions={actions} />

      <DataTable
        columns={columns}
        data={users ?? []}
        isLoading={isLoading}
        rowKey="id"
        emptyMessage="No users found. Create your first user!"
        renderCell={(columnKey, row) => {
          const user = row as User

          switch (columnKey) {
            case 'name':
              return (
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">ID: {user.id}</div>
                </div>
              )

            case 'email':
              return user.email

            case 'actions':
              return (
                <div className="flex justify-end gap-4">
                  <Link
                    to={`/users/${user.id}`}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    <Pencil className="inline size-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(user.id, user.name)}
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
