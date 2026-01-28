import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useServiceCategories, useCreateServiceCategory, useDeleteServiceCategory } from '@/hooks'
import { ButtonTech as TechButton, CardTech, FieldTech, InputTech, LabelTech } from '@acme/ui'
import type { ServiceProviderCategory, CreateServiceCategoryInput } from '@/types'

/**
 * Service categories management view
 */
export function ServiceCategoriesView() {
  const navigate = useNavigate()
  const { data: categories, isLoading } = useServiceCategories()
  const createMutation = useCreateServiceCategory()
  const deleteMutation = useDeleteServiceCategory()

  const [isCreating, setIsCreating] = useState(false)
  const [newCategory, setNewCategory] = useState<CreateServiceCategoryInput>({
    name: '',
    description: '',
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate(newCategory, {
      onSuccess: () => {
        setNewCategory({ name: '', description: '' })
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Service Categories</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Manage provider categories like Diarista, Eletricista, etc.
          </p>
        </div>

        <div className="flex gap-3">
          {!isCreating && (
            <TechButton
              variant="solid"
              size="default"
              onClick={() => setIsCreating(true)}
            >
              + Add New Category
            </TechButton>
          )}

          <TechButton
            variant="outline"
            size="default"
            onClick={() => navigate('/service-providers')}
          >
            Back to Providers
          </TechButton>
        </div>
      </div>

      {isCreating && (
        <CardTech className="p-6">
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">New Category</h2>
          <form onSubmit={handleCreate} className="max-w-md space-y-4">
            <FieldTech>
              <LabelTech htmlFor="name" required>Name</LabelTech>
              <InputTech
                type="text"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                required
                placeholder="e.g., Diarista, Eletricista, Marceneiro"
              />
            </FieldTech>
            <FieldTech>
              <LabelTech htmlFor="description">Description</LabelTech>
              <InputTech
                type="text"
                value={newCategory.description}
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                placeholder="Brief description of the category"
              />
            </FieldTech>
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
                  setNewCategory({ name: '', description: '' })
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
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {isLoading ? (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  Loading...
                </td>
              </tr>
            ) : categories?.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  No categories found. Create your first one!
                </td>
              </tr>
            ) : (
              categories?.map((category: ServiceProviderCategory) => (
                <tr
                  key={category.id}
                  className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-amber-600 font-semibold text-white">
                        {category.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {category.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {category.description || '-'}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <button
                      onClick={() => handleDelete(category.id, category.name)}
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
