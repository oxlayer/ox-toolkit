/**
 * Notification Drawer Component
 */

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, Check, Trash2, ExternalLink } from 'lucide-react'
import {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetPopup,
  SheetHeader,
  SheetTitle,
  SheetPanel,
} from '@acme/ui'
import { mockNotifications, markAsRead, markAllAsRead, getUnreadCount } from '@/mocks/notifications'

export function NotificationDrawer() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  const unreadCount = getUnreadCount()

  const handleNotificationClick = (notificationId: string, link?: string) => {
    markAsRead(notificationId)
    if (link) {
      setOpen(false)
      navigate(link)
    }
  }

  const handleMarkAllAsRead = () => {
    markAllAsRead()
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Agora'
    if (diffMins < 60) return `${diffMins}min atrás`
    if (diffHours < 24) return `${diffHours}h atrás`
    if (diffDays === 1) return 'Ontem'
    if (diffDays < 7) return `${diffDays} dias atrás`
    return date.toLocaleDateString('pt-BR')
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="relative p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Notificações"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
      </SheetTrigger>

      <SheetPopup side="right" className="w-96 sm:max-w-md">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>Notificações</SheetTitle>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-primary-500 hover:text-primary-600 flex items-center gap-1"
                >
                  <Check className="w-3 h-3" />
                  Marcar todas como lidas
                </button>
              )}
            </div>
          </div>
        </SheetHeader>

        <SheetPanel>
          {mockNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                Nenhuma notificação
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {mockNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`
                    group relative p-3 rounded-lg border transition-colors cursor-pointer
                    ${notification.status === 'unread'
                      ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750'
                    }
                  `}
                  onClick={() => handleNotificationClick(notification.id, notification.link)}
                >
                  {notification.status === 'unread' && (
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-primary-500 rounded-full" />
                  )}

                  <div className={`flex gap-3 ${notification.status === 'unread' ? 'pl-3' : ''}`}>
                    {/* Icon */}
                    <div className="flex-shrink-0 text-2xl">
                      {notification.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`
                          text-sm font-medium line-clamp-1
                          ${notification.status === 'unread'
                            ? 'text-gray-900 dark:text-white'
                            : 'text-gray-700 dark:text-gray-300'
                          }
                        `}>
                          {notification.title}
                        </p>
                        {notification.link && (
                          <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        )}
                      </div>

                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-0.5">
                        {notification.message}
                      </p>

                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {formatTime(notification.createdAt)}
                      </p>
                    </div>
                  </div>

                  {notification.status === 'unread' && (
                    <div className="absolute inset-x-0 bottom-0 h-0.5 bg-primary-200 dark:bg-primary-800" />
                  )}
                </div>
              ))}
            </div>
          )}
        </SheetPanel>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <SheetClose asChild>
            <Link
              to="/settings"
              className="block w-full text-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors py-2"
            >
              Configurar notificações
            </Link>
          </SheetClose>
        </div>
      </SheetPopup>
    </Sheet>
  )
}
