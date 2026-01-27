import { useState, useEffect, useCallback } from "react";

const URL_HISTORY_KEY = "apiUrlHistory";
const MAX_HISTORY_ITEMS = 10;

export interface UrlHistoryItem {
  url: string;
  timestamp: number;
  lastUsed?: number;
}

export const useUrlHistory = () => {
  const [history, setHistory] = useState<UrlHistoryItem[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    const loadHistory = () => {
      try {
        const saved = localStorage.getItem(URL_HISTORY_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as UrlHistoryItem[];
          // Sort by lastUsed or timestamp, most recent first
          const sorted = parsed.sort((a, b) => {
            const aTime = a.lastUsed || a.timestamp;
            const bTime = b.lastUsed || b.timestamp;
            return bTime - aTime;
          });
          setHistory(sorted.slice(0, MAX_HISTORY_ITEMS));
        }
      } catch (error) {
        console.error("Failed to load URL history:", error);
        setHistory([]);
      }
    };
    loadHistory();
  }, []);

  // Save history to localStorage whenever it changes
  const saveHistory = useCallback((newHistory: UrlHistoryItem[]) => {
    try {
      localStorage.setItem(URL_HISTORY_KEY, JSON.stringify(newHistory));
      setHistory(newHistory);
    } catch (error) {
      console.error("Failed to save URL history:", error);
    }
  }, []);

  // Add a URL to history
  const addToHistory = useCallback((url: string) => {
    if (!url || url.trim() === "") return;

    const trimmedUrl = url.trim();
    const now = Date.now();

    setHistory(currentHistory => {
      // Check if URL already exists
      const existingIndex = currentHistory.findIndex(item => item.url === trimmedUrl);

      let newHistory: UrlHistoryItem[];

      if (existingIndex >= 0) {
        // Update existing item's lastUsed timestamp
        newHistory = [...currentHistory];
        newHistory[existingIndex] = {
          ...newHistory[existingIndex],
          lastUsed: now
        };
      } else {
        // Add new item
        const newItem: UrlHistoryItem = {
          url: trimmedUrl,
          timestamp: now,
          lastUsed: now
        };
        newHistory = [newItem, ...currentHistory];
      }

      // Sort by lastUsed/timestamp and limit to max items
      newHistory.sort((a, b) => {
        const aTime = a.lastUsed || a.timestamp;
        const bTime = b.lastUsed || b.timestamp;
        return bTime - aTime;
      });
      newHistory = newHistory.slice(0, MAX_HISTORY_ITEMS);

      // Save to localStorage
      saveHistory(newHistory);
      return newHistory;
    });
  }, [saveHistory]);

  // Remove a specific URL from history
  const removeFromHistory = useCallback((url: string) => {
    setHistory(currentHistory => {
      const newHistory = currentHistory.filter(item => item.url !== url);
      saveHistory(newHistory);
      return newHistory;
    });
  }, [saveHistory]);

  // Clear all history
  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(URL_HISTORY_KEY);
    } catch (error) {
      console.error("Failed to clear URL history:", error);
    }
  }, []);

  // Format timestamp for display
  const formatTimestamp = useCallback((timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 7) {
      return new Date(timestamp).toLocaleDateString();
    } else if (days > 0) {
      return days === 1 ? "Yesterday" : `${days} days ago`;
    } else if (hours > 0) {
      return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
    } else if (minutes > 0) {
      return minutes === 1 ? "1 minute ago" : `${minutes} minutes ago`;
    } else {
      return "Just now";
    }
  }, []);

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory,
    formatTimestamp
  };
};