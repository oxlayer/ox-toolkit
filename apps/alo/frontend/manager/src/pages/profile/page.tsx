/**
 * Profile Page
 */

import { CardTech } from '@acme/ui'

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Meu Perfil</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Configure suas informações pessoais e profissionais.
        </p>
      </div>

      <CardTech className="p-6">
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
          Página de perfil em construção...
        </p>
      </CardTech>
    </div>
  )
}
