/**
 * Services List Page
 */

import { useNavigate } from 'react-router-dom'
import { Plus, Edit, Trash2, Clock } from 'lucide-react'
import { CardTech, ButtonTech } from '@acme/ui'
import { PageHeader } from '@/components/page-header'
import { mockServices } from '@/mocks'
import type { Service } from '@/types'

export default function ServicesListPage() {
  const navigate = useNavigate()
  const services = mockServices

  const handleNewService = () => {
    navigate('/services/new')
  }

  const handleEditService = (id: string) => {
    navigate(`/services/${id}`)
  }

  const getPriceLabel = (service: Service) => {
    const price = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(service.price)

    switch (service.priceType) {
      case 'fixed':
        return price
      case 'hourly':
        return `${price}/h`
      case 'starting_at':
        return `a partir de ${price}`
      default:
        return price
    }
  }

  const getPriceTypeLabel = (priceType: Service['priceType']) => {
    switch (priceType) {
      case 'fixed':
        return 'Preço fixo'
      case 'hourly':
        return 'Por hora'
      case 'starting_at':
        return 'A partir de'
      default:
        return ''
    }
  }

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return null
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Meus Serviços"
        subtitle="Gerencie os serviços que você oferece aos clientes."
        actions={
          <ButtonTech
            onClick={handleNewService}
            variant="solid"
            size="lg"
          >
            <Plus className="size-5" />
            Novo Serviço
          </ButtonTech>
        }
      />

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service) => (
          <CardTech key={service.id} className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  {service.title}
                </h3>
                <span className={`
                  inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
                  ${service.active
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                  }
                `}>
                  <span className={`w-1.5 h-1.5 rounded-full ${service.active ? 'bg-green-500' : 'bg-gray-400'}`} />
                  {service.active ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            </div>

            {/* Description */}
            {service.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
                {service.description}
              </p>
            )}

            {/* Details */}
            <div className="space-y-2 mb-4">
              {/* Price */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Preço:</span>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {getPriceLabel(service)}
                </span>
              </div>

              {/* Price Type */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Tipo:</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {getPriceTypeLabel(service.priceType)}
                </span>
              </div>

              {/* Duration */}
              {service.duration && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Duração:</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1">
                    <Clock className="size-3" />
                    {formatDuration(service.duration)}
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
              <ButtonTech
                onClick={() => handleEditService(service.id)}
                variant="outline"
                size="sm"
                className="flex-1 gap-1"
              >
                <Edit className="size-4" />
                Editar
              </ButtonTech>
              <ButtonTech
                variant="outline"
                size="sm"
                className="gap-1"
              >
                <Trash2 className="size-4" />
              </ButtonTech>
            </div>
          </CardTech>
        ))}
      </div>
    </div>
  )
}
