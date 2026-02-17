/**
 * Tab Content Component
 * Renders the content of the active tab (non-BrowserView tabs only)
 */

import { Tab } from '../../services';

interface TabContentProps {
  tab: Tab;
}

export function TabContent({ tab }: TabContentProps) {
  // Debug logging
  console.log('[TabContent] Rendering tab:', {
    id: tab.id,
    type: tab.type,
    title: tab.title,
    browserViewId: tab.browserViewId,
    url: tab.url,
  });

  // If this tab has a BrowserView, show a placeholder message
  // The actual BrowserView is rendered by the main process
  if (tab.browserViewId) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-white/5 rounded-2xl flex items-center justify-center">
            <svg className="w-8 h-8 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-white/90">{tab.title}</h3>
            <p className="text-sm text-white/50 font-mono">{tab.url}</p>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-white/40 max-w-md">
              Loading embedded browser view...
            </p>
            <a
              href={`http://${tab.url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition text-sm text-white/70"
            >
              <span>Open in External Browser</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    );
  }

  switch (tab.type) {
    case 'overview':
      return (
        <div className="h-full">
          {/* Dashboard content will be rendered by parent */}
          {tab.content}
        </div>
      );

    case 'service':
      // Service tabs without BrowserView - show fallback UI
      return (
        <div className="h-full flex flex-col items-center justify-center p-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-white/5 rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-white/90">{tab.title}</h3>
              <p className="text-sm text-white/50 font-mono">{tab.url}</p>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-white/40 max-w-md">
                The embedded browser view is not available. You can open this service in an external browser.
              </p>
              <a
                href={`http://${tab.url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition text-sm text-white/70"
              >
                <span>Open in External Browser</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      );

    case 'project':
      return (
        <div className="h-full">
          {tab.content || (
            <div className="flex items-center justify-center h-full">
              <p className="text-white/40">Project content not available</p>
            </div>
          )}
        </div>
      );

    case 'logs':
      return (
        <div className="h-full overflow-auto">
          {tab.content || (
            <div className="flex items-center justify-center h-full">
              <p className="text-white/40">Logs not available</p>
            </div>
          )}
        </div>
      );

    default:
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-white/40">Unknown tab type</p>
        </div>
      );
  }
}
