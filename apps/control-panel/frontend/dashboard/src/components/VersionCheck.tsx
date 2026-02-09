/**
 * API Version Check
 *
 * Component that checks if the frontend client version is compatible
 * with the backend API version and displays a warning if not.
 */

import { useEffect, useState } from 'react';
import { checkApiVersion, CLIENT_VERSION } from '@oxlayer/api-client/fetcher';

interface VersionInfo {
  compatible: boolean;
  apiVersion: string;
  minClientVersion: string;
  message?: string;
}

export function VersionCheck() {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    checkApiVersion().then(setVersionInfo).catch(() => {
      // Silently fail - version check is not critical
      setVersionInfo(null);
    });
  }, []);

  if (!versionInfo || versionInfo.compatible || dismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 max-w-md bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg shadow-lg p-4 z-50">
      <div className="flex items-start gap-3">
        <div className="text-yellow-600 dark:text-yellow-400 mt-0.5">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
            Version Mismatch Detected
          </h3>
          <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
            {versionInfo.message || `Your client version (v${CLIENT_VERSION}) may not be compatible with the API (v${versionInfo.apiVersion}).`}
          </p>
          <div className="flex items-center gap-2 mt-3 text-xs text-yellow-600 dark:text-yellow-400">
            <span>Client: v{CLIENT_VERSION}</span>
            <span>•</span>
            <span>API: v{versionInfo.apiVersion}</span>
            <span>•</span>
            <span>Required: ≥ v{versionInfo.minClientVersion}</span>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-yellow-600 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 rounded p-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/**
 * Hook to check version on mount and log to console
 */
export function useVersionCheck() {
  useEffect(() => {
    checkApiVersion().then((info) => {
      if (!info.compatible) {
        console.warn(
          `[API Version] Client v${CLIENT_VERSION} may not be compatible with API v${info.apiVersion}. ` +
          `Requires client >= v${info.minClientVersion}.`
        );
      } else {
        console.log(`[API Version] Client v${CLIENT_VERSION} is compatible with API v${info.apiVersion}.`);
      }
    }).catch(() => {
      // Silently fail
    });
  }, []);
}
