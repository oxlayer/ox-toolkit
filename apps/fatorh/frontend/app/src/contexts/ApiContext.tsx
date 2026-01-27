import { createContext, useState, useEffect, useContext, useCallback, useRef } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { useDemoMode } from "../hooks/useDemoMode";
import { useAgentServers, type AgentServer } from "./AgentServersContext";
import { useProject } from "./ProjectContext";

type ConnectionStatus =
  | "connected"
  | "reconnecting"
  | "http-only"
  | "disconnected"
  | "connecting"
  | "initial";

interface ApiContextType {
  apiUrl: string;
  setApiUrl: (url: string) => void;
  connectionStatus: ConnectionStatus;
  lastError: string | null;
  wsBaseUrl: string;
  reconnect: () => void;
  hasConnectedOnce: boolean;
  activeServerId: string | null;
  activeServer: AgentServer | null;
  selectServer: (serverId: string | null) => void;
  customUrl: string;
}

// The backend uses these ports in preference order:
// 3141 - Default port (inspired by π)
// 4310 - Secondary port (A.I.O - All In One)
// 1337 - Third option (elite)
// 4242 - Fourth option
// 4300-4400 - Fallback port range
const DEFAULT_API_URL = "http://localhost:3141";
const CUSTOM_API_STORAGE_KEY = "voltagent_custom_api_url";
const ACTIVE_SERVER_STORAGE_KEY = "voltagent_active_agent_servers";

// Helper function to normalize URLs - removes trailing slash character
const normalizeUrl = (url: string): string => {
  return url.endsWith("/") ? url.slice(0, -1) : url;
};

const ApiContext = createContext<ApiContextType>({
  apiUrl: DEFAULT_API_URL,
  setApiUrl: () => { },
  connectionStatus: "initial",
  lastError: null,
  wsBaseUrl: "",
  reconnect: () => { },
  hasConnectedOnce: false,
  activeServerId: null,
  activeServer: null,
  selectServer: () => { },
  customUrl: DEFAULT_API_URL,
});

export const useApi = () => useContext(ApiContext);

export const ApiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Check if in demo mode
  const { isDemoMode } = useDemoMode();
  const { selectedProject } = useProject();
  const { servers } = useAgentServers();

  const initialCustomUrl = (() => {
    if (typeof window === "undefined") {
      return DEFAULT_API_URL;
    }
    const storedCustom = localStorage.getItem(CUSTOM_API_STORAGE_KEY);
    const legacy = localStorage.getItem("apiUrl");
    const candidate = storedCustom || legacy || DEFAULT_API_URL;
    return normalizeUrl(candidate);
  })();

  const initialActiveServerMap = (() => {
    if (typeof window === "undefined") {
      return {} as Record<string, string>;
    }
    try {
      const raw = localStorage.getItem(ACTIVE_SERVER_STORAGE_KEY);
      if (!raw) {
        return {} as Record<string, string>;
      }
      const parsed = JSON.parse(raw) as Record<string, string>;
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (error) {
      console.error("Failed to parse stored agent server selection:", error);
      return {} as Record<string, string>;
    }
  })();

  const [customUrl, setCustomUrlState] = useState<string>(initialCustomUrl);
  const [activeServerByProject, setActiveServerByProject] = useState<Record<string, string>>(initialActiveServerMap);
  const [apiUrl, setApiUrlInternal] = useState<string>(initialCustomUrl);

  const updateCustomUrl = useCallback((url: string) => {
    const normalized = normalizeUrl(url);
    setCustomUrlState((current) => {
      if (current === normalized) {
        return current;
      }
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(CUSTOM_API_STORAGE_KEY, normalized);
        } catch (error) {
          console.error("Failed to persist custom API URL:", error);
        }
      }
      return normalized;
    });
  }, []);

  const updateActiveServerSelection = useCallback(
    (updater: (prev: Record<string, string>) => Record<string, string>) => {
      setActiveServerByProject((prev) => {
        const next = updater(prev);
        if (next === prev) {
          return prev;
        }
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(ACTIVE_SERVER_STORAGE_KEY, JSON.stringify(next));
          } catch (error) {
            console.error("Failed to persist agent server selection:", error);
          }
        }
        return next;
      });
    },
    [],
  );

  const activeServerId = selectedProject ? activeServerByProject[selectedProject] ?? null : null;
  const activeServer = activeServerId ? servers.find((server) => server.id === activeServerId) ?? null : null;

  // Derive WebSocket URL from API URL
  const wsBaseUrl = apiUrl.replace(/^http/, "ws");
  const wsUrl = `${wsBaseUrl}/ws`;

  // Start with "initial" status or "connected" if in demo mode
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    isDemoMode ? "connected" : "initial",
  );
  const [lastError, setLastError] = useState<string | null>(null);
  const [httpStatus, setHttpStatus] = useState<"unknown" | "ok" | "error">(
    isDemoMode ? "ok" : "unknown",
  );
  const [hasConnectedOnce, setHasConnectedOnce] = useState(isDemoMode);
  const hasConnectedOnceRef = useRef(isDemoMode);

  const applyApiUrlChange = useCallback(
    (nextUrl: string) => {
      const normalized = normalizeUrl(nextUrl);
      setApiUrlInternal((current) => {
        if (current === normalized) {
          return current;
        }
        hasConnectedOnceRef.current = false;
        setHasConnectedOnce(false);
        return normalized;
      });
    },
    [],
  );

  useEffect(() => {
    if (!selectedProject) {
      return;
    }

    if (activeServerId && !activeServer) {
      updateActiveServerSelection((prev) => {
        if (!prev[selectedProject]) {
          return prev;
        }
        const next = { ...prev };
        delete next[selectedProject];
        return next;
      });
      applyApiUrlChange(customUrl);
    }
  }, [
    selectedProject,
    activeServerId,
    activeServer,
    customUrl,
    updateActiveServerSelection,
    applyApiUrlChange,
  ]);

  useEffect(() => {
    const nextUrl = normalizeUrl(activeServer?.url ?? customUrl);
    if (nextUrl !== apiUrl) {
      applyApiUrlChange(nextUrl);
    }
  }, [activeServer?.url, customUrl, apiUrl, applyApiUrlChange]);

  useEffect(() => {
    if (!selectedProject) {
      return;
    }

    const normalizedApi = normalizeUrl(apiUrl);
    const matchingServer = servers.find(
      (server) => normalizeUrl(server.url) === normalizedApi && normalizedApi !== "",
    );

    if (matchingServer) {
      updateActiveServerSelection((prev) => {
        if (prev[selectedProject] === matchingServer.id) {
          return prev;
        }
        return { ...prev, [selectedProject]: matchingServer.id };
      });
      return;
    }

    if (activeServerId) {
      updateActiveServerSelection((prev) => {
        if (!prev[selectedProject]) {
          return prev;
        }
        const next = { ...prev };
        delete next[selectedProject];
        return next;
      });
    }
  }, [
    apiUrl,
    servers,
    selectedProject,
    updateActiveServerSelection,
    activeServerId,
  ]);

  // Skip WebSocket if in demo mode
  const { readyState, sendMessage } = useWebSocket(isDemoMode ? null : wsUrl, {
    shouldReconnect: (_closeEvent: CloseEvent) => true,
    reconnectInterval: 1000,
    reconnectAttempts: 10000,
    onOpen: () => {
      if (!hasConnectedOnceRef.current) {
        hasConnectedOnceRef.current = true;
        setHasConnectedOnce(true);
      }
      setLastError(null);
    },
    onError: (event) => {
      setLastError(`WebSocket error: ${event?.message ?? "connection failed"}`);
    },
  });

  // In demo mode, always show as connected
  useEffect(() => {
    if (isDemoMode) {
      setConnectionStatus("connected");
      if (!hasConnectedOnceRef.current) {
        hasConnectedOnceRef.current = true;
        setHasConnectedOnce(true);
      }
      setLastError(null);
    }
  }, [isDemoMode]);

  // Periodically check HTTP availability by calling /agents
  useEffect(() => {
    if (isDemoMode) return;

    let cancelled = false;
    let inFlight = false;
    const checkHttp = async () => {
      if (inFlight || cancelled) return;
      inFlight = true;
      try {
        const response = await fetch(`${apiUrl}/agents`, {
          method: "GET",
          headers: { "accept": "application/json" },
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        if (!cancelled) {
          setHttpStatus("ok");
          setLastError((prev) =>
            prev && prev.toLowerCase().includes("http") ? null : prev,
          );
        }
      } catch (error) {
        if (!cancelled) {
          setHttpStatus("error");
          setLastError(
            `HTTP connectivity failed: ${error instanceof Error ? error.message : "unknown error"
            }`,
          );
        }
      } finally {
        inFlight = false;
      }
    };

    // Initial check and interval
    void checkHttp();
    const interval = setInterval(checkHttp, 15000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [apiUrl, isDemoMode]);

  // Determine connection status from HTTP + WebSocket state
  useEffect(() => {
    if (isDemoMode) return;

    if (readyState === ReadyState.OPEN) {
      localStorage.setItem("hasOpenedServerBefore", "true");
      setConnectionStatus("connected");
      if (httpStatus === "unknown") {
        setHttpStatus("ok");
      }
      return;
    }

    if (httpStatus === "unknown") {
      setConnectionStatus((current) => {
        if (current === "http-only") {
          return current;
        }
        return hasConnectedOnceRef.current ? "reconnecting" : "connecting";
      });
      return;
    }

    if (httpStatus === "error") {
      setConnectionStatus("disconnected");
      return;
    }

    if (readyState === ReadyState.CONNECTING || readyState === ReadyState.CLOSING) {
      setConnectionStatus(hasConnectedOnceRef.current ? "reconnecting" : "connecting");
      return;
    }

    if (readyState === ReadyState.CLOSED || readyState === ReadyState.UNINSTANTIATED) {
      if (httpStatus === "ok" && !hasConnectedOnceRef.current) {
        setConnectionStatus("http-only");
        setLastError("WebSocket unavailable; falling back to HTTP polling.");
        return;
      }

      if (httpStatus === "ok") {
        setConnectionStatus("reconnecting");
        return;
      }

      setConnectionStatus("connecting");
      return;
    }

    setConnectionStatus(hasConnectedOnceRef.current ? "reconnecting" : "connecting");
  }, [httpStatus, readyState, isDemoMode]);

  // Save API URL to localStorage when it changes
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      localStorage.setItem("apiUrl", apiUrl);
      if (!activeServer) {
        localStorage.setItem(CUSTOM_API_STORAGE_KEY, apiUrl);
      }
    } catch (error) {
      console.error("Failed to persist API URL:", error);
    }
  }, [apiUrl, activeServer]);

  // URL change function - triggers connection reset when URL changes
  const setApiUrl = useCallback(
    (url: string) => {
      const normalizedUrl = normalizeUrl(url);
      updateCustomUrl(normalizedUrl);
      if (selectedProject) {
        updateActiveServerSelection((prev) => {
          if (!prev[selectedProject]) {
            return prev;
          }
          const next = { ...prev };
          delete next[selectedProject];
          return next;
        });
      }
      applyApiUrlChange(normalizedUrl);
    },
    [selectedProject, updateCustomUrl, updateActiveServerSelection, applyApiUrlChange],
  );

  const selectServer = useCallback(
    (serverId: string | null) => {
      if (!selectedProject) {
        return;
      }

      if (!serverId) {
        updateActiveServerSelection((prev) => {
          if (!prev[selectedProject]) {
            return prev;
          }
          const next = { ...prev };
          delete next[selectedProject];
          return next;
        });
        applyApiUrlChange(customUrl);
        return;
      }

      const server = servers.find((item) => item.id === serverId);
      if (!server) {
        return;
      }

      updateCustomUrl(server.url);
      updateActiveServerSelection((prev) => {
        if (prev[selectedProject] === serverId) {
          return prev;
        }
        return { ...prev, [selectedProject]: serverId };
      });
      applyApiUrlChange(server.url);
    },
    [
      selectedProject,
      servers,
      updateActiveServerSelection,
      applyApiUrlChange,
      customUrl,
    ],
  );

  // Reconnect function - forces a reconnection attempt
  const reconnect = useCallback(() => {
    if (!isDemoMode) {
      setConnectionStatus(hasConnectedOnceRef.current ? "reconnecting" : "connecting");
      setHttpStatus("unknown");
      try {
        sendMessage("ping");
      } catch {
        // Ignore send failures; regular polling will recover status
      }
    }
  }, [isDemoMode, sendMessage]);

  return (
    <ApiContext.Provider
      value={{
        apiUrl,
        setApiUrl,
        connectionStatus,
        lastError,
        wsBaseUrl,
        reconnect,
        hasConnectedOnce,
        activeServerId,
        activeServer,
        selectServer,
        customUrl,
      }}
    >
      {children}
    </ApiContext.Provider>
  );
};
