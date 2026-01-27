import { Check, AlertCircle, Loader2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DeliveryStatus } from '@oxlayer/capabilities-web-state';

interface SyncStatusIndicatorProps {
  status?: DeliveryStatus;
  className?: string;
  size?: 'sm' | 'md';
}

/**
 * WhatsApp-like sync status indicator:
 *
 * State   Icon      Meaning
 * local   ⏳        Action exists only locally
 * queued  ✔️        Saved offline
 * sending ⏳✔️      Syncing
 * acknowledged ✔️✔️ Server accepted
 * confirmed ✔️✔️✔️  Fully consistent
 * failed  ⚠️       Needs user attention
 */
export function SyncStatusIndicator({ status = 'local', className, size = 'sm' }: SyncStatusIndicatorProps) {
  const sizeClasses = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';

  // Sending: spinner
  if (status === 'sending') {
    return (
      <div className={cn('flex items-center gap-0.5', className)}>
        <Loader2 className={cn(sizeClasses, 'animate-spin text-blue-500')} />
        <Check className={cn(sizeClasses, 'text-gray-400')} />
      </div>
    );
  }

  // Failed: alert icon
  if (status === 'failed') {
    return (
      <div className={cn('flex items-center justify-center', className)}>
        <AlertCircle className={cn(sizeClasses, 'text-red-500')} />
      </div>
    );
  }

  // Acknowledged or Confirmed: two blue ticks
  if (status === 'acknowledged' || status === 'confirmed') {
    return (
      <div className={cn('flex items-center gap-0.5', className)}>
        <Check className={cn(sizeClasses, 'text-blue-500')} />
        <Check className={cn(sizeClasses, 'text-blue-500')} />
      </div>
    );
  }

  // Queued: one gray tick
  if (status === 'queued') {
    return (
      <div className={cn('flex items-center gap-0.5', className)}>
        <Check className={cn(sizeClasses, 'text-gray-400')} />
      </div>
    );
  }

  // Local: clock icon (optimistic only)
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <Clock className={cn(sizeClasses, 'text-gray-300')} />
    </div>
  );
}

/**
 * Text label for sync status
 */
export function SyncStatusLabel({ status }: { status?: DeliveryStatus }) {
  if (!status || status === 'local') {
    return <span className="text-xs text-gray-400">Local only</span>;
  }
  if (status === 'queued') {
    return <span className="text-xs text-gray-500">Queued</span>;
  }
  if (status === 'sending') {
    return <span className="text-xs text-blue-500">Syncing...</span>;
  }
  if (status === 'acknowledged') {
    return <span className="text-xs text-blue-500">Sent</span>;
  }
  if (status === 'confirmed') {
    return <span className="text-xs text-green-500">Synced</span>;
  }
  if (status === 'failed') {
    return <span className="text-xs text-red-500">Failed</span>;
  }
  return null;
}
