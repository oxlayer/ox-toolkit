/**
 * Integrations Settings Page
 */

import { useState } from 'react'
import { CardTech, InputTech, LabelTech, ButtonTech as TechButton } from '@acme/ui'
import { PageHeader } from '@/components/page-header'
import { Mail, MessageCircle, Check, Link, RefreshCw } from 'lucide-react'

interface IntegrationConfig {
  id: string
  name: string
  icon: React.ElementType
  description: string
  connected: boolean
  config?: {
    email?: string
    phoneNumber?: string
    apiKey?: string
  }
}

const mockIntegrations: IntegrationConfig[] = [
  {
    id: 'email',
    name: 'Email',
    icon: Mail,
    description: 'Receba notificações e comunicações por email',
    connected: true,
    config: {
      email: 'notificacoes@exemplo.com',
    },
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Business',
    icon: MessageCircle,
    description: 'Conecte-se com clientes pelo WhatsApp',
    connected: false,
  },
]

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<IntegrationConfig[]>(mockIntegrations)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [emailConfig, setEmailConfig] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)

  const handleConnect = (id: string) => {
    setEditingId(id)
    const integration = integrations.find(i => i.id === id)
    if (integration?.config?.email) {
      setEmailConfig(integration.config.email)
    }
  }

  const handleDisconnect = (id: string) => {
    if (confirm('Tem certeza que deseja desconectar esta integração?')) {
      setIntegrations(integrations.map(i =>
        i.id === id ? { ...i, connected: false, config: undefined } : i
      ))
    }
  }

  const handleSaveEmail = (e: React.FormEvent) => {
    e.preventDefault()
    setIsConnecting(true)

    // Simulate API call
    setTimeout(() => {
      setIntegrations(integrations.map(i =>
        i.id === editingId
          ? { ...i, connected: true, config: { email: emailConfig } }
          : i
      ))
      setEditingId(null)
      setEmailConfig('')
      setIsConnecting(false)
    }, 1000)
  }

  const handleConnectWhatsApp = () => {
    setIsConnecting(true)

    // Simulate QR code flow
    setTimeout(() => {
      const phoneNumber = prompt('Digite seu número do WhatsApp (com DDD):', '11999999999')
      if (phoneNumber) {
        setIntegrations(integrations.map(i =>
          i.id === 'whatsapp'
            ? { ...i, connected: true, config: { phoneNumber } }
            : i
        ))
      }
      setIsConnecting(false)
    }, 500)
  }

  const handleTestConnection = (id: string) => {
    console.log('Test connection for:', id)
    // TODO: Implement test connection
  }

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        title="Integrações"
        subtitle="Configure email, WhatsApp e outras integrações."
        breadcrumbs={[
          { label: 'Configurações', href: '/settings' },
          { label: 'Integrações' },
        ]}
      />

      <div className="space-y-4">
        {integrations.map((integration) => {
          const Icon = integration.icon
          const isEditing = editingId === integration.id

          return (
            <CardTech key={integration.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${
                    integration.connected
                      ? 'bg-green-100 dark:bg-green-900/30'
                      : 'bg-gray-100 dark:bg-gray-800'
                  }`}>
                    <Icon className={`size-6 ${
                      integration.connected
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-gray-500 dark:text-gray-400'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {integration.name}
                      </h3>
                      {integration.connected && (
                        <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          <Check className="size-3" />
                          Conectado
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      {integration.description}
                    </p>

                    {integration.connected && integration.config && (
                      <div className="space-y-2 text-sm">
                        {integration.config.email && (
                          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                            <Mail className="size-4 text-gray-400" />
                            <span>{integration.config.email}</span>
                          </div>
                        )}
                        {integration.config.phoneNumber && (
                          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                            <MessageCircle className="size-4 text-gray-400" />
                            <span>{integration.config.phoneNumber}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {isEditing && integration.id === 'email' && (
                      <form onSubmit={handleSaveEmail} className="mt-4 space-y-3">
                        <div>
                          <LabelTech htmlFor="email-config">Endereço de Email</LabelTech>
                          <InputTech
                            id="email-config"
                            type="email"
                            value={emailConfig}
                            onChange={(e) => setEmailConfig(e.target.value)}
                            placeholder="seu@email.com"
                            required
                            disabled={isConnecting}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <TechButton
                            type="submit"
                            variant="solid"
                            size="sm"
                            disabled={isConnecting || !emailConfig.trim()}
                          >
                            {isConnecting ? 'Conectando...' : 'Conectar'}
                          </TechButton>
                          <TechButton
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingId(null)
                              setEmailConfig('')
                            }}
                            disabled={isConnecting}
                          >
                            Cancelar
                          </TechButton>
                        </div>
                      </form>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {integration.connected ? (
                    <>
                      <TechButton
                        variant="outline"
                        size="sm"
                        onClick={() => handleTestConnection(integration.id)}
                        className="gap-2"
                      >
                        <RefreshCw className="size-4" />
                        Testar
                      </TechButton>
                      <TechButton
                        variant="outline"
                        size="sm"
                        onClick={() => handleDisconnect(integration.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 dark:text-red-400 dark:hover:bg-red-900/20 dark:border-red-800"
                      >
                        Desconectar
                      </TechButton>
                    </>
                  ) : (
                    <>
                      {integration.id === 'email' && !isEditing && (
                        <TechButton
                          variant="solid"
                          size="sm"
                          onClick={() => handleConnect(integration.id)}
                          className="gap-2"
                        >
                          <Link className="size-4" />
                          Conectar
                        </TechButton>
                      )}
                      {integration.id === 'whatsapp' && (
                        <TechButton
                          variant="solid"
                          size="sm"
                          onClick={handleConnectWhatsApp}
                          disabled={isConnecting}
                          className="gap-2"
                        >
                          <MessageCircle className="size-4" />
                          {isConnecting ? 'Conectando...' : 'Conectar WhatsApp'}
                        </TechButton>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* WhatsApp QR Code Placeholder */}
              {isConnecting && integration.id === 'whatsapp' && (
                <div className="mt-6 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                  <RefreshCw className="size-8 text-gray-400 mx-auto mb-4 animate-spin" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Gerando QR Code...
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                    Abra o WhatsApp no seu celular e escaneie o QR Code
                  </p>
                </div>
              )}
            </CardTech>
          )
        })}
      </div>

      {/* Info Card */}
      <CardTech className="p-6 bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-3">
          Sobre as integrações
        </h3>
        <div className="space-y-2 text-sm text-blue-800 dark:text-blue-400">
          <p><strong>Email:</strong> Configure um endereço para receber notificações importantes sobre agendamentos, mensagens e mais.</p>
          <p><strong>WhatsApp Business:</strong> Integre com o WhatsApp Business para responder mensagens diretamente da plataforma.</p>
        </div>
      </CardTech>
    </div>
  )
}
