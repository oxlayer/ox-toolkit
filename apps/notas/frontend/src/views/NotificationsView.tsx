/**
 * Notifications View
 *
 * Shows notifications about changes in shared projects.
 */

import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NotificationsViewProps {
  onClose?: () => void;
}

export function NotificationsView({ onClose: _onClose }: NotificationsViewProps) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      {/* Header */}
      <div className="px-10 py-8 pb-2 border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <Bell className="h-5 w-5 text-gray-500" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">Notificações</h1>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="text-gray-500 font-normal hover:bg-gray-100"
            disabled
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                fillRule="evenodd"
                d="m6.974 15.771 5.69-9.854a.499.499 0 1 1 .863.498l-6 10.395a.5.5 0 0 1-.735.147 1 1 0 0 1-.061-.048l-3.366-3.14a.499.499 0 1 1 .68-.729zM11.5 16h6a.5.5 0 1 1 0 1h-6a.5.5 0 1 1 0-1m2-4h6a.5.5 0 1 1 0 1h-6a.5.5 0 1 1 0-1m2-4h6a.5.5 0 1 1 0 1h-6a.5.5 0 1 1 0-1"
              />
            </svg>
            Marcar todas como lidas
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-4 border-b">
          <button className="px-4 py-2 text-sm font-medium border-b-2 border-red-500 text-red-600">
            Tudo
          </button>
          <button className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700">
            Não lido
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-10 py-12">
        <div className="max-w-2xl mx-auto text-center">
          {/* Empty state icon */}
          <div className="mb-6">
            <div className="w-32 h-32 mx-auto bg-gray-50 rounded-full flex items-center justify-center">
              <Bell className="h-16 w-16 text-gray-300" />
            </div>
          </div>

          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Fique por dentro de tudo
          </h2>

          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Aqui você encontrará notificações sobre alterações em seus projetos compartilhados.
          </p>

          {/* Help link */}
          <a
            href="#"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 17 17">
              <path
                fill="currentColor"
                d="M8 16A8 8 0 1 1 8 0a8 8 0 0 1 0 16zm0-1A7 7 0 1 0 8 1a7 7 0 0 0 0 14zm-.1-2.5c-.46 0-.8-.35-.8-.85s.34-.86.8-.86c.48 0 .8.36.8.86s-.32.85-.8.85zM5.5 5.87c.06-1.32.9-2.37 2.53-2.37 1.47 0 2.47.95 2.47 2.21 0 .96-.47 1.64-1.22 2.11-.73.46-.94.8-.94 1.45v.4H7.32V9.1c0-.8.37-1.36 1.16-1.86.68-.43.94-.82.94-1.47 0-.76-.56-1.32-1.43-1.32-.87 0-1.43.55-1.5 1.42H5.5z"
              />
            </svg>
            <span>Como compartilhar projetos</span>
          </a>
        </div>
      </div>
    </div>
  );
}
