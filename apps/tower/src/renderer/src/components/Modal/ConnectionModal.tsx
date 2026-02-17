import { X } from 'lucide-react';
import { Project, ConnectionStrings } from '../../types';

interface ConnectionModalProps {
  project: Project & { connections?: ConnectionStrings };
  onClose: () => void;
}

export function ConnectionModal({ project, onClose }: ConnectionModalProps) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#141414] border border-white/10 rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h3 className="text-lg font-semibold text-white">Connection URLs</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition">
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        <div className="p-6 space-y-3 overflow-auto max-h-[60vh]">
          {project.connections && Object.entries(project.connections).map(([key, value]) => (
            <div key={key} className="bg-white/[0.02] rounded-lg p-4 border border-white/5">
              <p className="text-xs text-white/40 mb-2 font-medium">{key}</p>
              <p className="text-sm font-mono text-white/70 break-all">{value as string}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
