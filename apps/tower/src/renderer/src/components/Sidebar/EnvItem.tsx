import { Environment } from '../../types';

interface EnvItemProps {
  env: Environment;
  active: boolean;
  onClick: () => void;
}

export function EnvItem({ env, active, onClick }: EnvItemProps) {
  const envConfig: Record<Environment, { name: string; color: string; icon: string }> = {
    dev: { name: 'Development', color: 'emerald', icon: '💻' },
    stg: { name: 'Staging', color: 'amber', icon: '🚀' },
    prd: { name: 'Production', color: 'rose', icon: '🔒' },
  };

  const config = envConfig[env];

  const activeStyles = {
    dev: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    stg: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    prd: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
  };

  const dotColor = {
    dev: 'bg-emerald-400',
    stg: 'bg-amber-400',
    prd: 'bg-rose-400',
  };

  return (
    <button
      onClick={onClick}
      className={`w-full px-3 py-2.5 rounded-lg text-sm transition flex items-center justify-between ${
        active
          ? `${activeStyles[env]} font-medium`
          : 'text-white/50 hover:text-white/80 hover:bg-white/5'
      }`}
    >
      <div className="flex items-center space-x-2">
        <span className="text-base">{config.icon}</span>
        <span>{config.name}</span>
      </div>
      {active && <div className={`w-1.5 h-1.5 ${dotColor[env]} rounded-full animate-pulse`} />}
    </button>
  );
}
