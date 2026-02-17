interface NotificationProps {
  type: 'success' | 'error' | 'warning';
  message: string;
}

export function Notification({ type, message }: NotificationProps) {
  const dotColor = {
    success: 'bg-emerald-400',
    error: 'bg-red-400',
    warning: 'bg-amber-400',
  };

  return (
    <div className="mb-6 px-4 py-3 rounded-xl bg-white/5 border border-white/10 flex items-center space-x-3">
      <div className={`w-2 h-2 rounded-full ${dotColor[type]}`} />
      <span className="text-sm text-white/80">{message}</span>
    </div>
  );
}
