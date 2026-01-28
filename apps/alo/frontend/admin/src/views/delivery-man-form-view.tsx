import { useNavigate, useParams } from 'react-router-dom'
import { useDeliveryMan, useCreateDeliveryMan, useUpdateDeliveryMan } from '@/hooks'
import { PageHeader } from '@/components/shared'
import { ButtonTech as TechButton, CardTech, InputTech, FieldTech, LabelTech } from '@acme/ui'
import { useState, useEffect } from 'react'
import type { CreateDeliveryManInput } from '@/types'

const defaultFormData: CreateDeliveryManInput = {
  name: '',
  email: '',
  password: '',
  phone: '',
}

/**
 * Delivery Man form view - Create or edit delivery man
 */
export function DeliveryManFormView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = !!id

  const { data: deliveryMan, isLoading: isLoadingDeliveryMan } = useDeliveryMan(Number(id))
  const createMutation = useCreateDeliveryMan()
  const updateMutation = useUpdateDeliveryMan()

  const [formData, setFormData] = useState<CreateDeliveryManInput>(defaultFormData)

  // Update form when delivery man data loads
  useEffect(() => {
    if (deliveryMan && isEditing) {
      setFormData({
        name: deliveryMan.name,
        email: deliveryMan.email,
        password: '',
        phone: deliveryMan.phone,
      })
    }
  }, [deliveryMan, isEditing])

  if (isEditing && isLoadingDeliveryMan) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="inline-block size-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
      </div>
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Don't send password if editing and empty
    const submitData: CreateDeliveryManInput = {
      name: formData.name,
      email: formData.email,
      password: isEditing && !formData.password ? '' : formData.password,
      phone: formData.phone,
    }

    if (isEditing && id) {
      updateMutation.mutate({ id: Number(id), input: submitData })
    } else {
      createMutation.mutate(submitData)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEditing ? 'Edit Delivery Man' : 'New Delivery Man'}
        description={isEditing ? 'Update delivery man information' : 'Add a new delivery man to the platform'}
      />

      <CardTech className="p-6">
        <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
          {/* Name */}
          <FieldTech>
            <LabelTech htmlFor="name" required>Name</LabelTech>
            <InputTech
              id="name"
              name="name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              required
              placeholder="Delivery man's full name"
            />
          </FieldTech>

          {/* Email */}
          <FieldTech>
            <LabelTech htmlFor="email" required>Email</LabelTech>
            <InputTech
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              required
              placeholder="delivery@example.com"
            />
          </FieldTech>

          {/* Password */}
          <FieldTech>
            <LabelTech htmlFor="password">Password {!isEditing && '(required)'}</LabelTech>
            <InputTech
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
              required={!isEditing}
              minLength={6}
              placeholder={isEditing ? 'Leave empty to keep current password' : 'Enter password'}
            />
          </FieldTech>

          {/* Phone */}
          <FieldTech>
            <LabelTech htmlFor="phone" required>Phone</LabelTech>
            <InputTech
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
              required
              placeholder="+55 11 99999-9999"
            />
          </FieldTech>

          {/* Actions */}
          <div className="flex gap-4">
            <TechButton type="submit" variant="solid" size="default" disabled={isLoading}>
              {isLoading ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </TechButton>
            <TechButton
              type="button"
              variant="outline"
              size="default"
              onClick={() => navigate('/delivery-men')}
              disabled={isLoading}
            >
              Cancel
            </TechButton>
          </div>
        </form>
      </CardTech>
    </div>
  )
}
