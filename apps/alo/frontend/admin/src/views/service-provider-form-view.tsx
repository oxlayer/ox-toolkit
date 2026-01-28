import { useNavigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useServiceProvider, useServiceCategories, useCreateServiceProvider, useUpdateServiceProvider } from '@/hooks'
import { ButtonTech as TechButton, CardTech, FieldTech, InputTech, LabelTech } from '@acme/ui'
import { Select, SelectTrigger, SelectValue, SelectPopup, SelectItem } from '@acme/ui'
import type { CreateServiceProviderInput, ServiceProviderCategory } from '@/types'

/**
 * Service provider form view (create/edit)
 */
export function ServiceProviderFormView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = !!id

  const { data: provider, isLoading: isLoadingProvider } = useServiceProvider(Number(id))
  const { data: categories } = useServiceCategories()

  const createMutation = useCreateServiceProvider()
  const updateMutation = useUpdateServiceProvider()

  const [formData, setFormData] = useState<CreateServiceProviderInput>({
    name: '',
    email: '',
    password: '',
    phone: '',
    category_id: 0,
    document: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    available: true,
  })

  // Update form data when provider is loaded
  useEffect(() => {
    if (provider) {
      setFormData({
        name: provider.name,
        email: provider.email,
        password: '',
        phone: provider.phone,
        category_id: provider.category_id,
        document: provider.document,
        address: provider.address,
        city: provider.city,
        state: provider.state,
        zip_code: provider.zip_code,
        available: provider.available ?? true,
      })
    }
  }, [provider])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (isEditing) {
      updateMutation.mutate({ id: Number(id), input: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const isLoading = isLoadingProvider || (isEditing && !provider)

  if (isLoading) {
    return <div className="py-12 text-center text-gray-900 dark:text-white">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        {isEditing ? 'Edit Service Provider' : 'New Service Provider'}
      </h1>

      <CardTech className="p-6">
        <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
          <FieldTech>
            <LabelTech htmlFor="name" required>Name</LabelTech>
            <InputTech
              name="name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
          </FieldTech>

          <FieldTech>
            <LabelTech htmlFor="email" required>Email</LabelTech>
            <InputTech
              type="email"
              name="email"
              value={formData.email}
              onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              required
            />
          </FieldTech>

          <FieldTech>
            <LabelTech htmlFor="password">Password {!isEditing && '*'}</LabelTech>
            <InputTech
              type="password"
              name="password"
              value={formData.password}
              onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
              required={!isEditing}
              minLength={6}
              placeholder={isEditing ? 'Leave empty to keep current password' : ''}
            />
          </FieldTech>

          <FieldTech>
            <LabelTech htmlFor="phone" required>Phone</LabelTech>
            <InputTech
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
              required
              placeholder="+55 11 98765-4321"
            />
          </FieldTech>

          <FieldTech>
            <LabelTech htmlFor="category_id" required>Category</LabelTech>
            <Select
              name="category_id"
              value={formData.category_id?.toString() || ''}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, category_id: Number(value) }))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectPopup>
                {categories?.map((category: ServiceProviderCategory) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectPopup>
            </Select>
          </FieldTech>

          <FieldTech>
            <LabelTech htmlFor="document" required>Document (CPF/CNPJ)</LabelTech>
            <InputTech
              name="document"
              value={formData.document}
              onChange={(e) => setFormData((prev) => ({ ...prev, document: e.target.value }))}
              required
              placeholder="000.000.000-00"
            />
          </FieldTech>

          <FieldTech>
            <LabelTech htmlFor="address" required>Address</LabelTech>
            <InputTech
              name="address"
              value={formData.address}
              onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
              required
            />
          </FieldTech>

          <div className="grid grid-cols-2 gap-4">
            <FieldTech>
              <LabelTech htmlFor="city" required>City</LabelTech>
              <InputTech
                name="city"
                value={formData.city}
                onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                required
              />
            </FieldTech>
            <FieldTech>
              <LabelTech htmlFor="state" required>State</LabelTech>
              <InputTech
                name="state"
                value={formData.state}
                onChange={(e) => setFormData((prev) => ({ ...prev, state: e.target.value }))}
                required
                maxLength={2}
                placeholder="SP"
              />
            </FieldTech>
          </div>

          <FieldTech>
            <LabelTech htmlFor="zip_code" required>Zip Code</LabelTech>
            <InputTech
              name="zip_code"
              value={formData.zip_code}
              onChange={(e) => setFormData((prev) => ({ ...prev, zip_code: e.target.value }))}
              required
              placeholder="00000-000"
            />
          </FieldTech>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="available"
              id="available"
              checked={formData.available}
              onChange={(e) => setFormData((prev) => ({ ...prev, available: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600"
            />
            <label htmlFor="available" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              Available for new orders
            </label>
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
                  : 'Create'}
            </TechButton>
            <TechButton
              type="button"
              variant="outline"
              onClick={() => navigate('/service-providers')}
            >
              Cancel
            </TechButton>
          </div>
        </form>
      </CardTech>
    </div>
  )
}
