/**
 * Service Detail Page - Edit Service
 */

import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { CardTech, FieldTech, InputTech, LabelTech, TextareaTech, ButtonTech as TechButton } from '@acme/ui'
import { PageHeader } from '@/components/page-header'
import { Select, SelectTrigger, SelectValue, SelectPopup, SelectItem } from '@acme/ui'
import type { UpdateServiceInput, PriceType } from '@/types'
import { getServiceById, updateService } from '@/mocks/services'

export default function ServiceDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [service, setService] = useState<ReturnType<typeof getServiceById>>(null)
  const [isDirty, setIsDirty] = useState(false)

  const [formData, setFormData] = useState<UpdateServiceInput & { priceType: PriceType }>({
    title: '',
    description: '',
    priceType: 'fixed',
    price: 0,
    duration: undefined,
    active: true,
  })

  useEffect(() => {
    if (id) {
      const foundService = getServiceById(id)
      setService(foundService)
      if (foundService) {
        setFormData({
          title: foundService.title,
          description: foundService.description || '',
          priceType: foundService.priceType,
          price: foundService.price,
          duration: foundService.duration || undefined,
          active: foundService.active,
        })
      }
      setIsLoading(false)
    }
  }, [id])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setIsDirty(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (id) {
      const updated = updateService(id, {
        ...formData,
        description: formData.description || undefined,
      })
      if (updated) {
        setService(updated)
        setIsDirty(false)
        // TODO: Show success toast
        console.log('Service updated:', updated)
      }
    }
  }

  const handleDelete = () => {
    if (id && confirm('Tem certeza que deseja excluir este serviço?')) {
      // TODO: Delete service
      console.log('Delete service:', id)
      navigate('/services')
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl space-y-6" style={{
        display: "flex",
        flexDirection: "column",
        placeSelf: "center",
        width: "100%",
      }}>
        <PageHeader
          title="Carregando..."
          subtitle="Buscando informações do serviço."
        />
      </div>
    )
  }

  if (!service) {
    return (
      <div className="max-w-4xl space-y-6" style={{
        display: "flex",
        flexDirection: "column",
        placeSelf: "center",
        width: "100%",
      }}>
        <PageHeader
          title="Serviço não encontrado"
          subtitle="O serviço que você está procurando não existe."
        />
        <TechButton
          variant="outline"
          onClick={() => navigate('/services')}
        >
          Voltar para Serviços
        </TechButton>
      </div>
    )
  }

  return (
    <div className="max-w-4xl space-y-6" style={{
      display: "flex",
      flexDirection: "column",
      placeSelf: "center",
      width: "100%",
    }}>
      {/* Page Header */}
      <PageHeader
        title="Editar Serviço"
        subtitle="Atualize as informações do serviço."
        breadcrumbs={[
          { label: 'Serviços', href: '/services' },
          { label: service.title },
        ]}
        actions={
          <TechButton
            variant="outline"
            onClick={handleDelete}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
          >
            Excluir
          </TechButton>
        }
      />

      <CardTech className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <FieldTech>
            <LabelTech htmlFor="title" required>Título do Serviço</LabelTech>
            <InputTech
              id="title"
              name="title"
              required
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Ex: Instalação de chuveiro elétrico"
            />
          </FieldTech>

          {/* Description */}
          <FieldTech>
            <LabelTech htmlFor="description">Descrição</LabelTech>
            <TextareaTech
              id="description"
              name="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Descreva o serviço que você oferece, incluindo detalhes importantes..."
              rows={4}
            />
          </FieldTech>

          {/* Price Type */}
          <FieldTech>
            <LabelTech htmlFor="priceType" required>Tipo de Preço</LabelTech>
            <Select
              name="priceType"
              value={formData.priceType}
              onValueChange={(value) => handleInputChange('priceType', value as PriceType)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de preço" />
              </SelectTrigger>
              <SelectPopup>
                <SelectItem value="fixed">Preço Fixo</SelectItem>
                <SelectItem value="hourly">Por Hora</SelectItem>
                <SelectItem value="starting_at">A partir de</SelectItem>
              </SelectPopup>
            </Select>
          </FieldTech>

          {/* Price */}
          <FieldTech>
            <LabelTech htmlFor="price" required>Preço (R$)</LabelTech>
            <InputTech
              id="price"
              name="price"
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.price || ''}
              onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
              placeholder="0,00"
            />
          </FieldTech>

          {/* Duration */}
          <FieldTech>
            <LabelTech htmlFor="duration">Duração Estimada (minutos)</LabelTech>
            <InputTech
              id="duration"
              name="duration"
              type="number"
              min="1"
              value={formData.duration || ''}
              onChange={(e) => handleInputChange('duration', parseInt(e.target.value) || undefined)}
              placeholder="Ex: 60"
            />
          </FieldTech>

          {/* Active */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) => handleInputChange('active', e.target.checked)}
              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
            />
            <label htmlFor="active" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Serviço ativo
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <Link to="/services">
              <TechButton variant="outline">
                Cancelar
              </TechButton>
            </Link>
            <TechButton
              type="submit"
              variant="solid"
              disabled={!isDirty}
            >
              Salvar Alterações
            </TechButton>
          </div>
        </form>
      </CardTech>

      {/* Service Metadata */}
      <CardTech className="p-4 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>Criado em: {new Date(service.createdAt).toLocaleDateString('pt-BR')}</span>
          <span>Última atualização: {new Date(service.updatedAt).toLocaleDateString('pt-BR')}</span>
        </div>
      </CardTech>
    </div>
  )
}
