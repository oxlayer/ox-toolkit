/**
 * Automation Settings Page with React Flow
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import {
  ReactFlow,
  ReactFlowProvider,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
  Panel,
} from 'reactflow'
import 'reactflow/dist/style.css'

import { CardTech, ButtonTech as TechButton, InputTech, LabelTech } from '@acme/ui'
import { PageHeader } from '@/components/page-header'
import {
  MessageSquare,
  Calendar,
  Mail,
  Clock,
  Send,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
  Play,
  Save,
  Settings,
  X,
} from 'lucide-react'
import { Select, SelectTrigger, SelectValue, SelectPopup, SelectItem } from '@acme/ui'

// Initial nodes for the automation workflow
const initialNodes: Node[] = [
  {
    id: 'trigger-1',
    type: 'input',
    sourcePosition: 'bottom',
    data: {
      label: (
        <div className="flex items-center gap-2 px-2">
          <MessageSquare className="size-4 text-blue-600" />
          <div>
            <div className="font-semibold text-sm">Nova Mensagem</div>
            <div className="text-xs text-gray-500">Quando receber uma mensagem</div>
          </div>
        </div>
      ),
      config: {
        name: 'Nova Mensagem Recebida',
        triggerType: 'message_received',
        filterBy: 'all',
      },
    },
    position: { x: 250, y: 0 },
    style: {
      background: '#dbeafe',
      border: '2px solid #2563eb',
      borderRadius: '12px',
      padding: '12px 16px',
      width: 220,
      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    },
  },
  {
    id: 'condition-1',
    data: {
      label: (
        <div className="flex items-center gap-2 px-2">
          <Clock className="size-4 text-orange-600" />
          <div>
            <div className="font-semibold text-sm">Verificar Horário</div>
            <div className="text-xs text-gray-500">Está dentro do horário?</div>
          </div>
        </div>
      ),
      config: {
        name: 'Verificar Horário',
        conditionType: 'business_hours',
        startHour: '09:00',
        endHour: '18:00',
        weekdays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      },
    },
    position: { x: 100, y: 180 },
    sourcePosition: 'bottom',
    targetPosition: 'top',
    style: {
      background: '#fed7aa',
      border: '2px solid #ea580c',
      borderRadius: '12px',
      padding: '12px 16px',
      width: 220,
      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    },
  },
  {
    id: 'action-1',
    type: 'output',
    data: {
      label: (
        <div className="flex items-center gap-2 px-2">
          <Send className="size-4 text-green-600" />
          <div>
            <div className="font-semibold text-sm">Resposta Automática</div>
            <div className="text-xs text-gray-500">Enviar mensagem padrão</div>
          </div>
        </div>
      ),
      config: {
        name: 'Resposta Automática',
        actionType: 'send_message',
        message: 'Olá! Recebemos sua mensagem. Em breve retornaremos.',
      },
    },
    position: { x: 400, y: 180 },
    targetPosition: 'top',
    style: {
      background: '#bbf7d0',
      border: '2px solid #16a34a',
      borderRadius: '12px',
      padding: '12px 16px',
      width: 220,
      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    },
  },
  {
    id: 'action-2',
    type: 'output',
    data: {
      label: (
        <div className="flex items-center gap-2 px-2">
          <Mail className="size-4 text-purple-600" />
          <div>
            <div className="font-semibold text-sm">Enviar Notificação</div>
            <div className="text-xs text-gray-500">Notificar por email</div>
          </div>
        </div>
      ),
      config: {
        name: 'Enviar Notificação',
        actionType: 'send_email',
        email: 'admin@empresa.com',
        subject: 'Nova mensagem recebida fora do horário',
      },
    },
    position: { x: 100, y: 360 },
    targetPosition: 'top',
    style: {
      background: '#e9d5ff',
      border: '2px solid #9333ea',
      borderRadius: '12px',
      padding: '12px 16px',
      width: 220,
      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    },
  },
]

const initialEdges: Edge[] = [
  {
    id: 'e1-2',
    source: 'trigger-1',
    target: 'condition-1',
    animated: true,
    style: { stroke: '#3b82f6', strokeWidth: 2 },
  },
  {
    id: 'e2-3',
    source: 'condition-1',
    target: 'action-1',
    label: 'Sim',
    labelStyle: { fill: '#16a34a', fontWeight: 600 },
    labelBgStyle: { fill: '#dcfce7', fillOpacity: 0.8 },
    animated: true,
    style: { stroke: '#16a34a', strokeWidth: 2 },
  },
  {
    id: 'e2-4',
    source: 'condition-1',
    target: 'action-2',
    label: 'Não',
    labelStyle: { fill: '#9333ea', fontWeight: 600 },
    labelBgStyle: { fill: '#e9d5ff', fillOpacity: 0.8 },
    animated: true,
    style: { stroke: '#9333ea', strokeWidth: 2 },
  },
]

interface NodeConfig {
  name: string
  [key: string]: any
}

// Node Config Drawer Component
function NodeConfigDrawer({
  node,
  isOpen,
  onClose,
  onSave,
}: {
  node: Node | null
  isOpen: boolean
  onClose: () => void
  onSave: (config: NodeConfig) => void
}) {
  const [config, setConfig] = useState<NodeConfig>(node?.data?.config || {})
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    if (node) {
      setConfig(node.data.config || {})
      setHasChanges(false)
    }
  }, [node])

  if (!isOpen || !node) return null

  const getNodeType = (): 'trigger' | 'condition' | 'action' => {
    if (node.type === 'input') return 'trigger'
    if (node.type === 'output') return 'action'
    return 'condition'
  }

  const nodeType = getNodeType()

  const handleSave = () => {
    onSave(config)
    onClose()
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-96 bg-white dark:bg-gray-900 shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            {nodeType === 'trigger' && <MessageSquare className="size-5 text-blue-600" />}
            {nodeType === 'condition' && <Clock className="size-5 text-orange-600" />}
            {nodeType === 'action' && <Settings className="size-5 text-green-600" />}
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Configurar {nodeType === 'trigger' ? 'Gatilho' : nodeType === 'condition' ? 'Condição' : 'Ação'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="size-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Name */}
          <div>
            <LabelTech htmlFor="node-name">Nome</LabelTech>
            <InputTech
              id="node-name"
              value={config.name || ''}
              onChange={(e) => {
                setConfig({ ...config, name: e.target.value })
                setHasChanges(true)
              }}
              placeholder="Nome do passo"
            />
          </div>

          {/* Trigger Config */}
          {nodeType === 'trigger' && (
            <>
              <div>
                <LabelTech htmlFor="trigger-type">Tipo de Gatilho</LabelTech>
                <Select
                  value={config.triggerType || 'message_received'}
                  onValueChange={(value) => {
                    setConfig({ ...config, triggerType: value })
                    setHasChanges(true)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectPopup>
                    <SelectItem value="message_received">Mensagem Recebida</SelectItem>
                    <SelectItem value="new_appointment">Novo Agendamento</SelectItem>
                    <SelectItem value="appointment_cancelled">Agendamento Cancelado</SelectItem>
                    <SelectItem value="scheduled_time">Horário Programado</SelectItem>
                  </SelectPopup>
                </Select>
              </div>

              {config.triggerType === 'message_received' && (
                <div className="mt-4">
                  <LabelTech htmlFor="filter-by">Filtrar por</LabelTech>
                  <Select
                    value={config.filterBy || 'all'}
                    onValueChange={(value) => {
                      setConfig({ ...config, filterBy: value })
                      setHasChanges(true)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectPopup>
                      <SelectItem value="all">Todas as mensagens</SelectItem>
                      <SelectItem value="new_client">Novos clientes</SelectItem>
                      <SelectItem value="existing_client">Clientes existentes</SelectItem>
                      <SelectItem value="specific_keyword">Palavra-chave específica</SelectItem>
                    </SelectPopup>
                  </Select>
                </div>
              )}
            </>
          )}

          {/* Condition Config */}
          {nodeType === 'condition' && (
            <>
              <div>
                <LabelTech htmlFor="condition-type">Tipo de Condição</LabelTech>
                <Select
                  value={config.conditionType || 'business_hours'}
                  onValueChange={(value) => {
                    setConfig({ ...config, conditionType: value })
                    setHasChanges(true)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectPopup>
                    <SelectItem value="business_hours">Horário de Funcionamento</SelectItem>
                    <SelectItem value="has_appointment">Possui Agendamento</SelectItem>
                    <SelectItem value="client_type">Tipo de Cliente</SelectItem>
                    <SelectItem value="message_contains">Mensagem Contém</SelectItem>
                  </SelectPopup>
                </Select>
              </div>

              {config.conditionType === 'business_hours' && (
                <div className="space-y-3 mt-4">
                  <div>
                    <LabelTech htmlFor="start-hour">Horário Início</LabelTech>
                    <InputTech
                      id="start-hour"
                      type="time"
                      value={config.startHour || '09:00'}
                      onChange={(e) => {
                        setConfig({ ...config, startHour: e.target.value })
                        setHasChanges(true)
                      }}
                    />
                  </div>
                  <div>
                    <LabelTech htmlFor="end-hour">Horário Fim</LabelTech>
                    <InputTech
                      id="end-hour"
                      type="time"
                      value={config.endHour || '18:00'}
                      onChange={(e) => {
                        setConfig({ ...config, endHour: e.target.value })
                        setHasChanges(true)
                      }}
                    />
                  </div>
                  <div>
                    <LabelTech>Dias da Semana</LabelTech>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((day, idx) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            const weekdays = config.weekdays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
                            const dayMap = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
                            const newWeekdays = weekdays.includes(dayMap[idx])
                              ? weekdays.filter((d: string) => d !== dayMap[idx])
                              : [...weekdays, dayMap[idx]]
                            setConfig({ ...config, weekdays: newWeekdays })
                            setHasChanges(true)
                          }}
                          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                            (config.weekdays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']).includes(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'][idx])
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                              : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {config.conditionType === 'message_contains' && (
                <div className="mt-4">
                  <LabelTech htmlFor="keyword">Palavra-chave</LabelTech>
                  <InputTech
                    id="keyword"
                    value={config.keyword || ''}
                    onChange={(e) => {
                      setConfig({ ...config, keyword: e.target.value })
                      setHasChanges(true)
                    }}
                    placeholder="Ex: agendamento, cancelar"
                  />
                </div>
              )}
            </>
          )}

          {/* Action Config */}
          {nodeType === 'action' && (
            <>
              <div>
                <LabelTech htmlFor="action-type">Tipo de Ação</LabelTech>
                <Select
                  value={config.actionType || 'send_message'}
                  onValueChange={(value) => {
                    setConfig({ ...config, actionType: value })
                    setHasChanges(true)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectPopup>
                    <SelectItem value="send_message">Enviar Mensagem</SelectItem>
                    <SelectItem value="send_email">Enviar Email</SelectItem>
                    <SelectItem value="create_appointment">Criar Agendamento</SelectItem>
                    <SelectItem value="add_tag">Adicionar Etiqueta</SelectItem>
                    <SelectItem value="assign_to">Atribuir a</SelectItem>
                  </SelectPopup>
                </Select>
              </div>

              {config.actionType === 'send_message' && (
                <div className="mt-4">
                  <LabelTech htmlFor="message">Mensagem</LabelTech>
                  <textarea
                    id="message"
                    value={config.message || ''}
                    onChange={(e) => {
                      setConfig({ ...config, message: e.target.value })
                      setHasChanges(true)
                    }}
                    placeholder="Digite a mensagem a ser enviada..."
                    rows={4}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow resize-y"
                  />
                </div>
              )}

              {config.actionType === 'send_email' && (
                <div className="space-y-3 mt-4">
                  <div>
                    <LabelTech htmlFor="email">Email</LabelTech>
                    <InputTech
                      id="email"
                      type="email"
                      value={config.email || ''}
                      onChange={(e) => {
                        setConfig({ ...config, email: e.target.value })
                        setHasChanges(true)
                      }}
                      placeholder="admin@empresa.com"
                    />
                  </div>
                  <div>
                    <LabelTech htmlFor="subject">Assunto</LabelTech>
                    <InputTech
                      id="subject"
                      value={config.subject || ''}
                      onChange={(e) => {
                        setConfig({ ...config, subject: e.target.value })
                        setHasChanges(true)
                      }}
                      placeholder="Assunto do email"
                    />
                  </div>
                </div>
              )}

              {config.actionType === 'assign_to' && (
                <div className="mt-4">
                  <LabelTech htmlFor="assignee">Atribuir para</LabelTech>
                  <Select
                    value={config.assignee || ''}
                    onValueChange={(value) => {
                      setConfig({ ...config, assignee: value })
                      setHasChanges(true)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um membro" />
                    </SelectTrigger>
                    <SelectPopup>
                      <SelectItem value="member-1">João Silva</SelectItem>
                      <SelectItem value="member-2">Maria Santos</SelectItem>
                      <SelectItem value="member-3">Pedro Lima</SelectItem>
                    </SelectPopup>
                  </Select>
                </div>
              )}
            </>
          )}

          {/* Advanced */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <details className="group">
              <summary className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer flex items-center gap-2">
                <Settings className="size-4" />
                Avançado
              </summary>
              <div className="mt-3 space-y-3">
                <div>
                  <LabelTech htmlFor="delay">Atraso (segundos)</LabelTech>
                  <InputTech
                    id="delay"
                    type="number"
                    min="0"
                    value={config.delay || 0}
                    onChange={(e) => {
                      setConfig({ ...config, delay: parseInt(e.target.value) || 0 })
                      setHasChanges(true)
                    }}
                  />
                </div>
                <div>
                  <LabelTech htmlFor="retry">Tentativas em caso de falha</LabelTech>
                  <InputTech
                    id="retry"
                    type="number"
                    min="0"
                    max="5"
                    value={config.retry || 0}
                    onChange={(e) => {
                      setConfig({ ...config, retry: parseInt(e.target.value) || 0 })
                      setHasChanges(true)
                    }}
                  />
                </div>
              </div>
            </details>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
          <TechButton variant="outline" onClick={onClose}>
            Cancelar
          </TechButton>
          <TechButton
            variant="solid"
            onClick={handleSave}
            disabled={!hasChanges}
          >
            Aplicar
          </TechButton>
        </div>
      </div>
    </>
  )
}

function AutomationEditor() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [instance, setInstance] = useState<any>(null)

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node)
    setIsDrawerOpen(true)
  }, [])

  const onPaneClick = useCallback(() => {
    setSelectedNode(null)
    setIsDrawerOpen(false)
  }, [])

  const addNode = useCallback((type: 'trigger' | 'condition' | 'action') => {
    const id = `${type}-${Date.now()}`
    const defaultConfig = {
      name: `Nov${type === 'action' ? 'a' : 'o'} ${type === 'trigger' ? 'Gatilho' : type === 'condition' ? 'Condição' : 'Ação'}`,
      ...(type === 'trigger' && { triggerType: 'message_received' }),
      ...(type === 'condition' && { conditionType: 'business_hours' }),
      ...(type === 'action' && { actionType: 'send_message' }),
    }

    const newNode: Node = {
      id,
      data: {
        label: (
          <div className="flex items-center gap-2 px-2">
            {type === 'trigger' && <MessageSquare className="size-4 text-blue-600" />}
            {type === 'condition' && <Clock className="size-4 text-orange-600" />}
            {type === 'action' && <Settings className="size-4 text-green-600" />}
            <div>
              <div className="font-semibold text-sm">{defaultConfig.name}</div>
              <div className="text-xs text-gray-500">Clique para configurar</div>
            </div>
          </div>
        ),
        config: defaultConfig,
      },
      position: { x: Math.random() * 500 + 100, y: Math.random() * 300 + 100 },
      style: {
        background: type === 'trigger' ? '#dbeafe' : type === 'condition' ? '#fed7aa' : '#bbf7d0',
        border: `2px solid ${type === 'trigger' ? '#2563eb' : type === 'condition' ? '#ea580c' : '#16a34a'}`,
        borderRadius: '12px',
        padding: '12px 16px',
        width: 220,
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
      },
    }
    setNodes((nds) => [...nds, newNode])
  }, [setNodes])

  const deleteNode = useCallback(() => {
    if (selectedNode) {
      setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id))
      setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id))
      setSelectedNode(null)
      setIsDrawerOpen(false)
    }
  }, [selectedNode, setNodes, setEdges])

  const saveNodeConfig = useCallback((config: NodeConfig) => {
    if (selectedNode) {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === selectedNode.id
            ? {
                ...node,
                data: {
                  ...node.data,
                  config,
                },
              }
            : node
        )
      )
    }
  }, [selectedNode, setNodes])

  const saveAutomation = useCallback(() => {
    console.log('Saving automation:', { nodes, edges })
    setIsRunning(true)
    setTimeout(() => {
      setIsRunning(false)
      alert('Automação salva com sucesso!')
    }, 1000)
  }, [nodes, edges])

  const runTest = useCallback(() => {
    setIsRunning(true)
    setTimeout(() => {
      setIsRunning(false)
      alert('Teste executado com sucesso!')
    }, 1500)
  }, [])

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between px-2">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Settings className="size-5" />
            Editor de Automação
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Clique em um nó para configurar • Arraste para conectar
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedNode && (
            <TechButton variant="outline" onClick={deleteNode} className="gap-2">
              <Trash2 className="size-4" />
              Remover
            </TechButton>
          )}
          <TechButton variant="outline" onClick={runTest} disabled={isRunning} className="gap-2">
            <Play className="size-4" />
            {isRunning ? 'Executando...' : 'Testar'}
          </TechButton>
          <TechButton variant="solid" onClick={saveAutomation} disabled={isRunning} className="gap-2">
            <Save className="size-4" />
            Salvar
          </TechButton>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Adicionar:</span>
          <button
            onClick={() => addNode('trigger')}
            className="px-3 py-1.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors flex items-center gap-1.5"
          >
            <MessageSquare className="size-3.5" />
            Gatilho
          </button>
          <button
            onClick={() => addNode('condition')}
            className="px-3 py-1.5 text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-md hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors flex items-center gap-1.5"
          >
            <Clock className="size-3.5" />
            Condição
          </button>
          <button
            onClick={() => addNode('action')}
            className="px-3 py-1.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors flex items-center gap-1.5"
          >
            <Settings className="size-3.5" />
            Ação
          </button>
        </div>
      </div>

      {/* React Flow Canvas */}
      <div ref={reactFlowWrapper} className="flex-1 bg-white dark:bg-gray-900 rounded-lg border-2 border-gray-200 dark:border-gray-700 overflow-hidden relative" style={{ minHeight: '500px' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          onInit={setInstance}
          fitView
          minZoom={0.5}
          maxZoom={2}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        >
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#cbd5e1" />
          <Controls
            className="[&>button]:bg-white [&>button]:dark:bg-gray-700 [&>button]:border-gray-200 [&>button]:dark:border-gray-600 [&>button]:hover:bg-gray-50 [&>button]:dark:hover:bg-gray-600 [&>button]:text-gray-700 [&>button]:dark:text-gray-300"
          />
          <MiniMap
            nodeColor={(node) => {
              if (node.id?.startsWith('trigger')) return '#dbeafe'
              if (node.id?.startsWith('condition')) return '#fed7aa'
              if (node.id?.startsWith('action')) return '#bbf7d0'
              return '#e9d5ff'
            }}
            className="!bg-white !dark:bg-gray-800 !border !border-gray-200 !dark:border-gray-700"
            maskColor="rgba(0, 0, 0, 0.05)"
          />
          <Panel position="top-right" className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3">
            <div className="text-xs space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-blue-200 border-2 border-blue-600"></div>
                <span className="text-gray-600 dark:text-gray-400">Gatilho</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-orange-200 border-2 border-orange-600"></div>
                <span className="text-gray-600 dark:text-gray-400">Condição</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-green-200 border-2 border-green-600"></div>
                <span className="text-gray-600 dark:text-gray-400">Ação</span>
              </div>
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {/* Node Config Drawer */}
      <NodeConfigDrawer
        node={selectedNode}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false)
          setSelectedNode(null)
        }}
        onSave={saveNodeConfig}
      />
    </div>
  )
}

export default function AutomationPage() {
  const [automations, setAutomations] = useState([
    {
      id: '1',
      name: 'Resposta automática fora do horário',
      active: true,
      lastRun: '2024-01-15 14:30',
      triggers: 12,
    },
    {
      id: '2',
      name: 'Lembrete de agendamento',
      active: true,
      lastRun: '2024-01-15 10:00',
      triggers: 8,
    },
  ])
  const [showEditor, setShowEditor] = useState(false)
  const [editingAutomation, setEditingAutomation] = useState<string | null>(null)

  const handleEdit = (id: string) => {
    setEditingAutomation(id)
    setShowEditor(true)
  }

  if (showEditor) {
    return (
      <div className="h-full">
        <div className="mb-4">
          <button
            onClick={() => {
              setShowEditor(false)
              setEditingAutomation(null)
            }}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center gap-1"
          >
            ← Voltar para lista de automações
          </button>
        </div>
        <ReactFlowProvider>
          <AutomationEditor />
        </ReactFlowProvider>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Automação"
        subtitle="Crie fluxos de automação para mensagens e agendamentos."
        breadcrumbs={[
          { label: 'Configurações', href: '/settings' },
          { label: 'Automação' },
        ]}
        actions={
          <TechButton
            variant="solid"
            onClick={() => {
              setEditingAutomation(null)
              setShowEditor(true)
            }}
            className="gap-2"
          >
            <Plus className="size-4" />
            Nova Automação
          </TechButton>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CardTech className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Settings className="size-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {automations.length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total de Automações</p>
            </div>
          </div>
        </CardTech>
        <CardTech className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="size-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {automations.filter(a => a.active).length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Ativas</p>
            </div>
          </div>
        </CardTech>
        <CardTech className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Play className="size-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {automations.reduce((sum, a) => sum + a.triggers, 0)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Execuções Hoje</p>
            </div>
          </div>
        </CardTech>
      </div>

      {/* Active Automations List */}
      <CardTech className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Automações Configuradas
        </h2>
        <div className="space-y-3">
          {automations.map((automation) => (
            <div
              key={automation.id}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${automation.active ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-200 dark:bg-gray-700'}`}>
                  <Settings className={`size-5 ${automation.active ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`} />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {automation.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Última execução: {automation.lastRun} • {automation.triggers} execuções hoje
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <TechButton
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(automation.id)}
                >
                  Editar Fluxo
                </TechButton>
                <button
                  className={`w-12 h-6 rounded-full transition-colors ${
                    automation.active
                      ? 'bg-green-500'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                  onClick={() => {
                    setAutomations(automations.map(a =>
                      a.id === automation.id ? { ...a, active: !a.active } : a
                    ))
                  }}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      automation.active ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>
          ))}
        </div>
      </CardTech>

      {/* Getting Started Card */}
      <CardTech className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Settings className="size-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
              Comece a criar suas automações
            </h3>
            <div className="space-y-1 text-sm text-blue-800 dark:text-blue-400">
              <p>• <strong>Gatilhos:</strong> Mensagens recebidas, novos agendamentos, horários específicos</p>
              <p>• <strong>Condições:</strong> Verificar horário, validar informações, filtrar por tipo</p>
              <p>• <strong>Ações:</strong> Enviar mensagens, criar agendamentos, notificar por email</p>
            </div>
          </div>
        </div>
      </CardTech>
    </div>
  )
}
