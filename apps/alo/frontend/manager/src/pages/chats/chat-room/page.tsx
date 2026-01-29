/**
 * Chat Room Page
 */

import { useParams, Link } from 'react-router-dom'
import { useState, useCallback } from 'react'
import {
  Send,
  Search,
  Info,
  X,
  User,
  Phone,
  Star,
  Bell,
  BellOff,
  Ban,
  Flag,
  Trash2,
  ArrowRight,
  Calendar,
  DollarSign,
  CheckCircle,
  ShieldCheck,
  Award,
  Briefcase,
} from 'lucide-react'
import { InputTech, ButtonTech as TechButton } from '@acme/ui'
import { mockChats, mockClients } from '@/mocks'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// Mock media/files data
const mockMediaFiles = [
  { id: 1, type: 'image', url: '/placeholder.jpg', thumbnail: '📷', name: 'photo_001.jpg' },
  { id: 2, type: 'image', url: '/placeholder2.jpg', thumbnail: '📷', name: 'photo_002.jpg' },
  { id: 3, type: 'document', url: '/doc.pdf', thumbnail: '📄', name: 'contrato.pdf' },
  { id: 4, type: 'link', url: 'https://example.com', thumbnail: '🔗', name: 'Portfolio' },
]

export default function ChatRoomPage() {
  const { id } = useParams()
  const [message, setMessage] = useState('')
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isMuted, setIsMuted] = useState(false)

  // Get chat and client info
  const chat = mockChats.find(c => c.id === id)
  const client = mockClients.find(c => c.chatId === id)

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim()) {
      console.log('Send message:', message)
      setMessage('')
      // TODO: Send to API
    }
  }

  const toggleDrawer = useCallback(() => {
    setIsDrawerOpen(prev => !prev)
  }, [])

  const handleSearch = () => {
    console.log('Search in chat')
    // TODO: Implement chat search
  }

  const handleSchedule = () => {
    console.log('Schedule appointment')
    // TODO: Open appointment modal
  }

  const handleSendQuote = () => {
    console.log('Send quote')
    // TODO: Open quote modal
  }

  const handleConfirmService = () => {
    console.log('Confirm service')
    // TODO: Confirm service action
  }

  // Render trust indicators
  const renderTrustIndicators = () => {
    if (!chat?.trustInfo) return null

    const { trustInfo } = chat

    return (
      <div className="flex items-center gap-3 text-xs">
        {/* Verification Badge */}
        {trustInfo.isVerified && (
          <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full font-medium">
            <ShieldCheck className="w-3 h-3" />
            <span>Verificado</span>
          </div>
        )}

        {/* Years Active */}
        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
          <Award className="w-3 h-3" />
          <span>{trustInfo.yearsActive} {trustInfo.yearsActive === 1 ? 'ano' : 'anos'}</span>
        </div>

        {/* Rating & Completed Jobs */}
        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
          <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
          <span>{trustInfo.rating.toFixed(1)}</span>
          <span className="text-gray-400">•</span>
          <span>{trustInfo.completedJobs} {trustInfo.completedJobs === 1 ? 'serviço' : 'serviços'}</span>
        </div>
      </div>
    )
  }

  // Render service context and quick actions
  const renderServiceContext = () => {
    if (!chat?.serviceContext?.serviceName) return null

    const { serviceContext } = chat

    const statusConfig = {
      inquiry: { label: 'Consulta', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
      quoted: { label: 'Orçado', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
      scheduled: { label: 'Agendado', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
      completed: { label: 'Concluído', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' },
      cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    }

    const status = statusConfig[serviceContext.serviceStatus] || statusConfig.inquiry

    return (
      <div className="mx-4 mb-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-primary-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Conversa sobre:
            </span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {serviceContext.serviceName}
            </span>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full ${status.color}`}>
            {status.label}
          </span>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <TechButton
            variant="outline"
            size="sm"
            onClick={handleSchedule}
            className="flex-1 gap-1.5 text-xs"
          >
            <Calendar className="w-3.5 h-3.5" />
            Agendar
          </TechButton>
          <TechButton
            variant="outline"
            size="sm"
            onClick={handleSendQuote}
            className="flex-1 gap-1.5 text-xs"
          >
            <DollarSign className="w-3.5 h-3.5" />
            Enviar orçamento
          </TechButton>
          {serviceContext.serviceStatus === 'quoted' || serviceContext.serviceStatus === 'inquiry' ? (
            <TechButton
              variant="solid"
              size="sm"
              onClick={handleConfirmService}
              className="flex-1 gap-1.5 text-xs"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Confirmar serviço
            </TechButton>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative">
      {/* Chat Header with Trust Indicators */}
      <div
        className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shrink-0"
      >
        <div
          className="px-6 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          onClick={toggleDrawer}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-semibold">
              {client?.name.charAt(0) || chat?.customerName.charAt(0) || 'C'}
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                {client?.name || chat?.customerName || `Chat #${id}`}
                {chat?.trustInfo?.isVerified && (
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                )}
              </h2>
              {renderTrustIndicators()}
              {/* Service Context in Header */}
              {chat?.serviceContext?.serviceName && (
                <div className="flex items-center gap-1.5 mt-0.5 text-xs text-gray-600 dark:text-gray-400">
                  <Briefcase className="w-3 h-3 text-primary-500" />
                  <span>{chat.serviceContext.serviceName}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleDrawer()
              }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="Informações do contato"
            >
              <Info className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Service Context with Quick Actions */}
      {renderServiceContext()}

      {/* Messages Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50/50 dark:bg-gray-900/50">
        <div className="flex justify-start">
          <div className="max-w-[70%] bg-blue-500 dark:bg-gray-800 rounded-2xl rounded-tl-none px-4 py-2 shadow-sm border border-gray-100 dark:border-gray-700">
            <p className="text-sm text-white dark:text-white">
              Olá! Gostaria de saber mais sobre seus serviços.
            </p>
            <span className="text-xs text-gray-200 mt-1 block">10:00</span>
          </div>
        </div>

        <div className="flex justify-end">
          <div className="max-w-[70%] bg-green-500 text-white rounded-2xl rounded-tr-none px-4 py-2 shadow-sm">
            <p className="text-sm">
              Oi! Tudo bem? Qual serviço você tem interesse?
            </p>
            <span className="text-xs text-gray-200 mt-1 block text-right">10:05</span>
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shrink-0">
        <form onSubmit={handleSend} className="flex gap-2">
          <InputTech
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="flex-1"
          />
          <TechButton
            type="submit"
            variant="solid"
            disabled={!message.trim()}
            className="gap-2"
          >
            <Send className="size-4" />
          </TechButton>
        </form>
      </div>

      {/* Client Info Drawer */}
      {isDrawerOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 z-50 transition-opacity"
            onClick={toggleDrawer}
          />

          {/* Drawer */}
          <div className="fixed right-0 top-0 h-full w-140 bg-white dark:bg-gray-900 shadow-2xl z-50 flex flex-col border-l border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Informações do Contato
              </h3>
              <button
                onClick={toggleDrawer}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Profile Section with Trust Indicators */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex flex-col items-center text-center mb-4">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-semibold text-3xl mb-3">
                    {client?.name.charAt(0) || chat?.customerName.charAt(0) || 'C'}
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    {client?.name || chat?.customerName || `Chat #${id}`}
                    {chat?.trustInfo?.isVerified && (
                      <ShieldCheck className="w-5 h-5 text-emerald-500" />
                    )}
                  </h4>

                  {/* Trust Indicators in Drawer */}
                  {chat?.trustInfo && (
                    <div className="flex items-center justify-center gap-4 mt-2 text-sm">
                      <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                        <Award className="w-4 h-4" />
                        <span>{chat.trustInfo.yearsActive} {chat.trustInfo.yearsActive === 1 ? 'ano' : 'anos'}</span>
                      </div>
                      <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                        <Star className="w-4 h-4 fill-current" />
                        <span>{chat.trustInfo.rating.toFixed(1)}</span>
                      </div>
                      <div className="text-gray-600 dark:text-gray-400">
                        {chat.trustInfo.completedJobs} serviços
                      </div>
                    </div>
                  )}

                  {client?.phone && (
                    <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 mt-1">
                      <Phone className="w-3.5 h-3.5" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                </div>

                {client && (
                  <Link
                    to={`/clients/${client.id}`}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    Ver perfil completo
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>

              {/* Search in Chat */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleSearch}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <Search className="w-5 h-5 text-gray-500" />
                  <span>Buscar na conversa</span>
                </button>
              </div>

              {/* About Section */}
              {client && (
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    Sobre
                  </h5>
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <p><strong className="text-gray-900 dark:text-white">Email:</strong> {client.email || 'Não informado'}</p>
                    {client.address && (
                      <p><strong className="text-gray-900 dark:text-white">Endereço:</strong> {client.address}</p>
                    )}
                    {client.birthdate && (
                      <p><strong className="text-gray-900 dark:text-white">Aniversário:</strong> {format(new Date(client.birthdate), "dd 'de' MMMM", { locale: ptBR })}</p>
                    )}
                    {client.notes && (
                      <p><strong className="text-gray-900 dark:text-white">Notas:</strong> {client.notes}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Service Context Section in Drawer */}
              {chat?.serviceContext?.serviceName && (
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-primary-500" />
                    Conversa sobre
                  </h5>
                  <div className="mb-3 p-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {chat.serviceContext.serviceName}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <TechButton
                      variant="outline"
                      size="sm"
                      onClick={handleSchedule}
                      className="w-full gap-2 text-xs"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      Agendar
                    </TechButton>
                    <TechButton
                      variant="outline"
                      size="sm"
                      onClick={handleSendQuote}
                      className="w-full gap-2 text-xs"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      Enviar orçamento
                    </TechButton>
                    {chat.serviceContext.serviceStatus === 'quoted' || chat.serviceContext.serviceStatus === 'inquiry' ? (
                      <TechButton
                        variant="solid"
                        size="sm"
                        onClick={handleConfirmService}
                        className="w-full gap-2 text-xs"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Confirmar serviço
                      </TechButton>
                    ) : null}
                  </div>
                </div>
              )}

              {/* Media, Links & Docs */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <button className="w-full flex items-center justify-between text-left mb-3">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    Mídias, links e docs
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                    {mockMediaFiles.length}
                  </span>
                </button>
                <div className="grid grid-cols-4 gap-1">
                  {mockMediaFiles.map((file) => (
                    <div
                      key={file.id}
                      className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-2xl hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                      title={file.name}
                    >
                      {file.thumbnail}
                    </div>
                  ))}
                </div>
              </div>

              {/* Starred Messages */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <button className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                  <Star className="w-5 h-5 text-amber-500" />
                  <span>Mensagens favoritas</span>
                </button>
              </div>

              {/* Mute Notifications */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isMuted ? (
                      <BellOff className="w-5 h-5 text-gray-500" />
                    ) : (
                      <Bell className="w-5 h-5 text-gray-500" />
                    )}
                    <span>Silenciar notificações</span>
                  </div>
                  <div className={`w-12 h-6 rounded-full transition-colors ${isMuted ? 'bg-gray-300 dark:bg-gray-600' : 'bg-primary-500'
                    }`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${isMuted ? 'translate-x-0.5' : 'translate-x-6'
                      }`} />
                  </div>
                </button>
              </div>

              {/* Danger Actions */}
              <div className="p-4 space-y-1">
                <button className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                  <Ban className="w-5 h-5" />
                  <span>Bloquisar contato</span>
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                  <Flag className="w-5 h-5" />
                  <span>Denunciar conversa</span>
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                  <Trash2 className="w-5 h-5" />
                  <span>Excluir conversa</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
