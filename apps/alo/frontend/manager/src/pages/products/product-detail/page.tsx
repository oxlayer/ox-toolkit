/**
 * Product Detail Page
 */

import { useParams, Link } from 'react-router-dom'
import { CardTech } from '@acme/ui'
import { PageHeader } from '@/components/page-header'

export default function ProductDetailPage() {
  const { id } = useParams()

  return (
    <div className="max-w-2xl space-y-6">
      <Link to="/products" className="text-primary-500 hover:text-primary-600 text-sm font-medium inline-block">
        ← Voltar para Produtos
      </Link>

      <PageHeader
        title={`Detalhes do Produto #${id}`}
        subtitle="Visualize e edite as informações do produto."
      />

      <CardTech className="p-6">
        <p className="text-gray-500 dark:text-gray-400">
          Página de detalhes do produto em construção...
        </p>
      </CardTech>
    </div>
  )
}
