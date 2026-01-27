/**
 * Workspace Switcher Component
 *
 * A dropdown component for switching between workspaces.
 * Shows the current workspace and allows creating new workspaces.
 * Integrates with @oxlayer/capabilities-web-state for local workspace support.
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus, Home, Building2, Users, Check, WifiOff, Download, Upload } from 'lucide-react';
import { useWorkspace } from '@/lib/workspace';
import type { WorkspaceType } from '@/lib/workspace';
import { cn } from '@/lib/utils';
import { exportManager, importManager } from '@oxlayer/capabilities-web-state/export';

// Workspace type icons
const WORKSPACE_ICONS: Record<WorkspaceType, React.ReactNode> = {
  personal: <Home className="h-4 w-4" />,
  crm: <Building2 className="h-4 w-4" />,
  recruiting: <Users className="h-4 w-4" />,
};

// Workspace type labels
const WORKSPACE_LABELS: Record<WorkspaceType, string> = {
  personal: 'Personal',
  crm: 'CRM',
  recruiting: 'Recruiting',
};

export function WorkspaceSwitcher() {
  const {
    currentWorkspace,
    workspaces,
    switchWorkspace,
    createWorkspace,
    isLoading,
    isLocalWorkspace,
  } = useWorkspace();

  const [isOpen, setIsOpen] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceType, setNewWorkspaceType] = useState<WorkspaceType>('personal');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowCreateForm(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;

    try {
      await createWorkspace({
        name: newWorkspaceName.trim(),
        type: newWorkspaceType,
      });
      setNewWorkspaceName('');
      setShowCreateForm(false);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to create workspace:', error);
    }
  };

  const handleExport = async () => {
    if (!currentWorkspace) return;

    try {
      await exportManager.downloadExport(
        currentWorkspace.id,
        {
          getWorkspace: (id: string) => workspaces.find((w) => w.id === id) as Record<string, unknown> | undefined,
        }
      );
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to export workspace:', error);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await importManager.importFromFile(file, {
        addWorkspace: (workspace: Record<string, unknown>) => {
          // Add to local storage
          const localWorkspacesStr = localStorage.getItem('oxlayer_local_workspaces');
          const localWorkspaces = localWorkspacesStr ? JSON.parse(localWorkspacesStr) : [];
          localWorkspaces.push(workspace);
          localStorage.setItem('oxlayer_local_workspaces', JSON.stringify(localWorkspaces));
        },
        saveWorkspaceData: (_workspaceId: string, _data: { entities: Record<string, unknown>; settings: Record<string, unknown> }) => {
          // Data is already saved by addWorkspace
        },
      });

      // Refresh page to show new workspace
      window.location.reload();
    } catch (error) {
      console.error('Failed to import workspace:', error);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-2 py-1 rounded-md">
        <div className="w-5 h-5 bg-gray-200 rounded animate-pulse" />
        <div className="w-24 h-4 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  const isCurrentLocal = currentWorkspace && isLocalWorkspace(currentWorkspace.id);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-gray-100 transition-colors"
      >
        <div
          className="w-5 h-5 rounded flex items-center justify-center text-white text-xs"
          style={{ backgroundColor: currentWorkspace?.color || '#6366f1' }}
        >
          {currentWorkspace ? WORKSPACE_ICONS[currentWorkspace.type] : <Home className="h-3 w-3" />}
        </div>
        <span className="text-sm font-medium text-gray-700">
          {currentWorkspace?.name || 'Select Workspace'}
        </span>
        {/* Local workspace indicator */}
        {isCurrentLocal && (
          <WifiOff className="h-3 w-3 text-gray-400" />
        )}
        <ChevronDown className="h-3 w-3 text-gray-400" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-2">
            {/* Current Workspace */}
            {currentWorkspace && (
              <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase">
                Current Workspace
                {isCurrentLocal && (
                  <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[10px]">
                    <WifiOff className="h-2.5 w-2.5" />
                    Local
                  </span>
                )}
              </div>
            )}

            {/* Workspace List */}
            <div className="max-h-48 overflow-y-auto">
              {workspaces.map((workspace) => (
                <button
                  key={workspace.id}
                  onClick={() => {
                    switchWorkspace(workspace.id);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center gap-2 px-2 py-2 rounded-md transition-colors',
                    'hover:bg-gray-100',
                    workspace.id === currentWorkspace?.id && 'bg-gray-100'
                  )}
                >
                  <div
                    className="w-5 h-5 rounded flex items-center justify-center text-white text-xs shrink-0"
                    style={{ backgroundColor: workspace.color || '#6366f1' }}
                  >
                    {WORKSPACE_ICONS[workspace.type]}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium text-gray-700">{workspace.name}</div>
                    <div className="text-xs text-gray-500">{WORKSPACE_LABELS[workspace.type]}</div>
                  </div>
                  {/* Local indicator */}
                  {isLocalWorkspace(workspace.id) && (
                    <WifiOff className="h-3 w-3 text-gray-400" />
                  )}
                  {workspace.id === currentWorkspace?.id && (
                    <Check className="h-4 w-4 text-gray-500" />
                  )}
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="my-2 border-t border-gray-200" />

            {/* Create New Workspace */}
            {showCreateForm ? (
              <form onSubmit={handleCreateWorkspace} className="space-y-2 p-2">
                <input
                  type="text"
                  placeholder="Workspace name..."
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <select
                  value={newWorkspaceType}
                  onChange={(e) => setNewWorkspaceType(e.target.value as WorkspaceType)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="personal">Personal</option>
                  <option value="crm">CRM</option>
                  <option value="recruiting">Recruiting</option>
                </select>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 px-3 py-1.5 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 transition-colors"
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewWorkspaceName('');
                    }}
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setShowCreateForm(true)}
                className="w-full flex items-center gap-2 px-2 py-2 rounded-md hover:bg-gray-100 transition-colors text-left"
              >
                <Plus className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Create new workspace</span>
              </button>
            )}

            {/* Export/Import for local workspaces */}
            {currentWorkspace && isCurrentLocal && (
              <>
                <div className="my-2 border-t border-gray-200" />
                <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase">
                  Workspace Data
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleExport}
                    className="flex items-center justify-center gap-1.5 px-2 py-2 rounded-md hover:bg-gray-100 transition-colors text-sm text-gray-600"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Export
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center gap-1.5 px-2 py-2 rounded-md hover:bg-gray-100 transition-colors text-sm text-gray-600"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Import
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".oxlayer,.json"
                  className="hidden"
                  onChange={handleImport}
                />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
