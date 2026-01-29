/**
 * Service Form Page - Create/Edit Service
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CardTech, FieldTech, InputTech, LabelTech, TextareaTech, ButtonTech as TechButton } from '@acme/ui'
import { PageHeader } from '@/components/page-header'
import { Select, SelectTrigger, SelectValue, SelectPopup, SelectItem } from '@acme/ui'
import type { CreateServiceInput, PriceType } from '@/types'

export default function ServiceFormPage() {
  const [formData, setFormData] = useState<CreateServiceInput & { priceType: PriceType }>({
    title: '',
    description: '',
    priceType: 'fixed',
    price: 0,
    duration: undefined,
    active: true,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Service data:', formData)
    // TODO: Save to API
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
        title="Novo Serviço"
        subtitle="Cadastre um serviço que você oferece aos clientes."
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
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
              onValueChange={(value) => setFormData({ ...formData, priceType: value as PriceType })}
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
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
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
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || undefined })}
              placeholder="Ex: 60"
            />
          </FieldTech>

          {/* Active */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
            />
            <label htmlFor="active" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Serviço ativo
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Link
              to="/services"
            >
              <TechButton
                variant="outline"
              >
                Cancelar
              </TechButton>
            </Link>
            <TechButton
              type="submit"
              variant="solid"
            >
              Salvar Serviço
            </TechButton>
          </div>
        </form>
      </CardTech>
    </div>
  )
}
