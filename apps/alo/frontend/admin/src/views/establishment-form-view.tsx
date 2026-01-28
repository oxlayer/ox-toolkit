import { useNavigate, useParams } from 'react-router-dom'
import { useEstablishment, useEstablishmentTypes, useCreateEstablishment, useUpdateEstablishment } from '@/hooks'
import { PageHeader } from '@/components/shared'
import { ButtonTech, CardTech, InputTech, TextareaTech, Select, SelectTrigger, SelectValue, SelectPopup, SelectItem, FieldTech, FieldTechLabel, FieldTechControl } from '@acme/ui'
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

      <CardTech className="p-6" >
        <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
          {/* Establishment Type */}
          <FieldTech>
            <FieldTechLabel htmlFor="establishment_type_id">Establishment Type</FieldTechLabel>
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
          </FieldTech>

          {/* Name */}
          <FieldTech>
            <FieldTechLabel htmlFor="name" required>Name</FieldTechLabel>
            <FieldTechControl
              id="name"
              name="name"
              required
              placeholder="Establishment name"
            />
          </FieldTech>

          {/* Description */}
          <FieldTech>
            <FieldTechLabel htmlFor="description">Description</FieldTechLabel>
            <TextareaTech
              id="description"
              name="description"
              placeholder="Brief description of the establishment"
            />
          </FieldTech>

          {/* Operating Hours */}
          <FieldTech>
            <FieldTechLabel htmlFor="horario_funcionamento">Operating Hours</FieldTechLabel>
            <FieldTechControl
              id="horario_funcionamento"
              name="horario_funcionamento"
              placeholder="e.g., Mon-Fri 9AM-10PM"
            />
          </FieldTech>

          {/* Owner ID */}
          <FieldTech>
            <FieldTechLabel htmlFor="owner_id" required>Owner ID</FieldTechLabel>
            <FieldTechControl
              id="owner_id"
              name="owner_id"
              type="number"
              required
              placeholder="Owner user ID"
            />
          </FieldTech>

          {/* Colors */}
          <div className="grid grid-cols-2 gap-4">
            <FieldTech>
              <FieldTechLabel htmlFor="primary_color">Primary Color</FieldTechLabel>
              <FieldTechControl
                id="primary_color"
                name="primary_color"
                type="color"
              />
            </FieldTech>
            <FieldTech>
              <FieldTechLabel htmlFor="secondary_color">Secondary Color</FieldTechLabel>
              <FieldTechControl
                id="secondary_color"
                name="secondary_color"
                type="color"
              />
            </FieldTech>
          </div>

          {/* Image URL */}
          <FieldTech>
            <FieldTechLabel htmlFor="image">Image URL</FieldTechLabel>
            <FieldTechControl
              id="image"
              name="image"
              type="url"
              placeholder="https://example.com/image.jpg"
            />
          </FieldTech>

          {/* Location */}
          <FieldTech>
            <FieldTechLabel htmlFor="location_string">Location</FieldTechLabel>
            <FieldTechControl
              id="location_string"
              name="location_string"
              placeholder="Address or location description"
            />
          </FieldTech>

          {/* Coordinates */}
          <div className="grid grid-cols-2 gap-4">
            <FieldTech>
              <FieldTechLabel htmlFor="lat">Latitude</FieldTechLabel>
              <FieldTechControl
                id="lat"
                name="lat"
                type="number"
                step="any"
              />
            </FieldTech>
            <FieldTech>
              <FieldTechLabel htmlFor="long">Longitude</FieldTechLabel>
              <FieldTechControl
                id="long"
                name="long"
                type="number"
                step="any"
              />
            </FieldTech>
          </div>

          {/* Max Delivery Distance */}
          <FieldTech>
            <FieldTechLabel htmlFor="max_distance_delivery">Max Delivery Distance (km)</FieldTechLabel>
            <FieldTechControl
              id="max_distance_delivery"
              name="max_distance_delivery"
              type="number"
              step="any"
            />
          </FieldTech>

          {/* Actions */}
          <div className="flex gap-4">
            <ButtonTech type="submit" variant="solid" size="default" disabled={isLoading}>
              {isLoading ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </ButtonTech>
            <ButtonTech
              type="button"
              variant="outline"
              size="default"
              onClick={() => navigate('/establishments')}
              disabled={isLoading}
            >
              Cancel
            </ButtonTech>
          </div>
        </form>
      </CardTech>
    </div>
  )
}
