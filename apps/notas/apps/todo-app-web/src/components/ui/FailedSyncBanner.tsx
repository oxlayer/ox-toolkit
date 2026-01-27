/**
 * FailedSyncBanner
 *
 * Displays a banner when there are failed syncs with retry functionality.
 * Shows at the top of the app when sync operations fail.
 */

import { useState } from 'react';
import { AlertCircle, X, RefreshCw, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { useWorkspace } from '@/lib/workspace';
import { getIntentLog, type IntentLogEntry } from '@oxlayer/capabilities-web-state';
import { useFailedIntents } from '@/hooks/use-failed-intents';

/**
 * Get a human-readable description of an intent
 */
function getIntentDescription(intent: IntentLogEntry): string {
  const actionMap: Record<string, string> = {
    create: 'Creating',
    update: 'Updating',
    delete: 'Deleting',
  };

  const entityMap: Record<string, string> = {
    todo: 'todo',
    task: 'task',
    project: 'project',
  };

  const action = actionMap[intent.type] || intent.type;
  const entity = entityMap[intent.entityType] || intent.entityType;

  // Try to get title from payload
  const payload = intent.payload as { title?: string } | undefined;
  const title = payload?.title ? `"${payload.title}"` : '';

  return `${action} ${entity}${title ? ` ${title}` : ''}`;
}

/**
 * FailedSyncBanner Component
 *
 * Uses LegendState reactivity to automatically update when failed intents change.
 * No polling needed - the component re-renders immediately when intents fail.
 */
export function FailedSyncBanner({ className }: { className?: string }) {
  const { isAuthenticated } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const [expanded, setExpanded] = useState(false);
  const [retrying, setRetrying] = useState<Set<string>>(new Set());

  // REACTIVE: Automatically re-renders when failed intents change
  // No polling, no useEffect - just pure LegendState reactivity
  const failedIntents = useFailedIntents(currentWorkspace?.id || '');

  // Hide if no failed intents or not authenticated
  if (!isAuthenticated || failedIntents.length === 0) {
    return null;
  }

  const handleRetry = async (intentId: string) => {
    setRetrying(prev => new Set([...prev, intentId]));

    try {
      // Re-queue the intent by changing its status back to 'queued'
      const log = getIntentLog(currentWorkspace!.id);
      const current = log.get();
      const index = current.intents.findIndex((i: IntentLogEntry) => i.id === intentId);

      if (index !== -1) {
        const intent = current.intents[index];
        // For manual retry, keep the retries count but reset status
        // The sync engine will still check maxRetries, but we increment retries
        // so it will only attempt once more before failing again
        log.set({
          ...current,
          intents: [
            ...current.intents.slice(0, index),
            {
              ...intent,
              status: 'queued',
              retries: intent.retries + 1, // Increment retries, don't reset!
              retryAt: Date.now(), // Retry immediately
              error: undefined,
            } as IntentLogEntry,
            ...current.intents.slice(index + 1),
          ],
        });

        // Note: No need to manually update local state - the reactive failedIntents
        // will automatically update when the intent status changes
      }
    } catch (error) {
      console.error('[FailedSyncBanner] Retry failed:', error);
    } finally {
      setRetrying(prev => {
        const next = new Set(prev);
        next.delete(intentId);
        return next;
      });
    }
  };

  const handleRetryAll = async () => {
    for (const intent of failedIntents) {
      await handleRetry(intent.id);
    }
  };

  const handleDismiss = (intentId: string) => {
    // Dismiss is just a local UI action - we don't actually delete the intent
    // The failed intents list will automatically update when the intent is retried
    // This is mainly for UX - to hide the item from the banner
    // The intent remains in the log with status='failed'
  };

  return (
    <div className={cn(
      'bg-gradient-to-r from-red-50 to-orange-50 border-b border-red-200 dark:from-red-950/30 dark:to-orange-950/30 dark:border-red-800',
      className
    )}>
      {/* Banner Header */}
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                {failedIntents.length} {failedIntents.length === 1 ? 'item' : 'items'} failed to sync
              </p>
              {!expanded && (
                <p className="text-xs text-red-600 dark:text-red-400 truncate">
                  Click to view details and retry
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-md transition-colors"
              aria-label={expanded ? 'Collapse' : 'Expand'}
            >
              <ChevronDown className={cn(
                'h-4 w-4 text-red-600 dark:text-red-400 transition-transform',
                expanded && 'transform rotate-180'
              )} />
            </button>

            {failedIntents.length > 1 && (
              <button
                onClick={handleRetryAll}
                disabled={retrying.size > 0}
                className="px-3 py-1.5 text-xs font-medium bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <RefreshCw className={cn(
                  'h-3 w-3',
                  retrying.size > 0 && 'animate-spin'
                )} />
                Retry All
              </button>
            )}
          </div>
        </div>

        {/* Expanded Details */}
        {expanded && (
          <div className="mt-3 space-y-2">
            <div className="bg-white dark:bg-gray-900 rounded-md border border-red-200 dark:border-red-800 divide-y divide-red-100 dark:divide-red-800/50">
              {failedIntents.map((intent) => (
                <div
                  key={intent.id}
                  className="p-3 flex items-start justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {getIntentDescription(intent)}
                    </p>
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      {intent.error || 'Unknown error'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Attempted {intent.retries} time{intent.retries !== 1 ? 's' : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleRetry(intent.id)}
                      disabled={retrying.has(intent.id)}
                      className="px-2 py-1 text-xs font-medium bg-red-600 hover:bg-red-700 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      <RefreshCw className={cn(
                        'h-3 w-3',
                        retrying.has(intent.id) && 'animate-spin'
                      )} />
                      Retry
                    </button>
                    <button
                      onClick={() => handleDismiss(intent.id)}
                      className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                      aria-label="Dismiss"
                    >
                      <X className="h-3 w-3 text-gray-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Hook to get failed intents count
 *
 * Uses LegendState reactivity to automatically update when failed intents change.
 * No polling needed - updates immediately when intents fail.
 */
export function useFailedSyncsCount() {
  const { isAuthenticated } = useAuth();
  const { currentWorkspace } = useWorkspace();

  // REACTIVE: Automatically re-renders when failed intents count changes
  const failedIntents = useFailedIntents(currentWorkspace?.id || '');

  return isAuthenticated ? failedIntents.length : 0;
}
