/**
 * Tab Content Component
 * Renders the content of the active tab (non-BrowserView tabs only)
 */

import { Tab } from '../../services';

interface TabContentProps {
  tab: Tab;
}

export function TabContent({ tab }: TabContentProps) {
  // If this tab has a BrowserView, don't render anything (it's rendered by main process)
  if (tab.browserViewId) {
    return null;
  }

  switch (tab.type) {
    case 'overview':
      return (
        <div className="h-full">
          {/* Dashboard content will be rendered by parent */}
          {tab.content}
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
