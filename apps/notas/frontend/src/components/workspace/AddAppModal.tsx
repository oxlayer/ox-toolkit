/**
 * Add App Modal
 *
 * Allows users to add app templates to their current workspace.
 * Uses a portal to render outside the sidebar hierarchy.
 * Features search and a larger template library.
 */

import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Building2,
  Users,
  Check,
  X,
  Search,
  FolderKanban,
  Headphones,
  Package,
  FileText,
  Calendar,
  Megaphone,
  TrendingUp,
  ClipboardCheck,
  Target,
  ShoppingCart,
  MessageSquare,
  Database,
  BarChart,
  Shield,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWorkspace } from '@/lib/workspace';
import { cn } from '@/lib/utils';

interface AddAppModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDataModelClick?: () => void;
}

interface AppTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  features: {
    contacts?: boolean;
    companies?: boolean;
    deals?: boolean;
    candidates?: boolean;
    positions?: boolean;
    pipeline?: boolean;
    projects?: boolean;
    tickets?: boolean;
    inventory?: boolean;
    invoices?: boolean;
    events?: boolean;
    campaigns?: boolean;
    analytics?: boolean;
    tasks?: boolean;
    goals?: boolean;
    orders?: boolean;
    chat?: boolean;
    reports?: boolean;
    automation?: boolean;
  };
  color: string;
  comingSoon?: boolean;
  isDirectLink?: boolean;
}

const APP_TEMPLATES: AppTemplate[] = [
  // Sales & CRM
  {
    id: 'crm',
    name: 'CRM',
    description: 'Gerencie contatos, empresas e oportunidades de negócios',
    category: 'Vendas',
    icon: <Building2 className="h-6 w-6" />,
    features: { contacts: true, companies: true, deals: true, pipeline: true },
    color: 'bg-blue-500',
    comingSoon: false,
  },
  {
    id: 'sales',
    name: 'Vendas',
    description: 'Acompanhe seu pipeline de vendas e metas',
    category: 'Vendas',
    icon: <TrendingUp className="h-6 w-6" />,
    features: { deals: true, pipeline: true, goals: true, analytics: true },
    color: 'bg-emerald-500',
    comingSoon: true,
  },
  {
    id: 'ecommerce',
    name: 'E-commerce',
    description: 'Gerencie pedidos, estoque e clientes',
    category: 'Vendas',
    icon: <ShoppingCart className="h-6 w-6" />,
    features: {
      contacts: true,
      companies: true,
      orders: true,
      inventory: true,
      invoices: true,
    },
    color: 'bg-cyan-500',
    comingSoon: true,
  },

  // HR & Recruiting
  {
    id: 'recruiting',
    name: 'Recrutamento',
    description: 'Gerencie vagas e candidatos',
    category: 'RH',
    icon: <Users className="h-6 w-6" />,
    features: { candidates: true, positions: true, pipeline: true },
    color: 'bg-purple-500',
    comingSoon: false,
  },
  {
    id: 'hr',
    name: 'Recursos Humanos',
    description: 'Gerencie funcionários, folha e benefícios',
    category: 'RH',
    icon: <Shield className="h-6 w-6" />,
    features: { contacts: true, reports: true },
    color: 'bg-indigo-500',
    comingSoon: true,
  },

  // Project Management
  {
    id: 'projects',
    name: 'Projetos',
    description: 'Organize tarefas e projetos em equipe',
    category: 'Projetos',
    icon: <FolderKanban className="h-6 w-6" />,
    features: { projects: true, tasks: true, pipeline: true },
    color: 'bg-orange-500',
    comingSoon: true,
  },
  {
    id: 'tasks',
    name: 'Tarefas',
    description: 'Gerencie suas tarefas diárias',
    category: 'Projetos',
    icon: <ClipboardCheck className="h-6 w-6" />,
    features: { tasks: true, goals: true },
    color: 'bg-amber-500',
    comingSoon: true,
  },

  // Customer Support
  {
    id: 'helpdesk',
    name: 'Help Desk',
    description: 'Atenda solicitações de suporte ao cliente',
    category: 'Suporte',
    icon: <Headphones className="h-6 w-6" />,
    features: { contacts: true, tickets: true, pipeline: true },
    color: 'bg-rose-500',
    comingSoon: true,
  },
  {
    id: 'chat',
    name: 'Chat ao Vivo',
    description: 'Chat em tempo real com clientes',
    category: 'Suporte',
    icon: <MessageSquare className="h-6 w-6" />,
    features: { contacts: true, chat: true, tickets: true },
    color: 'bg-pink-500',
    comingSoon: true,
  },

  // Operations
  {
    id: 'inventory',
    name: 'Estoque',
    description: 'Controle seu inventário e produtos',
    category: 'Operações',
    icon: <Package className="h-6 w-6" />,
    features: { inventory: true, reports: true },
    color: 'bg-teal-500',
    comingSoon: true,
  },
  {
    id: 'invoicing',
    name: 'Faturamento',
    description: 'Crie e gerencie faturas e pagamentos',
    category: 'Operações',
    icon: <FileText className="h-6 w-6" />,
    features: { companies: true, invoices: true, reports: true },
    color: 'bg-lime-500',
    comingSoon: true,
  },

  // Marketing
  {
    id: 'events',
    name: 'Eventos',
    description: 'Organize e gerencie eventos',
    category: 'Marketing',
    icon: <Calendar className="h-6 w-6" />,
    features: { events: true, contacts: true, tasks: true },
    color: 'bg-red-500',
    comingSoon: true,
  },
  {
    id: 'marketing',
    name: 'Marketing',
    description: 'Campanhas e automações de marketing',
    category: 'Marketing',
    icon: <Megaphone className="h-6 w-6" />,
    features: { campaigns: true, contacts: true, automation: true, analytics: true },
    color: 'bg-violet-500',
    comingSoon: true,
  },

  // Analytics & Tools
  {
    id: 'analytics',
    name: 'Analytics',
    description: 'Dashboards e relatórios personalizados',
    category: 'Ferramentas',
    icon: <BarChart className="h-6 w-6" />,
    features: { analytics: true, reports: true },
    color: 'bg-sky-500',
    comingSoon: true,
  },
  {
    id: 'database',
    name: 'Base de Dados',
    description: 'Gerencie dados personalizados',
    category: 'Ferramentas',
    icon: <Database className="h-6 w-6" />,
    features: { reports: true },
    color: 'bg-slate-500',
    isDirectLink: true,
  },
  {
    id: 'automation',
    name: 'Automação',
    description: 'Crie fluxos de trabalho automatizados',
    category: 'Ferramentas',
    icon: <Zap className="h-6 w-6" />,
    features: { automation: true, tasks: true },
    color: 'bg-yellow-500',
    comingSoon: true,
  },
  {
    id: 'goals',
    name: 'Metas',
    description: 'Defina e acompanhe objetivos',
    category: 'Ferramentas',
    icon: <Target className="h-6 w-6" />,
    features: { goals: true, analytics: true, tasks: true },
    color: 'bg-fuchsia-500',
    comingSoon: true,
  },
];

const CATEGORIES = ['Todos', 'Vendas', 'RH', 'Projetos', 'Suporte', 'Operações', 'Marketing', 'Ferramentas'];

export function AddAppModal({ open, onOpenChange, onDataModelClick }: AddAppModalProps) {
  const { currentWorkspace, updateWorkspaceFeatures } = useWorkspace();
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  // Reset selection when modal opens
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedApps([]);
      setSearchQuery('');
      setSelectedCategory('Todos');
    }
    onOpenChange(newOpen);
  };

  const toggleApp = (appId: string) => {
    setSelectedApps((prev) =>
      prev.includes(appId) ? prev.filter((id) => id !== appId) : [...prev, appId]
    );
  };

  const handleAddApps = async () => {
    if (!currentWorkspace || selectedApps.length === 0) return;

    setIsAdding(true);
    try {
      // Merge all selected features
      const mergedFeatures = {
        ...currentWorkspace.flags.features,
      };

      // Add features from selected apps
      selectedApps.forEach((appId) => {
        const app = APP_TEMPLATES.find((a) => a.id === appId);
        if (app) {
          Object.assign(mergedFeatures, app.features);
        }
      });

      console.log('[AddAppModal] Adding apps:', selectedApps, 'Features:', mergedFeatures);

      // Update workspace features
      await updateWorkspaceFeatures(currentWorkspace.id, mergedFeatures);

      handleOpenChange(false);
    } catch (error) {
      console.error('[AddAppModal] Failed to add apps:', error);
    } finally {
      setIsAdding(false);
    }
  };

  // Filter apps by search and category
  const filteredApps = useMemo(() => {
    return APP_TEMPLATES.filter((app) => {
      const matchesSearch =
        searchQuery === '' ||
        app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === 'Todos' || app.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  if (!open) return null;

  return createPortal(
    (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50"
          onClick={() => handleOpenChange(false)}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[85vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b shrink-0">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Ativar módulo</h2>
              <p className="text-sm text-gray-500 mt-1">
                Escolha funcionalidades para adicionar ao seu workspace
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleOpenChange(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Search and Filter */}
          <div className="p-6 border-b shrink-0 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar módulos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
              />
            </div>

            {/* Categories */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={cn(
                    'px-3 py-1.5 text-sm font-medium rounded-full whitespace-nowrap transition-colors',
                    selectedCategory === category
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto p-6 lg:min-h-[400px] lg:max-h-[400px]">
            {filteredApps.length === 0 ? (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum app encontrado</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredApps.map((app) => {
                  const isSelected = selectedApps.includes(app.id);
                  const isEnabled = Object.entries(app.features).some(
                    ([feature, enabled]) =>
                      enabled && currentWorkspace?.flags.features[feature as keyof typeof currentWorkspace.flags.features]
                  );

                  if (app.isDirectLink) {
                    return (
                      <button
                        key={app.id}
                        onClick={() => {
                          onDataModelClick?.();
                          onOpenChange(false);
                        }}
                        className="p-4 rounded-lg border-2 border-blue-400 bg-blue-50 hover:bg-blue-100 text-left transition-all hover:shadow-md relative"
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              'w-12 h-12 rounded-lg flex items-center justify-center text-white shrink-0',
                              app.color
                            )}
                          >
                            {app.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-gray-900">{app.name}</h3>
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                {app.category}
                              </span>
                              <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                                Abrir
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{app.description}</p>
                          </div>
                        </div>
                      </button>
                    );
                  }

                  return (
                    <button
                      key={app.id}
                      onClick={() => {
                        if (app.isDirectLink) {
                          onDataModelClick?.();
                          onOpenChange(false);
                        } else if (!app.comingSoon) {
                          toggleApp(app.id);
                        }
                      }}
                      disabled={app.comingSoon}
                      className={cn(
                        'p-4 rounded-lg border-2 text-left transition-all hover:shadow-md relative',
                        app.isDirectLink
                          ? 'border-blue-400 bg-blue-50 hover:bg-blue-100'
                          : isSelected
                            ? 'border-red-400 bg-red-50'
                            : 'border-gray-200 hover:border-gray-300 bg-white',
                        app.comingSoon && 'opacity-75 cursor-not-allowed'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            'w-12 h-12 rounded-lg flex items-center justify-center text-white shrink-0',
                            app.color
                          )}
                        >
                          {app.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-gray-900">{app.name}</h3>
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                              {app.category}
                            </span>
                            {app.comingSoon && (
                              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                                Em breve
                              </span>
                            )}
                            {!app.comingSoon && isEnabled && (
                              <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
                                Ativo
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{app.description}</p>
                        </div>
                      </div>
                      {isSelected && !app.comingSoon && (
                        <div className="absolute top-2 right-2">
                          <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                            <Check className="h-4 w-4 text-white" />
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t bg-gray-50 shrink-0">
            <p className="text-sm text-gray-500">
              {selectedApps.length > 0 && `${selectedApps.length} app${selectedApps.length !== 1 ? 's' : ''} selecionado${selectedApps.length !== 1 ? 's' : ''}`}
            </p>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => handleOpenChange(false)}
                disabled={isAdding}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleAddApps}
                disabled={selectedApps.length === 0 || isAdding}
                className="bg-red-400 hover:bg-red-500 text-white"
              >
                {isAdding
                  ? 'Adicionando...'
                  : `Adicionar${selectedApps.length > 0 ? ` ${selectedApps.length}` : ''}`}
              </Button>
            </div>
          </div>
        </div>
      </div>
    ),
    document.body
  );
}
