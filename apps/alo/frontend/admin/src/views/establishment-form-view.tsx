import { useNavigate, useParams } from 'react-router-dom'
import { useEstablishment, useEstablishmentTypes, useCreateEstablishment, useUpdateEstablishment } from '@/hooks'
import { PageHeader } from '@/components/shared'
import { Button, Input, Textarea, Select, SelectTrigger, SelectValue, SelectPopup, SelectItem, Field, Label, Card } from '@acme/ui'
import { useState, useEffect } from 'react'
import type { CreateEstablishmentInput } from '@/types'

const defaultFormData: Omit<CreateEstablishmentInput, 'owner_id'> = {
  name: '',
  horario_funcionamento: '',
  description: '',
  image: '',
  primary_color: '#000000',
  secondary_color: '#000000',
  lat: 0,
  long: 0,
  location_string: '',
  max_distance_delivery: 0,
  establishment_type_id: undefined,
}

/**
 * Establishment form view - Create or edit establishment
 */
export function EstablishmentFormView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = !!id

  const { data: establishment, isLoading: isLoadingEstablishment } = useEstablishment(Number(id))
  const { data: establishmentTypes = [] } = useEstablishmentTypes()
  const createMutation = useCreateEstablishment()
  const updateMutation = useUpdateEstablishment()

  const [formData, setFormData] = useState<Omit<CreateEstablishmentInput, 'owner_id'>>(defaultFormData)
  const [ownerId, setOwnerId] = useState<number>(0)

  // Update form when establishment data loads
  useEffect(() => {
    if (establishment) {
      setFormData({
        name: establishment.name,
        horario_funcionamento: establishment.horario_funcionamento,
        description: establishment.description,
        image: establishment.image,
        primary_color: establishment.primary_color,
        secondary_color: establishment.secondary_color,
        lat: establishment.lat ?? 0,
        long: establishment.long ?? 0,
        location_string: establishment.location_string ?? '',
        max_distance_delivery: establishment.max_distance_delivery ?? 0,
        establishment_type_id: establishment.establishment_type_id,
      })
      setOwnerId(establishment.owner_id)
    }
  }, [establishment])

  if (isEditing && isLoadingEstablishment) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="inline-block size-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
      </div>
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const submitData: CreateEstablishmentInput = {
      ...formData,
      owner_id: ownerId,
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
        title={isEditing ? 'Edit Establishment' : 'New Establishment'}
        description={isEditing ? 'Update establishment information' : 'Add a new establishment to the platform'}
      />

      <Card className="border-border bg-surface p-6">
        <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
          {/* Establishment Type */}
          <Field>
            <Label htmlFor="establishment_type_id">Establishment Type</Label>
            <Select
              name="establishment_type_id"
              value={formData.establishment_type_id?.toString() ?? ''}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, establishment_type_id: value ? Number(value) : undefined }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a type..." />
              </SelectTrigger>
              <SelectPopup>
                <SelectItem value="">Select a type...</SelectItem>
                {establishmentTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id.toString()}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectPopup>
            </Select>
          </Field>

          {/* Name */}
          <Field>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              required
              placeholder="Establishment name"
            />
          </Field>

          {/* Description */}
          <Field>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              rows={3}
              placeholder="Brief description of the establishment"
            />
          </Field>

          {/* Operating Hours */}
          <Field>
            <Label htmlFor="horario_funcionamento">Operating Hours</Label>
            <Input
              id="horario_funcionamento"
              name="horario_funcionamento"
              value={formData.horario_funcionamento}
              onChange={(e) => setFormData((prev) => ({ ...prev, horario_funcionamento: e.target.value }))}
              placeholder="e.g., Mon-Fri 9AM-10PM"
            />
          </Field>

          {/* Owner ID */}
          <Field>
            <Label htmlFor="owner_id">Owner ID</Label>
            <Input
              id="owner_id"
              name="owner_id"
              type="number"
              value={ownerId}
              onChange={(e) => setOwnerId(Number(e.target.value))}
              required
              placeholder="Owner user ID"
            />
          </Field>

          {/* Colors */}
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <Label htmlFor="primary_color">Primary Color</Label>
              <Input
                id="primary_color"
                name="primary_color"
                type="color"
                value={formData.primary_color}
                onChange={(e) => setFormData((prev) => ({ ...prev, primary_color: e.target.value }))}
                className="h-10 w-full cursor-pointer"
              />
            </Field>
            <Field>
              <Label htmlFor="secondary_color">Secondary Color</Label>
              <Input
                id="secondary_color"
                name="secondary_color"
                type="color"
                value={formData.secondary_color}
                onChange={(e) => setFormData((prev) => ({ ...prev, secondary_color: e.target.value }))}
                className="h-10 w-full cursor-pointer"
              />
            </Field>
          </div>

          {/* Image URL */}
          <Field>
            <Label htmlFor="image">Image URL</Label>
            <Input
              id="image"
              name="image"
              type="url"
              value={formData.image}
              onChange={(e) => setFormData((prev) => ({ ...prev, image: e.target.value }))}
              placeholder="https://example.com/image.jpg"
            />
          </Field>

          {/* Location */}
          <Field>
            <Label htmlFor="location_string">Location</Label>
            <Input
              id="location_string"
              name="location_string"
              value={formData.location_string}
              onChange={(e) => setFormData((prev) => ({ ...prev, location_string: e.target.value }))}
              placeholder="Address or location description"
            />
          </Field>

          {/* Coordinates */}
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <Label htmlFor="lat">Latitude</Label>
              <Input
                id="lat"
                name="lat"
                type="number"
                step="any"
                value={formData.lat}
                onChange={(e) => setFormData((prev) => ({ ...prev, lat: Number(e.target.value) }))}
              />
            </Field>
            <Field>
              <Label htmlFor="long">Longitude</Label>
              <Input
                id="long"
                name="long"
                type="number"
                step="any"
                value={formData.long}
                onChange={(e) => setFormData((prev) => ({ ...prev, long: Number(e.target.value) }))}
              />
            </Field>
          </div>

          {/* Max Delivery Distance */}
          <Field>
            <Label htmlFor="max_distance_delivery">Max Delivery Distance (km)</Label>
            <Input
              id="max_distance_delivery"
              name="max_distance_delivery"
              type="number"
              step="any"
              value={formData.max_distance_delivery}
              onChange={(e) => setFormData((prev) => ({ ...prev, max_distance_delivery: Number(e.target.value) }))}
            />
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
              onClick={() => navigate('/establishments')}
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
