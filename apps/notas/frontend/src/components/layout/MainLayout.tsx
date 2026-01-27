import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { PanelLeft, ChevronRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  renderContent: (view: string, project: { id: string; sectionId?: string } | null) => React.ReactNode;
}

const VIEW_TITLES: Record<string, string> = {
  inbox: 'Entrada',
  today: 'Hoje',
  upcoming: 'Em breve',
  search: 'Busca',
  filters: 'Filtros e etiquetas',
  settings: 'Configurações',
  notifications: 'Notificações',
};

function getBreadcrumb(view: string, project: { id: string; sectionId?: string } | null): { label: string; icon?: React.ReactNode }[] {
  const crumbs: { label: string; icon?: React.ReactNode }[] = [
    { label: 'My Projects', icon: <Home className="h-4 w-4" /> },
  ];

  if (project) {
    crumbs.push({ label: 'Project' });
  } else if (VIEW_TITLES[view]) {
    crumbs.push({ label: VIEW_TITLES[view] });
  }

  return crumbs;
}

export function MainLayout({ renderContent }: MainLayoutProps) {
  const [currentView, setCurrentView] = useState('inbox');
  const [currentProject, setCurrentProject] = useState<{ id: string; sectionId?: string } | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleViewChange = (view: string, project?: { id: string; sectionId?: string } | null) => {
    setCurrentView(view);
    setCurrentProject(project ?? null);
    setMobileSidebarOpen(false);
  };

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const breadcrumb = getBreadcrumb(currentView, currentProject);

  console.log({ currentView })

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Desktop collapsed sidebar backdrop */}
      {sidebarCollapsed && (
        <div
          className="fixed inset-0 z-40 hidden lg:block"
          onClick={toggleSidebarCollapse}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "inset-y-0 left-0 z-50 transition-all duration-300 ease-in-out",
          // Always fixed positioning
          "fixed",
          // Mobile: hidden by default, shown when open
          !mobileSidebarOpen && "-translate-x-full",
          // Mobile: show when open
          mobileSidebarOpen && "translate-x-0",
          // Desktop: show by default, hide when collapsed
          "lg:translate-x-0",
          sidebarCollapsed && "lg:-translate-x-full lg:fixed"
        )}
      >
        <Sidebar
          currentView={currentView}
          currentProject={currentProject}
          onViewChange={handleViewChange}
          sidebarCollapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapse}
        />
      </aside>

      {/* Main content */}
      <main className={cn(
        "flex-1 flex flex-col min-w-0 w-full transition-all duration-300 ease-in-out",
        // Add left margin when sidebar is expanded to align content
        !sidebarCollapsed && "lg:ml-[280px]"
      )}>
        {/* Header - always shown with expand/collapse button */}

        {!['inbox', 'today', 'upcoming', 'filters', 'search'].includes(currentView) && (
          <header className="flex items-center gap-3 px-4 py-3 border-b bg-background">
            {sidebarCollapsed && (
              <Button
                variant="ghost"
                size="icon"

                onClick={() => {
                  // On mobile: toggle mobile sidebar
                  // On desktop: toggle collapse
                  if (window.innerWidth >= 1024) {
                    toggleSidebarCollapse();
                  } else {
                    setMobileSidebarOpen(!mobileSidebarOpen);
                  }
                }}
              >
                <PanelLeft className="h-5 w-5" />
              </Button>
            )}
            <nav className="flex items-center gap-2 text-sm">
              {breadcrumb.map((crumb, index) => (
                <div key={index} className="flex items-center gap-2">
                  {index > 0 && <ChevronRight className="h-4 w-4 text-gray-400" />}
                  <span className={cn(
                    "flex items-center gap-1.5 text-gray-600",
                    index === breadcrumb.length - 1 && "font-medium text-gray-900"
                  )}>
                    {crumb.icon}
                    {crumb.label}
                  </span>
                </div>
              ))}
            </nav>
          </header>
        )}

        {/* Content area */}
        <div className="flex-1 overflow-y-auto">
          {renderContent(currentView, currentProject)}
        </div>
      </main>
    </div>
  );
}
