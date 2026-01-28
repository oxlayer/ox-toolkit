import { useNavigate, Link } from 'react-router-dom'
import { useState } from 'react'
import { useEstablishmentTypes, useCreateEstablishmentType, useDeleteEstablishmentType } from '@/hooks'
import { ButtonTech as TechButton, CardTech, FieldTech, InputTech, LabelTech } from '@acme/ui'
import type { EstablishmentType, CreateEstablishmentTypeInput } from '@/types'

/**
 * Establishment types management view
 */
export function EstablishmentTypesView() {
  const navigate = useNavigate()
  const { data: types, isLoading } = useEstablishmentTypes()
  const createMutation = useCreateEstablishmentType()
  const deleteMutation = useDeleteEstablishmentType()

  const [isCreating, setIsCreating] = useState(false)
  const [newType, setNewType] = useState<CreateEstablishmentTypeInput>({
    name: '',
    description: '',
    requires_delivery: false,
    requires_location: true,
    requires_menu: false,
    requires_hours: true,
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate(newType, {
      onSuccess: () => {
        setNewType({
          name: '',
          description: '',
          requires_delivery: false,
          requires_location: true,
          requires_menu: false,
          requires_hours: true,
        })
        setIsCreating(false)
      },
    })
  }

  const handleDelete = (id: number, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Establishment Types</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Manage establishment types like Restaurant, Pharmacy, Gas Station, etc.
          </p>
        </div>

        <div className="flex gap-3">
          {!isCreating && (
            <TechButton
              variant="solid"
              size="default"
              onClick={() => setIsCreating(true)}
            >
              + Add New Type
            </TechButton>
          )}

          <Link to="/establishments">
            <TechButton variant="outline" size="default">
              Back to Establishments
            </TechButton>
          </Link>
        </div>
      </div>

      {isCreating && (
        <CardTech className="p-6">
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            New Establishment Type
          </h2>
          <form onSubmit={handleCreate} className="max-w-md space-y-4">
            <FieldTech>
              <LabelTech htmlFor="name" required>Name</LabelTech>
              <InputTech
                type="text"
                value={newType.name}
                onChange={(e) => setNewType({ ...newType, name: e.target.value })}
                required
                placeholder="e.g., Restaurante, Farmácia, Posto de Gasolina"
              />
            </FieldTech>
            <FieldTech>
              <LabelTech htmlFor="description">Description</LabelTech>
              <InputTech
                type="text"
                value={newType.description}
                onChange={(e) => setNewType({ ...newType, description: e.target.value })}
                placeholder="Brief description of this establishment type"
              />
            </FieldTech>
            <div className="space-y-3">
              <LabelTech>Required Fields</LabelTech>
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
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Requires Operating Hours
                  </span>
                </label>
              </div>
            </div>
            <div className="flex gap-4">
              <TechButton
                type="submit"
                variant="solid"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? 'Creating...' : 'Create'}
              </TechButton>
              <TechButton
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreating(false)
                  setNewType({
                    name: '',
                    description: '',
                    requires_delivery: false,
                    requires_location: true,
                    requires_menu: false,
                    requires_hours: true,
                  })
                }}
              >
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
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Requirements
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  Loading...
                </td>
              </tr>
            ) : types?.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  No establishment types found. Create your first one!
                </td>
              </tr>
            ) : (
              types?.map((type: EstablishmentType) => (
                <tr
                  key={type.id}
                  className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 font-semibold text-white">
                        {type.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {type.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {type.description || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {type.requires_delivery && (
                        <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          Delivery
                        </span>
                      )}
                      {type.requires_location && (
                        <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                          Location
                        </span>
                      )}
                      {type.requires_menu && (
                        <span className="rounded-full bg-purple-100 px-2 py-1 text-xs text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                          Menu
                        </span>
                      )}
                      {type.requires_hours && (
                        <span className="rounded-full bg-orange-100 px-2 py-1 text-xs text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                          Hours
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <button
                      onClick={() => handleDelete(type.id, type.name)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      disabled={deleteMutation.isPending}
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
  )
}
