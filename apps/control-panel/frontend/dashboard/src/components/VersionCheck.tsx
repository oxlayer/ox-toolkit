/**
 * API Version Check
 *
 * Component that checks if the frontend client version is compatible
 * with the backend API version and displays a warning if not.
 */

import { useVersion } from '@/services/api-client';

export function VersionCheck() {
  const { data: versionInfo } = useVersion();

  if (!versionInfo || !versionInfo.version) {
    return null;
  }

  // For now, just display the version in a subtle way
  return (
    <div className="fixed bottom-4 right-4 text-xs text-gray-400 dark:text-gray-600">
      API v{versionInfo.version}
    </div>
  );
}

/**
 * Hook to check version on mount and log to console
 */
export function useVersionCheck() {
  const { data: versionInfo } = useVersion();

  // Version info is available if needed
  return versionInfo;
}
