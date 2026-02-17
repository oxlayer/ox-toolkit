interface StatusPillProps {
  status: string;
}

export function StatusPill({ status }: StatusPillProps) {
  const styles: Record<string, string> = {
    running: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    stopped: 'bg-red-500/10 text-red-400 border-red-500/20',
    error: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    unknown: 'bg-white/5 text-white/40 border-white/10',
  };

  return (
    <div className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[status] || styles.unknown}`}>
      {status === 'running' && <span className="inline-block w-1.5 h-1.5 bg-emerald-400 rounded-full mr-2 animate-pulse" />}
      {status}
    </div>
  );
}
