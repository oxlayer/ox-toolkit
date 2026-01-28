/**
 * Chats List Page
 */

import { useNavigate } from 'react-router-dom'
import { Search, CheckCheck, X } from 'lucide-react'
import { CardTech, InputTech } from '@acme/ui'
import { mockChats, getMessagesByChatId } from '@/mocks'

export default function ChatsListPage() {
  const navigate = useNavigate()
  const chats = mockChats

  const handleChatClick = (chatId: string) => {
    navigate(`/chats/${chatId}`)
  }

  const getLastMessage = (chatId: string) => {
    const messages = getMessagesByChatId(chatId)
    return messages[messages.length - 1]
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Agora'
    if (diffMins < 60) return `${diffMins}min`
    if (diffHours < 24) return `${diffHours}h`
    if (diffDays === 1) return 'Ontem'
    if (diffDays < 7) return `${diffDays}d`
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return null
      case 'closed':
        return <X className="size-4 text-gray-400" />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Conversas</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Gerencie suas conversas com clientes.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
        <InputTech
          placeholder="Buscar conversas..."
          className="pl-12"
        />
      </div>

      {/* Chats List */}
      <div className="space-y-2">
        {chats.map((chat) => {
          const lastMessage = getLastMessage(chat.id)

          return (
            <button
              key={chat.id}
              onClick={() => handleChatClick(chat.id)}
              className="w-full text-left"
            >
              <CardTech className={`
                p-4 transition-all hover:shadow-md
                ${chat.unreadCount > 0 ? 'bg-primary-50/50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800' : ''}
              `}>
                <div className="flex gap-4">
                  {/* Avatar */}
                  <div className="flex-shrink-0 relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold text-lg">
                      {chat.customerName.charAt(0)}
                    </div>
                    {chat.status === 'open' && chat.unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 rounded-full text-white text-xs flex items-center justify-center">
                        {chat.unreadCount}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className={`
                            font-semibold truncate
                            ${chat.unreadCount > 0 ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}
                          `}>
                            {chat.customerName}
                          </h3>
                          {getStatusIcon(chat.status)}
                        </div>
                        {lastMessage && (
                          <p className={`
                            text-sm truncate
                            ${chat.unreadCount > 0 ? 'text-gray-800 dark:text-gray-200' : 'text-gray-500 dark:text-gray-400'}
                          `}>
                            {lastMessage.senderId === chat.providerId ? 'Você: ' : ''}
                            {lastMessage.content}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xs text-gray-500 dark:text-gray-500 whitespace-nowrap">
                          {formatTime(chat.lastMessageAt || chat.createdAt)}
                        </span>
                        {chat.unreadCount === 0 && chat.status === 'open' && (
                          <CheckCheck className="size-4 text-primary-500" />
                        )}
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {chat.customerEmail && (
                        <span className="truncate">{chat.customerEmail}</span>
                      )}
                      {chat.customerPhone && (
                        <span>•</span>
                      )}
                      {chat.customerPhone && (
                        <span>{chat.customerPhone}</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardTech>
            </button>
          )
        })}
      </div>
    </div>
  )
}
