import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { Sidebar } from './components/Sidebar/Sidebar';
import { Header } from './components/Header/Header';
import { InfrastructurePanel } from './components/Infrastructure/InfrastructurePanel';
import { DoctorResults } from './components/Doctor/DoctorResults';
import { ProjectsList } from './components/Projects/ProjectsList';
import { ConnectionModal } from './components/Modal/ConnectionModal';
import { Notification } from './components/UI/Notification';
import { TabNavigation, TabContent } from './components/Tabs';
import { tabsService, Tab } from './services';
import { Environment, Organization, Project } from './types';

function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [infraStatus, setInfraStatus] = useState<Record<Environment, string>>({
    dev: 'unknown',
    stg: 'unknown',
    prd: 'unknown',
  });
  const [servicesStatus, setServicesStatus] = useState<Record<string, string>>({});
  const [currentEnv, setCurrentEnv] = useState<Environment>('dev');

  // Tab state
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>('overview');
  const [organizations] = useState<Organization[]>([
    { id: 'oxlayer-inc', name: 'OxLayer Inc' },
    { id: 'personal', name: 'Personal Workspace' },
  ]);
  const [currentOrg, setCurrentOrg] = useState<Organization>(organizations[0]);
  const [selectedProject, setSelectedProject] = useState<(Project & { connections?: any }) | null>(null);
  const [showConnections, setShowConnections] = useState(false);
  const [ideMenuProject, setIdeMenuProject] = useState<Project | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning';
    message: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [doctorResults, setDoctorResults] = useState<string | null>(null);
  const [showDoctorResults, setShowDoctorResults] = useState(false);

  useEffect(() => {
    loadProjects();
    loadInfraStatus();

    // Listen for individual service status updates from polling
    if (window.oxlayer && window.oxlayer.onServicesStatusUpdate) {
      window.oxlayer.onServicesStatusUpdate((services: Record<string, string>) => {
        setServicesStatus(services);
      });
    }

    // Subscribe to tabs service
    const unsubscribe = tabsService.subscribe((tabs, activeTabId) => {
      setTabs(tabs);
      setActiveTabId(activeTabId);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  useEffect(() => {
    loadProjects();
    loadInfraStatus();
  }, [currentEnv]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ideMenuProject) {
        const target = event.target as HTMLElement;
        if (!target.closest('.ide-menu-container')) {
          setIdeMenuProject(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [ideMenuProject]);

  const loadProjects = async () => {
    try {
      const projects = await window.oxlayer.getProjects();
      setProjects(projects);
    } catch (error: any) {
      showNotification('error', `Failed to load projects: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadInfraStatus = async () => {
    try {
      const devStatus = await window.oxlayer.getInfraStatus();
      setInfraStatus({
        dev: devStatus,
        stg: devStatus,
        prd: devStatus,
      });
    } catch (error: any) {
      setInfraStatus({
        dev: 'error',
        stg: 'error',
        prd: 'error',
      });
    }
  };

  const showNotification = (type: 'success' | 'error' | 'warning', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleStartInfra = async () => {
    try {
      const result = await window.oxlayer.startInfra();
      if (result.success) {
        showNotification('success', 'Infrastructure started');
        loadInfraStatus();
      } else {
        showNotification('error', result.error || 'Failed to start');
      }
    } catch (error: any) {
      showNotification('error', error.message);
    }
  };

  const handleStopInfra = async () => {
    try {
      const result = await window.oxlayer.stopInfra();
      if (result.success) {
        showNotification('success', 'Infrastructure stopped');
        loadInfraStatus();
      } else {
        showNotification('error', result.error || 'Failed to stop');
      }
    } catch (error: any) {
      showNotification('error', error.message);
    }
  };

  const handleRunDoctor = async () => {
    try {
      const result = await window.oxlayer.runDoctor();

      if (result.success) {
        if (result.output) {
          setDoctorResults(result.output);
          setShowDoctorResults(true);
        } else {
          setDoctorResults('Doctor check completed but no output was returned.\n\nCheck the terminal/console for detailed output.');
          setShowDoctorResults(true);
        }
        showNotification('success', 'Doctor check completed');
      } else if (result.error) {
        showNotification('error', result.error);
      }
    } catch (error: any) {
      showNotification('error', error.message);
    }
  };

  const handleUnregisterProject = async (projectName: string) => {
    const confirm = window.confirm(`Unregister "${projectName}"? Resources will be preserved.`);
    if (!confirm) return;

    try {
      const result = await window.oxlayer.unregisterProject(projectName);
      if (result.success) {
        showNotification('success', `Project unregistered`);
        loadProjects();
      } else {
        showNotification('error', result.error || 'Failed to unregister');
      }
    } catch (error: any) {
      showNotification('error', error.message);
    }
  };

  const handleResetProject = async (projectName: string) => {
    const confirm = window.confirm(`⚠️ DELETE all resources for "${projectName}"?\n\nThis cannot be undone.`);
    if (!confirm) return;

    try {
      const result = await window.oxlayer.resetProject(projectName, true);
      if (result.success) {
        showNotification('success', `Project reset`);
        loadProjects();
      } else {
        showNotification('error', result.error || 'Failed to reset');
      }
    } catch (error: any) {
      showNotification('error', error.message);
    }
  };

  const handleShowConnections = async (project: Project) => {
    try {
      const connections = await window.oxlayer.getConnections(project.name);
      setSelectedProject({ ...project, connections });
      setShowConnections(true);
    } catch (error: any) {
      showNotification('error', `Failed to load connections`);
    }
  };

  const handleDownloadEnv = (project: Project) => {
    showNotification('success', `.env file for "${project.name}" generated`);
  };

  const handleOpenFolder = async (project: Project) => {
    try {
      await window.oxlayer.openFolder(project.path);
    } catch (error: any) {
      showNotification('error', 'Failed to open folder');
    }
  };

  const handleOpenVSCode = async (project: Project) => {
    try {
      await window.oxlayer.openVSCode(project.path);
    } catch (error: any) {
      showNotification('error', 'Failed to open VSCode');
    }
  };

  const handleOpenCursor = async (project: Project) => {
    try {
      await window.oxlayer.openCursor(project.path);
    } catch (error: any) {
      showNotification('error', 'Failed to open Cursor');
    }
  };

  const handleOpenAntigravity = async (project: Project) => {
    try {
      await window.oxlayer.openAntigravity(project.path);
    } catch (error: any) {
      showNotification('error', 'Failed to open Antigravity');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-white/20" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0a0a0a]">
      {/* Sidebar */}
      <Sidebar
        currentOrg={currentOrg}
        currentEnv={currentEnv}
        onEnvChange={setCurrentEnv}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* Tab Navigation */}
        <TabNavigation
          tabs={tabs}
          activeTabId={activeTabId}
          onTabClick={(tabId) => tabsService.switchTab(tabId)}
          onTabClose={(tabId) => tabsService.closeTab(tabId)}
        />

        {/* Tab Content */}
        <div className="flex-1 overflow-auto">
          {activeTabId === 'overview' ? (
            <>
              {/* Dashboard Content */}
              <div className="max-w-6xl mx-auto px-8 py-8">
                {/* Notification */}
                {notification && <Notification type={notification.type} message={notification.message} />}

                {/* Infrastructure Panel */}
                <InfrastructurePanel
                  currentEnv={currentEnv}
                  infraStatus={infraStatus}
                  servicesStatus={servicesStatus}
                  onStartInfra={handleStartInfra}
                  onStopInfra={handleStopInfra}
                  onRunDoctor={handleRunDoctor}
                />

                {/* Doctor Results */}
                {showDoctorResults && doctorResults && (
                  <DoctorResults
                    results={doctorResults}
                    onClose={() => setShowDoctorResults(false)}
                  />
                )}

                {/* Projects Section */}
                <ProjectsList
                  projects={projects}
                  ideMenuProject={ideMenuProject}
                  setIdeMenuProject={setIdeMenuProject}
                  onShowConnections={handleShowConnections}
                  onDownloadEnv={handleDownloadEnv}
                  onReset={handleResetProject}
                  onUnregister={handleUnregisterProject}
                  onOpenFolder={handleOpenFolder}
                  onOpenVSCode={handleOpenVSCode}
                  onOpenCursor={handleOpenCursor}
                  onOpenAntigravity={handleOpenAntigravity}
                  onNewProject={() => showNotification('warning', 'Coming soon')}
                />
              </div>
            </>
          ) : (
            <TabContent tab={tabs.find(t => t.id === activeTabId)!} />
          )}
        </div>
      </main>

      {/* Connection Modal */}
      {showConnections && selectedProject && (
        <ConnectionModal
          project={selectedProject}
          onClose={() => setShowConnections(false)}
        />
      )}
    </div>
  );
}

export default App;
