/**
 * Navigation Hook
 *
 * Simple navigation hook for the app.
 * Uses a callback-based navigation system.
 */

import React, { useContext } from 'react';

type NavigateFunction = (view: string, options?: { state?: unknown }) => void;

const NavigationContext = React.createContext<NavigateFunction>(() => {});

interface NavigationProviderProps {
  children: React.ReactNode;
  onNavigate: NavigateFunction;
}

export function NavigationProvider({ children, onNavigate }: NavigationProviderProps) {
  return (
    <NavigationContext.Provider value={onNavigate}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigate(): NavigateFunction {
  const navigate = useContext(NavigationContext);
  if (!navigate) {
    throw new Error('useNavigate must be used within a NavigationProvider or you need to pass onViewChange manually');
  }
  return navigate;
}
