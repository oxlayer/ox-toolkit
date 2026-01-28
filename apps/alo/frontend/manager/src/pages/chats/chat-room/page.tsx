/**
 * Chat Room Page
 */

import { useParams, Link } from 'react-router-dom'
import { useState } from 'react'
import { Send } from 'lucide-react'
import { CardTech, InputTech, ButtonTech as TechButton } from '@acme/ui'

export default function ChatRoomPage() {
  const { id } = useParams()
  const [message, setMessage] = useState('')

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim()) {
      console.log('Send message:', message)
      setMessage('')
      // TODO: Send to API
    }
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4">
      {/* Header */}
      <div>
        <Link to="/chats" className="text-primary-500 hover:text-primary-600 text-sm font-medium inline-flex items-center gap-1">
          ← Voltar para Conversas
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
          Conversa #{id}
        </h1>
      </div>

      {/* Chat Card */}
      <CardTech className="flex-1 flex flex-col p-0 overflow-hidden">
        {/* Messages Area */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          <div className="flex justify-start">
            <div className="max-w-[70%] bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2">
              <p className="text-sm text-gray-900 dark:text-white">
                Olá! Gostaria de saber mais sobre seus serviços.
              </p>
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">Cliente</span>
            </div>
          </div>

          <div className="flex justify-end">
            <div className="max-w-[70%] bg-primary-500 text-white rounded-lg px-4 py-2">
              <p className="text-sm">
                Oi! Tudo bem? Qual serviço você tem interesse?
              </p>
              <span className="text-xs text-primary-200 mt-1">Você</span>
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
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
              Enviar
            </TechButton>
          </form>
        </div>
      </CardTech>
    </div>
  )
}
