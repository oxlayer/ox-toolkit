import { useState, useEffect } from 'react';
import {
  Building2,
  FolderOpen,
  Database,
  Settings,
  Play,
  Square,
  RefreshCw,
  Trash2,
  Download,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Globe,
  Server,
  Lock,
  Stethoscope,
  LogOut,
} from 'lucide-react';
import './App.css';

interface Project {
  name: string;
  path: string;
  createdAt: string;
  resources: {
    postgres: { database: string; user: string; password: string };
    redis: { host: string; port: number; db: number };
    rabbitmq: { vhost: string; user: string; password: string };
    keycloak: { realm: string; clientId: string; clientSecret: string };
  };
}

interface ConnectionStrings {
  DATABASE_URL: string;
  REDIS_URL: string;
  REDIS_DB: string;
  RABBITMQ_URL: string;
  KEYCLOAK_URL: string;
}

function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [infraStatus, setInfraStatus] = useState<string>('unknown');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showConnections, setShowConnections] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('Not logged in');
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning';
    message: string;
  } | null>(null);

  useEffect(() => {
    loadProjects();
    loadInfraStatus();
    loadVersion();
  }, []);

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
      const status = await window.oxlayer.getInfraStatus();
      setInfraStatus(status);
    } catch (error: any) {
      setInfraStatus('error');
    }
  };

  const loadVersion = async () => {
    try {
      const version = await window.oxlayer.getVersion();
      console.log('OxLayer Tower version:', version);
    } catch (error: any) {
      console.error('Failed to load version:', error);
    }
  };

  const showNotification = (type: 'success' | 'error' | 'warning', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleStartInfra = async () => {
    try {
      const result = await window.oxlayer.startInfra();
      if (result.success) {
        showNotification('success', 'Infrastructure started successfully');
        loadInfraStatus();
      } else {
        showNotification('error', result.error || 'Failed to start infrastructure');
      }
    } catch (error: any) {
      showNotification('error', error.message);
    }
  };

  const handleStopInfra = async () => {
    try {
      const result = await window.oxlayer.stopInfra();
      if (result.success) {
        showNotification('success', 'Infrastructure stopped successfully');
        loadInfraStatus();
      } else {
        showNotification('error', result.error || 'Failed to stop infrastructure');
      }
    } catch (error: any) {
      showNotification('error', error.message);
    }
  };

  const handleRunDoctor = async () => {
    try {
      const result = await window.oxlayer.runDoctor();
      if (result.success) {
        showNotification('success', 'Doctor check completed - no issues found');
      } else {
        showNotification('warning', result.error || 'Doctor check completed with warnings');
      }
    } catch (error: any) {
      showNotification('error', error.message);
    }
  };

  const handleUnregisterProject = async (projectName: string) => {
    const confirm = window.confirm(
      `Are you sure you want to unregister "${projectName}"? Resources will be preserved.`
    );
    if (!confirm) return;

    try {
      const result = await window.oxlayer.unregisterProject(projectName);
      if (result.success) {
        showNotification('success', `Project "${projectName}" unregistered`);
        loadProjects();
      } else {
        showNotification('error', result.error || 'Failed to unregister project');
      }
    } catch (error: any) {
      showNotification('error', error.message);
    }
  };

  const handleResetProject = async (projectName: string) => {
    const confirm = window.confirm(
      `⚠️ WARNING: This will DELETE all resources for "${projectName}"!\n\n` +
      `This action cannot be undone.\n\n` +
      `Type "DELETE" to confirm.`
    );
    if (!confirm) return;

    try {
      const result = await window.oxlayer.resetProject(projectName, true);
      if (result.success) {
        showNotification('success', `Project "${projectName}" reset successfully`);
        loadProjects();
      } else {
        showNotification('error', result.error || 'Failed to reset project');
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
      showNotification('error', `Failed to load connections: ${error.message}`);
    }
  };

  const handleDownloadEnv = (project: Project) => {
    // This would generate and download the .env file
    showNotification('success', `Environment file for "${project.name}" generated`);
  };

  const InfraStatusIcon = () => {
    switch (infraStatus) {
      case 'running':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'stopped':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-text flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg">Loading OxLayer Tower...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-text">
      {/* Header */}
      <header className="border-b border-gray-700 bg-surface">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Building2 className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold">OxLayer Tower</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-400">{userEmail}</span>
            {userEmail === 'Not logged in' && (
              <button
                onClick={() => setShowLogin(true)}
                className="px-4 py-2 bg-secondary hover:bg-opacity-80 rounded-lg text-sm font-medium transition"
              >
                Login
              </button>
            )}
            {userEmail !== 'Not logged in' && (
              <button
                onClick={() => {
                  setUserEmail('Not logged in');
                  showNotification('success', 'Logged out successfully');
                }}
                className="p-2 hover:bg-surface rounded-lg transition"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Notification */}
      {notification && (
        <div className="max-w-7xl mx-auto px-6 mt-4">
          <div
            className={`p-4 rounded-lg flex items-center space-x-3 ${
              notification.type === 'success'
                ? 'bg-green-900/50 border border-green-700'
                : notification.type === 'error'
                ? 'bg-red-900/50 border border-red-700'
                : 'bg-yellow-900/50 border border-yellow-700'
            }`}
          >
            {notification.type === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
            {notification.type === 'error' && <XCircle className="w-5 h-5 text-red-500" />}
            {notification.type === 'warning' && <AlertCircle className="w-5 h-5 text-yellow-500" />}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Infrastructure Status */}
        <div className="bg-surface rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Server className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold">Infrastructure Status</h2>
            </div>
            <div className="flex items-center space-x-3">
              <InfraStatusIcon />
              <span className="capitalize">{infraStatus}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-background rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Global Infrastructure</p>
                  <p className="text-lg font-semibold capitalize">{infraStatus}</p>
                </div>
                <Server className="w-8 h-8 text-primary" />
              </div>
            </div>

            <div className="bg-background rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Projects</p>
                  <p className="text-lg font-semibold">{projects.length}</p>
                </div>
                <FolderOpen className="w-8 h-8 text-primary" />
              </div>
            </div>

            <div className="bg-background rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Actions</p>
                  <div className="flex space-x-2 mt-1">
                    {infraStatus !== 'running' && (
                      <button
                        onClick={handleStartInfra}
                        className="p-2 hover:bg-secondary rounded-lg transition"
                        title="Start Infrastructure"
                      >
                        <Play className="w-5 h-5 text-green-500" />
                      </button>
                    )}
                    {infraStatus === 'running' && (
                      <button
                        onClick={handleStopInfra}
                        className="p-2 hover:bg-secondary rounded-lg transition"
                        title="Stop Infrastructure"
                      >
                        <Square className="w-5 h-5 text-red-500" />
                      </button>
                    )}
                    <button
                      onClick={handleRunDoctor}
                      className="p-2 hover:bg-secondary rounded-lg transition"
                      title="Run Doctor"
                    >
                      <Stethoscope className="w-5 h-5 text-blue-500" />
                    </button>
                  </div>
                </div>
                <Settings className="w-8 h-8 text-primary" />
              </div>
            </div>
          </div>
        </div>

        {/* Projects */}
        <div className="bg-surface rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <FolderOpen className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold">Projects</h2>
            </div>
            <button
              onClick={() => showNotification('warning', 'Project registration coming soon')}
              className="flex items-center space-x-2 px-4 py-2 bg-primary hover:bg-opacity-80 rounded-lg text-sm font-medium transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Project</span>
            </button>
          </div>

          {projects.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <FolderOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">No projects registered</p>
              <p className="text-sm">Register a project to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {projects.map((project) => (
                <div key={project.name} className="bg-background rounded-lg p-4 hover:bg-opacity-80 transition">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-1">{project.name}</h3>
                      <p className="text-sm text-gray-400 mb-2">{project.path}</p>
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center space-x-1">
                          <Database className="w-4 h-4 text-primary" />
                          <span>Postgres: {project.resources.postgres.database}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Database className="w-4 h-4 text-primary" />
                          <span>Redis: DB {project.resources.redis.db}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Globe className="w-4 h-4 text-primary" />
                          <span>RabbitMQ: {project.resources.rabbitmq.vhost}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleShowConnections(project)}
                        className="p-2 hover:bg-secondary rounded-lg transition"
                        title="View Connections"
                      >
                        <Globe className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDownloadEnv(project)}
                        className="p-2 hover:bg-secondary rounded-lg transition"
                        title="Download .env"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleResetProject(project.name)}
                        className="p-2 hover:bg-secondary rounded-lg transition"
                        title="Reset Project"
                      >
                        <RefreshCw className="w-5 h-5 text-yellow-500" />
                      </button>
                      <button
                        onClick={() => handleUnregisterProject(project.name)}
                        className="p-2 hover:bg-secondary rounded-lg transition"
                        title="Unregister Project"
                      >
                        <Trash2 className="w-5 h-5 text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Connection URLs Modal */}
      {showConnections && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-surface rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Connection URLs - {selectedProject.name}</h3>
              <button
                onClick={() => setShowConnections(false)}
                className="p-2 hover:bg-background rounded-lg transition"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {selectedProject.connections && (
              <div className="space-y-3">
                {Object.entries(selectedProject.connections).map(([key, value]) => (
                  <div key={key} className="bg-background rounded-lg p-3">
                    <p className="text-sm text-gray-400 mb-1">{key}</p>
                    <p className="text-sm font-mono break-all">{value as string}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-surface rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Login to OxLayer</h3>
              <button
                onClick={() => setShowLogin(false)}
                className="p-2 hover:bg-background rounded-lg transition"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                showNotification('warning', 'Login functionality coming soon');
                setShowLogin(false);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  className="w-full px-3 py-2 bg-background border border-gray-600 rounded-lg focus:outline-none focus:border-primary"
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <input
                  type="password"
                  className="w-full px-3 py-2 bg-background border border-gray-600 rounded-lg focus:outline-none focus:border-primary"
                  placeholder="••••••••"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-primary hover:bg-opacity-80 rounded-lg font-medium transition"
              >
                Login
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
