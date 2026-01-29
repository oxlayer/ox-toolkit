/**
 * Profile Page
 */

import { useState, useRef } from 'react'
import { Camera, Mail, Phone, User, Save, Building, MapPin } from 'lucide-react'
import { CardTech, InputTech, ButtonTech } from '@acme/ui'
import { PageHeader } from '@/components/page-header'
import { useApp } from '@/contexts/app-context'

export default function ProfilePage() {
  const { profile, setProfile } = useApp()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    name: profile?.name || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    description: 'Profissional dedicado com foco em qualidade e excelência no atendimento ao cliente.',
    address: 'Rua das Flores, 123 - Centro',
  })

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setIsEditing(true)
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setAvatarUrl(url)
      setIsEditing(true)
    }
  }

  const handleSave = () => {
    if (profile) {
      setProfile({
        ...profile,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
      })
      setIsEditing(false)
      // Show success feedback (toast would be better)
      console.log('Profile saved:', { ...formData, avatarUrl })
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Meu Perfil"
        subtitle="Gerencie suas informações pessoais e de contato."
        breadcrumbs={[
          { label: 'Configurações', href: '/settings' },
          { label: 'Meu Perfil' },
        ]}
        actions={
          <ButtonTech
            variant="solid"
            onClick={handleSave}
            disabled={!isEditing}
            className="gap-2"
          >
            <Save className="size-4" />
            Salvar Alterações
          </ButtonTech>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Avatar & Quick Info */}
        <div className="space-y-6">
          <CardTech className="p-6 flex flex-col items-center text-center">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 border-4 border-white dark:border-gray-700 shadow-lg">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-600 text-white text-4xl font-bold">
                    {profile?.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 bg-primary-600 text-white rounded-full shadow-md hover:bg-primary-700 transition-colors"
                aria-label="Alterar foto"
              >
                <Camera className="size-5" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>

            <h2 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">
              {formData.name}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
              {profile?.type === 'service_provider' ? 'Prestador de Serviço' : 'Empresa'}
            </p>

            <div className="w-full mt-6 space-y-3 pt-6 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                <Mail className="size-4 text-gray-400" />
                <span className="truncate">{formData.email || 'Sem e-mail'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                <Phone className="size-4 text-gray-400" />
                <span>{formData.phone || 'Sem telefone'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                <MapPin className="size-4 text-gray-400" />
                <span className="truncate">{formData.address}</span>
              </div>
            </div>
          </CardTech>
        </div>

        {/* Right Column: Edit Form */}
        <div className="md:col-span-2 space-y-6">
          <CardTech className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Informações Básicas
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nome Completo
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
                  <InputTech
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="pl-10"
                    placeholder="Seu nome completo"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Cargo / Título
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
                  <InputTech
                    value={profile?.type === 'service_provider' ? 'Profissional Autônomo' : 'Empresa'}
                    disabled
                    className="pl-10 bg-gray-50 dark:bg-gray-800"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  E-mail
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
                  <InputTech
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="pl-10"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Telefone / WhatsApp
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
                  <InputTech
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="pl-10"
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>

              <div className="col-span-1 md:col-span-2 space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Endereço
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
                  <InputTech
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="pl-10"
                    placeholder="Endereço completo"
                  />
                </div>
              </div>

              <div className="col-span-1 md:col-span-2 space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Sobre
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full min-h-[120px] px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow resize-y"
                  placeholder="Escreva um pouco sobre você..."
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Esta descrição ficará visível para seus clientes.
                </p>
              </div>
            </div>
          </CardTech>
        </div>
      </div>
    </div>
  )
}
