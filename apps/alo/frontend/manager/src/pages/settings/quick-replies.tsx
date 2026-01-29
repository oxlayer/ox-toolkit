
/**
 * Quick Replies Settings Page
 */

import { useState } from 'react'
import { MessageSquare, Plus, Trash2, Zap } from 'lucide-react'
import { CardTech, InputTech, ButtonTech } from '@acme/ui'
import { PageHeader } from '@/components/page-header'

interface QuickReply {
    id: string
    shortcut: string
    message: string
}

const initialReplies: QuickReply[] = [
    { id: '1', shortcut: '/oi', message: 'Olá! Como posso ajudar você hoje?' },
    { id: '2', shortcut: '/aguarde', message: 'Um momento, por favor, já verifico essa informação para você.' },
    { id: '3', shortcut: '/pix', message: 'Nossa chave PIX é: cnpj@empresa.com' },
]

export default function QuickRepliesPage() {
    const [replies, setReplies] = useState<QuickReply[]>(initialReplies)
    const [shortcut, setShortcut] = useState('')
    const [message, setMessage] = useState('')

    const handleAddReply = (e: React.FormEvent) => {
        e.preventDefault()
        if (!shortcut.trim() || !message.trim()) return

        const newReply: QuickReply = {
            id: Date.now().toString(),
            shortcut: shortcut.startsWith('/') ? shortcut : `/${shortcut}`,
            message,
        }

        setReplies([...replies, newReply])
        setShortcut('')
        setMessage('')
    }

    const handleDeleteReply = (id: string) => {
        setReplies(replies.filter(r => r.id !== id))
    }

    return (
        <div className="max-w-4xl space-y-6">
            <PageHeader
                title="Respostas Rápidas"
                subtitle="Configure atalhos para mensagens frequentes."
                breadcrumbs={[
                    { label: 'Configurações', href: '/settings' },
                    { label: 'Respostas Rápidas' },
                ]}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Create Reply */}
                <div className="md:col-span-1">
                    <CardTech className="p-6 sticky top-6">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                            Nova Resposta
                        </h3>
                        <form onSubmit={handleAddReply} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Atalho
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">/</span>
                                    <InputTech
                                        value={shortcut.replace(/^\//, '')}
                                        onChange={(e) => setShortcut(e.target.value)}
                                        placeholder="exemplo"
                                        className="pl-6"
                                        required
                                    />
                                </div>
                                <p className="text-xs text-gray-500">
                                    Digite /atalho no chat para enviar.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Mensagem
                                </label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    className="w-full min-h-[100px] px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow resize-y"
                                    placeholder="Digite a mensagem completa..."
                                    required
                                />
                            </div>

                            <ButtonTech type="submit" variant="solid" className="w-full">
                                <Plus className="w-4 h-4 mr-2" />
                                Salvar
                            </ButtonTech>
                        </form>
                    </CardTech>
                </div>

                {/* Replies List */}
                <div className="md:col-span-2 space-y-4">
                    {replies.length > 0 ? (
                        replies.map((reply) => (
                            <CardTech key={reply.id} className="p-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Zap className="w-4 h-4 text-primary-500" />
                                            <span className="font-mono font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 px-2 py-0.5 rounded text-sm">
                                                {reply.shortcut}
                                            </span>
                                        </div>
                                        <p className="text-gray-600 dark:text-gray-300 text-sm whitespace-pre-wrap">
                                            {reply.message}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteReply(reply.id)}
                                        className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
                                        aria-label="Excluir resposta"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </CardTech>
                        ))
                    ) : (
                        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500 dark:text-gray-400">
                                Nenhuma resposta rápida configurada.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
