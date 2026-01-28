/**
 * App Context - Provider for global app state including provider type and feature flags
 */

import { createContext, useContext, type ReactNode } from 'react'
import { type ProviderProfile, type FeatureFlags, getFeatureFlagsForType } from '../types'

interface AppContextValue {
  profile: ProviderProfile | null
  featureFlags: FeatureFlags
  setProfile: (profile: ProviderProfile) => void
}

const AppContext = createContext<AppContextValue | undefined>(undefined)

interface AppProviderProps {
  children: ReactNode
  initialProfile?: ProviderProfile | null
}

export function AppProvider({ children, initialProfile = null }: AppProviderProps) {
  // For now, we'll use a default service provider profile
  // In production, this would come from API/auth
  const profile: ProviderProfile | null = initialProfile || {
    id: '1',
    name: 'Prestador de Serviços',
    type: 'service_provider',
    email: 'provider@example.com',
    phone: null,
  }

  const featureFlags = profile ? getFeatureFlagsForType(profile.type) : getFeatureFlagsForType('service_provider')

  const setProfile = (newProfile: ProviderProfile) => {
    // In a real app, this would update state and potentially persist to storage/API
    console.log('Setting profile:', newProfile)
  }

  return (
    <AppContext.Provider value={{ profile, featureFlags, setProfile }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
