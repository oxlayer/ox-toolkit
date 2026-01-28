import { useEffect, useState, createContext, useContext, type ReactNode } from 'react'
import { initKeycloak, isAuthenticated as keycloakIsAuthenticated, login, logout, setupTokenRefresh, getUserInfo } from '../lib'

interface AuthContextType {
  isAuthenticated: boolean
  isInitialized: boolean
  isLoading: boolean
  user: ReturnType<typeof getUserInfo>
  login: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const [user, setUser] = useState(getUserInfo())

  useEffect(() => {
    let mounted = true

    async function initializeAuth() {
      try {
        console.log('[Auth] Initializing Keycloak...')
        const auth = await initKeycloak()

        if (!mounted) return

        setIsInitialized(true)
        setIsLoading(false)
        setAuthenticated(auth || keycloakIsAuthenticated())
        setUser(getUserInfo())

        console.log('[Auth] Keycloak initialized', {
          isInitialized: true,
          authenticated: auth || keycloakIsAuthenticated(),
        })

        if (auth || keycloakIsAuthenticated()) {
          setupTokenRefresh()
        }
      } catch (error) {
        console.error('[Auth] Failed to initialize Keycloak:', error)
        if (mounted) {
          setIsInitialized(true)
          setIsLoading(false)
          setAuthenticated(false)
        }
      }
    }

    initializeAuth()

    return () => {
      mounted = false
    }
  }, [])

  const handleLogin = async () => {
    await login()
  }

  const handleLogout = async () => {
    await logout()
    setAuthenticated(false)
    setUser(undefined)
  }

  const value: AuthContextType = {
    isAuthenticated: authenticated,
    isInitialized,
    isLoading,
    user,
    login: handleLogin,
    logout: handleLogout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
