/**
 * Products List Page
 */

import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { CardTech } from '@acme/ui'

export default function ProductsListPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Meus Produtos</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gerencie os produtos que você oferece aos clientes.
          </p>
        </div>
        <Link
          to="/products/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
        >
          <Plus className="size-5" />
          Novo Produto
        </Link>
      </div>

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
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
        >
          <Plus className="size-5" />
          Criar Produto
        </Link>
      </CardTech>
    </div>
  )
}
