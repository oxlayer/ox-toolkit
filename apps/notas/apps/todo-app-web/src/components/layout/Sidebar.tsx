import { Inbox, Calendar, CalendarDays, Search, Grid2X2, PlusCircle, ChevronDown, PanelRight, Bell, AudioLines, LogIn, LogOut, Building2, Users, Briefcase, Settings, Lock, Puzzle, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth, useAuthRequired } from '@/lib/auth';
import { ProjectsList } from '@/components/projects';
import { WorkspaceSwitcher, AddAppModal } from '@/components/workspace';
import { FeatureGuard } from '@/lib/workspace/workspace-context';
import { DataPortabilityMenu } from '@/components/storage';
import { useFailedSyncsCount } from '@/components/ui/FailedSyncBanner';
import { cn } from '@/lib/utils';
import type { Project } from '@/types';

interface SidebarProps {
  currentView: string;
  currentProject?: { id: string; sectionId?: string } | null;
  onViewChange: (view: string, project?: { id: string; sectionId?: string } | null) => void;
  sidebarCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

import { ProductivityModal } from '@/components/productivity';
import { useState } from 'react';

export function Sidebar({ currentView, currentProject, onViewChange, sidebarCollapsed, onToggleCollapse }: SidebarProps) {
  const { actor, isAuthenticated, login, logout } = useAuth();
  const { requireAuth } = useAuthRequired();
  const [productivityOpen, setProductivityOpen] = useState(false);
  const [addAppOpen, setAddAppOpen] = useState(false);
  const failedSyncsCount = useFailedSyncsCount();




  const handleProjectSelect = (project: Project) => {
    onViewChange('project', { id: project.id });
  };

  const handleViewChange = (view: string) => {
    onViewChange(view, null);
  };

  return (
    <aside className="w-[280px] bg-[#fafafa] flex flex-col h-screen sticky top-0 text-gray-700">
      {/* Header */}
      <div className="p-3 flex items-center justify-between">
        {isAuthenticated ? (
          <div className="flex items-center gap-2">
            <WorkspaceSwitcher />
            <div
              className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-1 rounded-md transition-colors"
              onClick={() => setProductivityOpen(true)}
            >
              <div className="w-6 h-6 rounded-full bg-orange-500 overflow-hidden flex items-center justify-center text-white text-xs font-bold">
                {actor && 'name' in actor && actor.name ? actor.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <ChevronDown className="h-3 w-3 text-gray-400" />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-1 rounded-md transition-colors" onClick={() => login()}>
            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
              <LogIn className="h-3 w-3 text-gray-500" />
            </div>
            <span className="text-sm font-medium text-gray-700">Entrar</span>
          </div>
        )}
        <div className="flex items-center gap-1 text-gray-400">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 hover:text-gray-600 relative"
            onClick={() => handleViewChange('notifications')}
          >
            <Bell className="h-4 w-4" />
            {failedSyncsCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 flex items-center justify-center text-xs font-bold bg-red-500 text-white rounded-full">
                {failedSyncsCount > 9 ? '9+' : failedSyncsCount}
              </span>
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 hover:text-gray-600"
            onClick={onToggleCollapse}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <PanelRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Add Task Button */}
      <div className="px-3 mb-2 flex items-center gap-2">
        <button className="flex-1 flex items-center gap-2 text-red-500 hover:bg-red-50 p-2 rounded-md transition-colors font-semibold text-sm">
          <PlusCircle className="h-6 w-6 fill-red-500 text-white" />
          Adicionar tarefa
        </button>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-9 w-9",
            isAuthenticated
              ? "text-red-400 hover:text-red-500 hover:bg-red-50"
              : "text-gray-400 hover:text-gray-500 hover:bg-gray-100 relative"
          )}
          onClick={() => isAuthenticated ? {} : requireAuth('voice')}
          title={isAuthenticated ? "Voice input" : "Sign in to use voice input"}
        >
          <AudioLines className="h-5 w-5" />
          {!isAuthenticated && (
            <div className="absolute -top-1 -right-1">
              <Lock className="h-3 w-3 text-gray-400" />
            </div>
          )}
        </Button>
      </div>

      {/* Navigation */}
      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-6 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
        <div className="space-y-0.5">
          <button key="search" onClick={() => handleViewChange('search')} className="sidebar-item w-full text-gray-600 hover:bg-gray-100">
            <Search className="h-5 w-5 shrink-0" />
            <span>Busca</span>
          </button>
          <button key="inbox" onClick={() => handleViewChange('inbox')} className={cn("sidebar-item w-full text-gray-600 hover:bg-gray-100", currentView === 'inbox' && 'bg-red-50 text-red-600 font-medium hover:bg-red-50')}>
            <Inbox className="h-5 w-5 shrink-0" />
            <span>Entrada</span>
          </button>
          <button key="today" onClick={() => handleViewChange('today')} className={cn("sidebar-item w-full text-gray-600 hover:bg-gray-100", currentView === 'today' && 'bg-red-50 text-red-600 font-medium hover:bg-red-50')}>
            <Calendar className="h-5 w-5 shrink-0" />
            <span>Hoje</span>
          </button>
          <button key="upcoming" onClick={() => handleViewChange('upcoming')} className={cn("sidebar-item w-full text-gray-600 hover:bg-gray-100", currentView === 'upcoming' && 'bg-red-50 text-red-600 font-medium hover:bg-red-50')}>
            <CalendarDays className="h-5 w-5 shrink-0" />
            <span>Em breve</span>
          </button>
          <button key="filters" onClick={() => handleViewChange('filters')} className="sidebar-item w-full text-gray-600 hover:bg-gray-100">
            <Grid2X2 className="h-5 w-5 shrink-0" />
            <span>Filtros e etiquetas</span>
          </button>
        </div>

        {/* Projects section */}
        <div>
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase">
              Projects
            </span>
          </div>

          <ProjectsList
            onProjectSelect={handleProjectSelect}
            selectedProjectId={currentProject?.id}
          />
        </div>

        {/* Add App */}
        <div>
          <button
            onClick={() => setAddAppOpen(true)}
            className="flex items-center gap-2 text-sm font-medium px-2 py-1 w-full text-left rounded-md transition-colors text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            <Puzzle className="h-4 w-4" />
            Ativar módulo
          </button>
        </div>

        {/* Add Team - Auth required */}
        <div>
          <button
            onClick={() => isAuthenticated ? {} : requireAuth('teams')}
            className={cn(
              "flex items-center gap-2 text-sm font-medium px-2 py-1 w-full text-left rounded-md transition-colors",
              isAuthenticated
                ? "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                : "text-gray-400 cursor-not-allowed relative pr-6"
            )}
            title={isAuthenticated ? "Add a team" : "Sign in to create teams"}
          >
            <ChevronDown className="h-4 w-4" />
            Adicionar uma equipe
            {!isAuthenticated && (
              <Lock className="h-3 w-3 text-gray-400 absolute right-2" />
            )}
          </button>

          {/* Team items - shown only when authenticated */}
          {isAuthenticated ? (
            <div className="pl-6 mt-1 space-y-1">
              <div className="flex items-center gap-2 px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-md cursor-pointer">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Nova marca
              </div>
              <div className="flex items-center gap-2 px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-md cursor-pointer">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                Atualização do site
              </div>
            </div>
          ) : (
            <div className="pl-6 mt-1 space-y-1 opacity-40">
              <div className="flex items-center gap-2 px-2 py-1 text-sm text-gray-400">
                <span className="w-2 h-2 rounded-full bg-blue-300"></span>
                Nova marca
              </div>
              <div className="flex items-center gap-2 px-2 py-1 text-sm text-gray-400">
                <span className="w-2 h-2 rounded-full bg-purple-300"></span>
                Atualização do site
              </div>
            </div>
          )}
        </div>

        {/* CRM Section - Only shown in CRM workspaces */}
        <FeatureGuard feature="contacts">
          <div>
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase">
                CRM
              </span>
            </div>
            <div className="space-y-0.5">
              <FeatureGuard feature="contacts">
                <button
                  onClick={() => handleViewChange('contacts')}
                  className={cn(
                    'sidebar-item w-full text-gray-600 hover:bg-gray-100',
                    currentView === 'contacts' && 'bg-red-50 text-red-600 font-medium hover:bg-red-50'
                  )}
                >
                  <Building2 className="h-5 w-5 shrink-0" />
                  <span>Contatos</span>
                </button>
              </FeatureGuard>
              <FeatureGuard feature="companies">
                <button
                  onClick={() => handleViewChange('companies')}
                  className={cn(
                    'sidebar-item w-full text-gray-600 hover:bg-gray-100',
                    currentView === 'companies' && 'bg-red-50 text-red-600 font-medium hover:bg-red-50'
                  )}
                >
                  <Briefcase className="h-5 w-5 shrink-0" />
                  <span>Empresas</span>
                </button>
              </FeatureGuard>
              <FeatureGuard feature="deals">
                <button
                  onClick={() => handleViewChange('deals')}
                  className={cn(
                    'sidebar-item w-full text-gray-600 hover:bg-gray-100',
                    currentView === 'deals' && 'bg-red-50 text-red-600 font-medium hover:bg-red-50'
                  )}
                >
                  <Briefcase className="h-5 w-5 shrink-0" />
                  <span>Negócios</span>
                </button>
              </FeatureGuard>
            </div>
          </div>
        </FeatureGuard>

        {/* Recruiting Section - Only shown in Recruiting workspaces */}
        <FeatureGuard feature="candidates">
          <div>
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase">
                Recruiting
              </span>
            </div>
            <div className="space-y-0.5">
              <FeatureGuard feature="positions">
                <button
                  onClick={() => handleViewChange('positions')}
                  className={cn(
                    'sidebar-item w-full text-gray-600 hover:bg-gray-100',
                    currentView === 'positions' && 'bg-red-50 text-red-600 font-medium hover:bg-red-50'
                  )}
                >
                  <Briefcase className="h-5 w-5 shrink-0" />
                  <span>Vagas</span>
                </button>
              </FeatureGuard>
              <FeatureGuard feature="candidates">
                <button
                  onClick={() => handleViewChange('candidates')}
                  className={cn(
                    'sidebar-item w-full text-gray-600 hover:bg-gray-100',
                    currentView === 'candidates' && 'bg-red-50 text-red-600 font-medium hover:bg-red-50'
                  )}
                >
                  <Users className="h-5 w-5 shrink-0" />
                  <span>Candidatos</span>
                </button>
              </FeatureGuard>
            </div>
          </div>
        </FeatureGuard>

        {/* Pipeline View - Only shown in CRM and Recruiting workspaces */}
        <FeatureGuard feature="pipeline">
          <div>
            <button
              onClick={() => handleViewChange('pipeline')}
              className={cn(
                'sidebar-item w-full text-gray-600 hover:bg-gray-100',
                currentView === 'pipeline' && 'bg-red-50 text-red-600 font-medium hover:bg-red-50'
              )}
            >
              <Grid2X2 className="h-5 w-5 shrink-0" />
              <span>Pipeline</span>
            </button>
          </div>
        </FeatureGuard>

      </nav>

      {/* Settings & Data Section */}
      <div className="p-3 border-t">
        <button
          onClick={() => handleViewChange('settings')}
          className={cn(
            'sidebar-item w-full text-gray-600 hover:bg-gray-100 mb-2',
            currentView === 'settings' && 'bg-red-50 text-red-600 font-medium hover:bg-red-50'
          )}
        >
          <Settings className="h-5 w-5 shrink-0" />
          <span>Settings</span>
        </button>

        <button
          onClick={() => handleViewChange('datamodel')}
          className={cn(
            'sidebar-item w-full text-gray-600 hover:bg-gray-100 mb-2',
            currentView === 'datamodel' && 'bg-red-50 text-red-600 font-medium hover:bg-red-50'
          )}
        >
          <Database className="h-5 w-5 shrink-0" />
          <span>Modelo de Dados</span>
        </button>

        {/* Export/Import - Available in both modes */}
        <div className="px-2">
          <DataPortabilityMenu variant="ghost" size="sm" className="w-full justify-start text-muted-foreground hover:text-gray-700" />
        </div>
      </div>

      {/* User section removed as it's now in header, keeping log out maybe? */}
      {isAuthenticated && (
        <div className="p-3 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground hover:text-red-500"
            onClick={() => logout()}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      )}
      <ProductivityModal open={productivityOpen} onOpenChange={setProductivityOpen} />
      <AddAppModal open={addAppOpen} onOpenChange={setAddAppOpen} onDataModelClick={() => handleViewChange('datamodel')} />
    </aside>
  );
}
