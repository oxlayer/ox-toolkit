import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, Sparkles, Users, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWorkspace } from '@/lib/workspace';
import type { WorkspaceType } from '@/lib/workspace/api';

interface WorkspaceOnboardingModalProps {
  onClose: () => void;
  onDismiss?: () => void;
}

interface WorkspaceTemplate {
  type: WorkspaceType;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  features: string[];
}

const WORKSPACE_TEMPLATES: WorkspaceTemplate[] = [
  {
    type: 'personal',
    name: 'Personal',
    description: 'Organize your tasks, projects, and daily activities',
    icon: <Sparkles className="w-6 h-6" />,
    color: 'bg-purple-500',
    features: ['Tasks & Projects', 'Daily Planning', 'Personal Goals'],
  },
  {
    type: 'crm',
    name: 'CRM & Sales',
    description: 'Manage contacts, companies, deals, and sales pipeline',
    icon: <Users className="w-6 h-6" />,
    color: 'bg-blue-500',
    features: ['Contact Management', 'Company Tracking', 'Deal Pipeline', 'Sales Reports'],
  },
  {
    type: 'recruiting',
    name: 'Recruiting',
    description: 'Track candidates, positions, and hiring pipeline',
    icon: <Briefcase className="w-6 h-6" />,
    color: 'bg-green-500',
    features: ['Candidate Tracking', 'Position Management', 'Hiring Pipeline', 'Interview Scheduling'],
  },
];

export function WorkspaceOnboardingModal({ onClose, onDismiss }: WorkspaceOnboardingModalProps) {
  const { createWorkspace } = useWorkspace();
  const [selectedTemplate, setSelectedTemplate] = useState<WorkspaceType | null>(null);
  const [workspaceName, setWorkspaceName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const selectedTemplateData = WORKSPACE_TEMPLATES.find(t => t.type === selectedTemplate);

  // Log when modal renders
  console.log('[WorkspaceOnboardingModal] Rendering', { selectedTemplate, workspaceName, isCreating });

  const handleCreate = async () => {
    if (!selectedTemplate) return;

    setIsCreating(true);
    try {
      const name = workspaceName.trim() || selectedTemplateData?.name || 'My Workspace';
      await createWorkspace({
        name,
        type: selectedTemplate,
      });
      onClose();
    } catch (error) {
      console.error('Failed to create workspace:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    onDismiss?.();
    onClose();
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Create Your Workspace</h2>
            <p className="text-sm text-gray-500">Choose a template to get started</p>
          </div>
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {WORKSPACE_TEMPLATES.map((template) => (
              <button
                key={template.type}
                onClick={() => {
                  setSelectedTemplate(template.type);
                  setWorkspaceName(template.name);
                }}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  selectedTemplate === template.type
                    ? 'border-red-500 bg-red-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${template.color} text-white`}>
                    {template.icon}
                  </div>
                  {selectedTemplate === template.type && (
                    <div className="ml-auto">
                      <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
                <p className="text-xs text-gray-500 mb-3">{template.description}</p>
                <ul className="space-y-1">
                  {template.features.map((feature) => (
                    <li key={feature} className="text-xs text-gray-600 flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-gray-400" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </div>

          {selectedTemplate && selectedTemplateData && (
            <div className="bg-gray-50 rounded-xl p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Workspace Name
              </label>
              <input
                type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                placeholder={selectedTemplateData.name}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                autoFocus
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
          <p className="text-xs text-gray-500">
            You can create more workspaces later
          </p>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!selectedTemplate || isCreating}
              className="bg-red-400 hover:bg-red-500 text-white"
            >
              {isCreating ? 'Creating...' : 'Create Workspace'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  // Use portal to render modal at document.body level
  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
}
