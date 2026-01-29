/**
 * Product Form Page - Create/Edit Product
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CardTech, FieldTech, InputTech, LabelTech, TextareaTech, ButtonTech as TechButton } from '@acme/ui'
import { PageHeader } from '@/components/page-header'
import type { CreateProductInput } from '@/types'

export default function ProductFormPage() {
  const [formData, setFormData] = useState<CreateProductInput>({
    title: '',
    description: '',
    price: 0,
    stock: 0,
    active: true,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Product data:', formData)
    // TODO: Save to API
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Novo Produto"
        subtitle="Cadastre um produto que você oferece aos clientes."
      />

      <CardTech className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <FieldTech>
            <LabelTech htmlFor="title" required>Nome do Produto</LabelTech>
            <InputTech
              id="title"
              name="title"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Pizza Mussarela Média"
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
              placeholder="Descreva o produto, incluindo ingredientes, tamanho, etc..."
              rows={4}
            />
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

          {/* Stock */}
          <FieldTech>
            <LabelTech htmlFor="stock" required>Estoque</LabelTech>
            <InputTech
              id="stock"
              name="stock"
              type="number"
              required
              min="0"
              value={formData.stock || ''}
              onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
              placeholder="0"
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
              Produto ativo
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Link
              to="/products"
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </Link>
            <TechButton
              type="submit"
              variant="solid"
            >
              Salvar Produto
            </TechButton>
          </div>
        </form>
      </CardTech>
    </div>
  )
}
