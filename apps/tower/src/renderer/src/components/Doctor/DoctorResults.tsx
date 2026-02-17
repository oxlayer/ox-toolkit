import { X } from 'lucide-react';

interface DoctorResultsProps {
  results: string;
  onClose: () => void;
}

export function DoctorResults({ results, onClose }: DoctorResultsProps) {
  return (
    <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">Doctor Results</h3>
          <p className="text-xs text-white/40">System health check</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition">
          <X className="w-5 h-5 text-white/60" />
        </button>
      </div>
      <pre className="text-xs text-white/70 font-mono whitespace-pre-wrap bg-black/20 rounded-lg p-4 border border-white/5 overflow-auto max-h-96">
        {results}
      </pre>
    </div>
  );
}
