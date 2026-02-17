import { Plus } from 'lucide-react';
import { Project as ProjectType } from '../../types';
import { ProjectRow } from './ProjectRow';

interface ProjectsListProps {
  projects: ProjectType[];
  ideMenuProject: ProjectType | null;
  setIdeMenuProject: (project: ProjectType | null) => void;
  onShowConnections: (project: ProjectType) => void;
  onDownloadEnv: (project: ProjectType) => void;
  onReset: (projectName: string) => void;
  onUnregister: (projectName: string) => void;
  onOpenFolder: (project: ProjectType) => void;
  onOpenVSCode: (project: ProjectType) => void;
  onOpenCursor: (project: ProjectType) => void;
  onOpenAntigravity: (project: ProjectType) => void;
  onNewProject: () => void;
}

export function ProjectsList({
  projects,
  ideMenuProject,
  setIdeMenuProject,
  onShowConnections,
  onDownloadEnv,
  onReset,
  onUnregister,
  onOpenFolder,
  onOpenVSCode,
  onOpenCursor,
  onOpenAntigravity,
  onNewProject,
}: ProjectsListProps) {
  return (
    <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-white mb-1">Projects</h2>
          <p className="text-xs text-white/40">{projects.length} registered project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={onNewProject}
          className="px-3 py-1.5 rounded-lg bg-white text-black text-xs font-medium hover:bg-white/90 transition flex items-center space-x-1.5"
        >
          <Plus className="w-3 h-3" />
          <span>New Project</span>
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-white/40 text-sm">No projects in this environment yet</p>
        </div>
      ) : (
        <div className="space-y-1">
          {projects.map((project) => (
            <ProjectRow
              key={project.name}
              project={project}
              onShowConnections={onShowConnections}
              onDownloadEnv={onDownloadEnv}
              onReset={onReset}
              onUnregister={onUnregister}
              onOpenFolder={onOpenFolder}
              onOpenVSCode={onOpenVSCode}
              onOpenCursor={onOpenCursor}
              onOpenAntigravity={onOpenAntigravity}
              ideMenuProject={ideMenuProject}
              setIdeMenuProject={setIdeMenuProject}
            />
          ))}
        </div>
      )}
    </div>
  );
}
