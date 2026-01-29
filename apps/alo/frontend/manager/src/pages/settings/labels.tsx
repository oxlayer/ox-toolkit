
/**
 * Labels Settings Page
 */

import { useState } from 'react'
import { Tag, Plus, X, Edit2 } from 'lucide-react'
import { CardTech, InputTech, ButtonTech } from '@acme/ui'
import { PageHeader } from '@/components/page-header'

interface Label {
    id: string
    name: string
    color: string
}

const initialLabels: Label[] = [
    { id: '1', name: 'Novo Cliente', color: '#3B82F6' },
    { id: '2', name: 'Importante', color: '#EF4444' },
    { id: '3', name: 'Aguardando Pagamento', color: '#F59E0B' },
    { id: '4', name: 'Finalizado', color: '#10B981' },
]

export default function LabelsPage() {
    const [labels, setLabels] = useState<Label[]>(initialLabels)
    const [newLabelName, setNewLabelName] = useState('')
    const [newLabelColor, setNewLabelColor] = useState('#3B82F6')

    const handleAddLabel = (e: React.FormEvent) => {
        e.preventDefault()
        if (!newLabelName.trim()) return

        const newLabel: Label = {
            id: Date.now().toString(),
            name: newLabelName,
            color: newLabelColor,
        }

        setLabels([...labels, newLabel])
        setNewLabelName('')
    }

    const handleDeleteLabel = (id: string) => {
        setLabels(labels.filter(l => l.id !== id))
    }

    return (
        <div className="max-w-4xl space-y-6">
            <PageHeader
                title="Etiquetas"
                subtitle="Organize seus contatos e conversas com etiquetas personalizadas."
                breadcrumbs={[
                    { label: 'Configurações', href: '/settings' },
                    { label: 'Etiquetas' },
                ]}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Create Label */}
                <div className="md:col-span-1">
                    <CardTech className="p-6 sticky top-6">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                            Nova Etiqueta
                        </h3>
                        <form onSubmit={handleAddLabel} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Nome
                                </label>
                                <InputTech
                                    value={newLabelName}
                                    onChange={(e) => setNewLabelName(e.target.value)}
                                    placeholder="Ex: VIP"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Cor
                                </label>
                                <div className="flex gap-2 flex-wrap">
                                    {['#3B82F6', '#EF4444', '#F59E0B', '#10B981', '#8B5CF6', '#EC4899', '#6366F1'].map((color) => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => setNewLabelColor(color)}
                                            className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${newLabelColor === color ? 'border-gray-900 dark:border-white' : 'border-transparent'
                                                }`}
                                            style={{ backgroundColor: color }}
                                            aria-label={`Selecionar cor ${color}`}
                                        />
                                    ))}
                                </div>
                            </div>

                            <ButtonTech type="submit" variant="solid" className="w-full">
                                <Plus className="w-4 h-4 mr-2" />
                                Adicionar
                            </ButtonTech>
                        </form>
                    </CardTech>
                </div>

                {/* Labels List */}
                <div className="md:col-span-2 space-y-4">
                    {labels.length > 0 ? (
                        labels.map((label) => (
                            <div
                                key={label.id}
                                className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
                            >
                                <div className="flex items-center gap-3">
                                    <Tag className="w-5 h-5" style={{ color: label.color }} />
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        {label.name}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        className="p-2 text-gray-400 hover:text-primary-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteLabel(label.id)}
                                        className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                            <Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500 dark:text-gray-400">
                                Nenhuma etiqueta criada.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
