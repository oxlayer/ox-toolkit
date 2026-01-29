/**
 * Chats List Page
 */

import { useNavigate, Outlet, useMatch } from 'react-router-dom'
import { Search, CheckCheck, X } from 'lucide-react'
import { InputTech } from '@acme/ui'
import { PageHeader } from '@/components/page-header'
import { mockChats, getMessagesByChatId } from '@/mocks'

export default function ChatsListPage() {
  const navigate = useNavigate()
  const chats = mockChats

  const handleChatClick = (chatId: string) => {
    navigate(`/c/${chatId}`)
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

  const match = useMatch('/c/:id')
  const activeChatId = match?.params.id

  return (
    <div className="flex h-[100vh] -m-6 bg-gray-50/50 dark:bg-gray-800/50 lg:rounded-tl-xl overflow-hidden shadow-sm">
      {/* Sidebar List */}
      <div className={`
        w-full md:w-80 lg:w-96 flex flex-col border-r border-gray-200 dark:border-gray-700
        ${activeChatId ? 'hidden md:flex' : 'flex'}
      `}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
          <PageHeader
            title="Conversas"
            subtitle="Gerencie suas mensagens."
          />
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <InputTech
              placeholder="Buscar conversas..."
              className="pl-9 h-10"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {chats.map((chat) => {
              const lastMessage = getLastMessage(chat.id)

              return (
                <button
                  key={chat.id}
                  onClick={() => handleChatClick(chat.id)}
                  className={`w-full text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50
                ${chat.id === activeChatId ? 'bg-primary-50 dark:bg-primary-900/10' : ''}
              `}
                >
                  <div className={`p-4 ${chat.unreadCount > 0 ? '' : ''}`}>
                    <div className="flex gap-4">
                      {/* Avatar */}
                      <div className="flex-shrink-0 relative">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-semibold text-lg">
                          {chat.customerName.charAt(0)}
                        </div>
                        {chat.status === 'open' && chat.unreadCount > 0 && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
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
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main Content (Chat Room or Placeholder) */}
      <div className={`
        flex-1 flex flex-col min-w-0 bg-white dark:bg-gray-900
        ${!activeChatId ? 'hidden md:flex' : 'flex'}
      `}>
        <Outlet />
      </div>
    </div>
  )
}
