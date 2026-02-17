/**
 * Tab Navigation Component
 * Displays and manages application tabs
 */

import { X, Server, Folder, Terminal } from 'lucide-react';
import { Tab } from '../../services';

interface TabNavigationProps {
  tabs: Tab[];
  activeTabId: string;
  onTabClick: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
}

export function TabNavigation({ tabs, activeTabId, onTabClick, onTabClose }: TabNavigationProps) {
  const getIcon = (tab: Tab) => {
    if (tab.iconName === 'server') return <Server className="w-4 h-4" />;
    if (tab.iconName === 'terminal') return <Terminal className="w-4 h-4" />;
    if (tab.iconName === 'folder') return <Folder className="w-4 h-4" />;
    return null;
  };

  return (
    <div className="flex items-center space-x-1 bg-black/20 border-b border-white/5 px-4">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`group flex items-center space-x-2 px-3 py-2 rounded-t-lg transition cursor-pointer border-b-2 ${
            activeTabId === tab.id
              ? 'bg-white/5 border-white/20'
              : 'bg-transparent border-transparent hover:bg-white/[0.02] hover:border-white/5'
          }`}
          onClick={() => onTabClick(tab.id)}
        >
          {/* Icon */}
          {tab.iconName && (
            <span className={activeTabId === tab.id ? 'text-white/60' : 'text-white/40'}>
              {getIcon(tab)}
            </span>
          )}

          {/* Title */}
          <span
            className={`text-sm whitespace-nowrap ${
              activeTabId === tab.id ? 'text-white/90' : 'text-white/50'
            }`}
          >
            {tab.title}
          </span>

          {/* Close Button */}
          {tab.closable && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onTabClose(tab.id);
              }}
              className={`p-0.5 rounded transition ${
                activeTabId === tab.id
                  ? 'opacity-100 hover:bg-white/10 text-white/60 hover:text-white/80'
                  : 'opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-white/10 text-white/40 hover:text-white/60'
              }`}
              aria-label={`Close ${tab.title}`}
              title={`Close ${tab.title}`}
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      ))}

      {/* Tab Context Menu (hidden by default, shown on right-click) */}
      {/* TODO: Implement context menu for "Close Other Tabs", "Close All", etc. */}
    </div>
  );
}
