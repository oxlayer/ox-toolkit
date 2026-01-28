import { useNavigate, useParams } from 'react-router-dom'
import { useUser, useEstablishments, useCreateUser, useUpdateUser } from '@/hooks'
import { PageHeader } from '@/components/shared'
import { Button, Input, Select, SelectTrigger, SelectValue, SelectPopup, SelectItem, Field, Label, Card } from '@acme/ui'
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

      <Card className="border-border bg-surface p-6">
        <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
          {/* Name */}
          <Field>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              required
              placeholder="User's full name"
            />
          </Field>

          {/* Email */}
          <Field>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              required
              placeholder="user@example.com"
            />
          </Field>

          {/* Password */}
          <Field>
            <Label htmlFor="password">Password {!isEditing && '(required)'}</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
              required={!isEditing}
              minLength={6}
              placeholder={isEditing ? 'Leave empty to keep current password' : 'Enter password'}
            />
          </Field>

          {/* Establishment */}
          <Field>
            <Label htmlFor="establishment_id">Establishment</Label>
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
            <p className="mt-1 text-sm text-muted-foreground">Assign user to a specific establishment (optional)</p>
          </Field>

          {/* Actions */}
          <div className="flex gap-4">
            <Button type="submit" variant="primary" size="md" disabled={isLoading}>
              {isLoading ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={() => navigate('/users')}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
