import { ExternalLink, FolderOpen, Code, Terminal, Globe, Download, RefreshCw, Trash2 } from 'lucide-react';
import { Project as ProjectType } from '../../types';

interface ProjectRowProps {
  project: ProjectType;
  onShowConnections: (project: ProjectType) => void;
  onDownloadEnv: (project: ProjectType) => void;
  onReset: (projectName: string) => void;
  onUnregister: (projectName: string) => void;
  onOpenFolder: (project: ProjectType) => void;
  onOpenVSCode: (project: ProjectType) => void;
  onOpenCursor: (project: ProjectType) => void;
  onOpenAntigravity: (project: ProjectType) => void;
  ideMenuProject: ProjectType | null;
  setIdeMenuProject: (project: ProjectType | null) => void;
}

export function ProjectRow({
  project,
  onShowConnections,
  onDownloadEnv,
  onReset,
  onUnregister,
  onOpenFolder,
  onOpenVSCode,
  onOpenCursor,
  onOpenAntigravity,
  ideMenuProject,
  setIdeMenuProject,
}: ProjectRowProps) {
  return (
    <div className="group px-4 py-4 rounded-xl hover:bg-white/5 transition border border-transparent hover:border-white/5">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3">
            <p className="font-medium text-white">{project.name}</p>
            <span className="px-2 py-0.5 rounded bg-white/5 text-xs text-white/40 border border-white/10">
              {project.resources.postgres.database}
            </span>
          </div>
          <p className="text-xs text-white/30 mt-1 truncate">{project.path}</p>
          <div className="flex gap-3 mt-2 text-xs text-white/40">
            <span>Postgres</span>
            <span>•</span>
            <span>Redis DB {project.resources.redis.db}</span>
            <span>•</span>
            <span>{project.resources.rabbitmq.vhost}</span>
          </div>
        </div>

        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition">
          <div className="relative ide-menu-container">
            <button
              onClick={() => setIdeMenuProject(ideMenuProject?.name === project.name ? null : project)}
              className="p-2 hover:bg-white/10 rounded-lg transition"
              title="Open in..."
            >
              <ExternalLink className="w-4 h-4 text-white/60" />
            </button>

            {ideMenuProject?.name === project.name && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl z-20">
                <div className="p-1">
                  <button
                    onClick={() => { onOpenFolder(project); setIdeMenuProject(null); }}
                    className="w-full px-3 py-2 text-left hover:bg-white/5 rounded transition flex items-center space-x-2 text-sm text-white/80"
                  >
                    <FolderOpen className="w-4 h-4" />
                    <span>File Explorer</span>
                  </button>
                  <button
                    onClick={() => { onOpenVSCode(project); setIdeMenuProject(null); }}
                    className="w-full px-3 py-2 text-left hover:bg-white/5 rounded transition flex items-center space-x-2 text-sm text-white/80"
                  >
                    <Code className="w-4 h-4 text-blue-400" />
                    <span>VSCode</span>
                  </button>
                  <button
                    onClick={() => { onOpenCursor(project); setIdeMenuProject(null); }}
                    className="w-full px-3 py-2 text-left hover:bg-white/5 rounded transition flex items-center space-x-2 text-sm text-white/80"
                  >
                    <Terminal className="w-4 h-4 text-purple-400" />
                    <span>Cursor</span>
                  </button>
                  <button
                    onClick={() => { onOpenAntigravity(project); setIdeMenuProject(null); }}
                    className="w-full px-3 py-2 text-left hover:bg-white/5 rounded transition flex items-center space-x-2 text-sm text-white/80"
                  >
                    <ExternalLink className="w-4 h-4 text-orange-400" />
                    <span>Antigravity</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <button onClick={() => onShowConnections(project)} className="p-2 hover:bg-white/10 rounded-lg transition" title="Connections">
            <Globe className="w-4 h-4 text-white/60" />
          </button>
          <button onClick={() => onDownloadEnv(project)} className="p-2 hover:bg-white/10 rounded-lg transition" title="Download .env">
            <Download className="w-4 h-4 text-white/60" />
          </button>
          <button onClick={() => onReset(project.name)} className="p-2 hover:bg-white/10 rounded-lg transition" title="Reset">
            <RefreshCw className="w-4 h-4 text-amber-400/70" />
          </button>
          <button onClick={() => onUnregister(project.name)} className="p-2 hover:bg-red-500/10 rounded-lg transition" title="Unregister">
            <Trash2 className="w-4 h-4 text-red-400/70" />
          </button>
        </div>
      </div>
    </div>
  );
}
