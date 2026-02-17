import { Plus } from 'lucide-react';
import { Environment, Organization } from '../../types';

interface HeaderProps {
  currentEnv: Environment;
  currentOrg: Organization;
  projectCount: number;
  onNewProject: () => void;
}

export function Header({ currentEnv, currentOrg, projectCount, onNewProject }: HeaderProps) {
  const envTitles: Record<Environment, string> = {
    dev: 'Development Environment',
    stg: 'Staging Environment',
    prd: 'Production Environment',
  };

  return (
    <header className="sticky top-0 z-10 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-6xl mx-auto px-8 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div>
            <h1 className="text-xl font-semibold text-white">{envTitles[currentEnv]}</h1>
            <p className="text-xs text-white/40 mt-0.5">
              {projectCount} registered project{projectCount !== 1 ? 's' : ''} • {currentOrg.name}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onNewProject}
            className="px-3 py-1.5 rounded-lg bg-white text-black text-xs font-medium hover:bg-white/90 transition flex items-center space-x-1.5"
          >
            <Plus className="w-3 h-3" />
            <span>New Project</span>
          </button>
        </div>
      </div>
    </header>
  );
}
