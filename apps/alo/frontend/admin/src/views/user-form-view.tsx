import { useNavigate, useParams } from 'react-router-dom'
import { useUser, useEstablishments, useCreateUser, useUpdateUser } from '@/hooks'
import { PageHeader } from '@/components/shared'
import { ButtonTech as TechButton, CardTech, InputTech, Select, SelectTrigger, SelectValue, SelectPopup, SelectItem, FieldTech, LabelTech } from '@acme/ui'
import { useState, useEffect } from 'react'
import type { CreateUserInput } from '@/types'

const defaultFormData: CreateUserInput = {
  name: '',
  email: '',
  password: '',
  establishment_id: undefined,
}

/**
 * User form view - Create or edit user
 */
export function UserFormView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = !!id

  const { data: user, isLoading: isLoadingUser } = useUser(Number(id))
  const { data: establishments = [] } = useEstablishments()
  const createMutation = useCreateUser()
  const updateMutation = useUpdateUser()

  const [formData, setFormData] = useState<CreateUserInput>(defaultFormData)

  // Update form when user data loads
  useEffect(() => {
    if (user && isEditing) {
      setFormData({
        name: user.name,
        email: user.email,
        password: '',
        establishment_id: user.establishment_id,
      })
    }
  }, [user, isEditing])

  if (isEditing && isLoadingUser) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="inline-block size-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
      </div>
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Don't send password if editing and empty
    const submitData: CreateUserInput = {
      name: formData.name,
      email: formData.email,
      password: isEditing && !formData.password ? '' : formData.password,
      establishment_id: formData.establishment_id,
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
        title={isEditing ? 'Edit User' : 'New User'}
        description={isEditing ? 'Update user information' : 'Add a new user to the platform'}
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
              placeholder="User's full name"
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
              placeholder="user@example.com"
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

          {/* Establishment */}
          <FieldTech>
            <LabelTech htmlFor="establishment_id">Establishment</LabelTech>
            <Select
              name="establishment_id"
              value={formData.establishment_id?.toString() ?? ''}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, establishment_id: value ? Number(value) : undefined }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="No establishment" />
              </SelectTrigger>
              <SelectPopup>
                <SelectItem value="">No establishment</SelectItem>
                {establishments.map((est) => (
                  <SelectItem key={est.id} value={est.id.toString()}>
                    {est.name}
                  </SelectItem>
                ))}
              </SelectPopup>
            </Select>
            <p className="mt-1 text-xs text-stone-500">Assign user to a specific establishment (optional)</p>
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
              onClick={() => navigate('/users')}
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
