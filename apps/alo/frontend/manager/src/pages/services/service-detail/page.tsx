/**
 * Service Detail Page
 */

import { useParams } from 'react-router-dom'

export default function ServiceDetailPage() {
  const { id } = useParams()

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <a href="/services" className="text-primary-500 hover:text-primary-600 text-sm font-medium">
          ← Voltar para Serviços
        </a>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Detalhes do Serviço #{id}
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Página de detalhes do serviço em construção...
        </p>
      </div>
    </div>
  )
}
