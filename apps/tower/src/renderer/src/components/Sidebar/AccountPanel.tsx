import { Settings } from 'lucide-react';

export function AccountPanel() {
  return (
    <div className="flex items-center justify-between">
      <button className="flex items-center space-x-2 hover:bg-white/5 px-2 py-1.5 rounded-lg transition flex-1">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-xs font-semibold text-white">
          RV
        </div>
        <div className="text-left">
          <div className="text-sm text-white/80">Roberto Veloso</div>
          <div className="text-xs text-white/40">roberto@oxlayer.io</div>
        </div>
      </button>
      <button className="p-2 hover:bg-white/10 rounded-lg transition">
        <Settings className="w-4 h-4 text-white/50" />
      </button>
    </div>
  );
}
