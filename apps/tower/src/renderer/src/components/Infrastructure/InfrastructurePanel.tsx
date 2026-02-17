import { Play, Square, RefreshCw } from 'lucide-react';
import { StatusPill } from '../UI/StatusPill';
import { ServicesTable } from './ServicesTable';
import { Environment } from '../../types';

interface InfrastructurePanelProps {
  currentEnv: Environment;
  infraStatus: Record<Environment, string>;
  servicesStatus?: Record<string, string>;
  onStartInfra: () => void;
  onStopInfra: () => void;
  onRunDoctor: () => void;
}

export function InfrastructurePanel({
  currentEnv,
  infraStatus,
  servicesStatus,
  onStartInfra,
  onStopInfra,
  onRunDoctor,
}: InfrastructurePanelProps) {
  const envDescriptions: Record<Environment, string> = {
    dev: 'Development environment stack',
    stg: 'Staging environment stack',
    prd: 'Production environment stack',
  };

  return (
    <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-6 mb-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-white mb-1">Infrastructure</h2>
          <p className="text-xs text-white/40">{envDescriptions[currentEnv]}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusPill status={infraStatus[currentEnv]} />
          <div className="flex gap-2">
            {infraStatus[currentEnv] !== 'running' ? (
              <button
                onClick={onStartInfra}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20 hover:bg-emerald-500/20 transition flex items-center space-x-1.5"
              >
                <Play className="w-3 h-3" />
                <span>Start</span>
              </button>
            ) : (
              <button
                onClick={onStopInfra}
                className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-medium border border-red-500/20 hover:bg-red-500/20 transition flex items-center space-x-1.5"
              >
                <Square className="w-3 h-3" />
                <span>Stop</span>
              </button>
            )}
            <button
              onClick={onRunDoctor}
              className="px-3 py-1.5 rounded-lg bg-white/5 text-white/60 text-xs font-medium border border-white/10 hover:bg-white/10 transition flex items-center space-x-1.5"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Doctor</span>
            </button>
          </div>
        </div>
      </div>

      <ServicesTable servicesStatus={servicesStatus} />
    </div>
  );
}
