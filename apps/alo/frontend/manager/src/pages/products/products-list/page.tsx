/**
 * Products List Page
 */

import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { CardTech, ButtonTech } from '@acme/ui'
import { PageHeader } from '@/components/page-header'

export default function ProductsListPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Meus Produtos"
        subtitle="Gerencie os produtos que você oferece aos clientes."
        actions={
          <Link
            to="/products/new"
            className="inline-flex items-center gap-2"
          >
            <ButtonTech variant="solid" size="lg">
              <Plus className="size-5" />
              Novo Produto
            </ButtonTech>
          </Link>
        }
      />

      {/* Products List */}
      <CardTech className="p-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
          <span className="text-3xl">📦</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Nenhum produto cadastrado
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Comece adicionando o primeiro produto que você oferece.
        </p>
        <Link
          to="/products/new"
          className="inline-flex items-center gap-2"
        >
          <ButtonTech variant="solid">
            <Plus className="size-5" />
            Criar Produto
          </ButtonTech>
        </Link>
      </CardTech>
    </div>
  )
}
