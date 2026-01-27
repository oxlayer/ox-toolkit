import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { initKeycloak, login, logout, getToken, getOrganizationId, getOrganizations, getUserInfo, setupTokenRefresh, keycloak } from '../lib/keycloak';

interface AuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    token: string | undefined;
    organizationId: string | null;
    organizations: Array<{ id: string; name: string }> | null;
    userInfo: any;
    login: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [token, setToken] = useState<string | undefined>(undefined);
    const [organizationId, setOrganizationId] = useState<string | null>(null);
    const [organizations, setOrganizations] = useState<Array<{ id: string; name: string }> | null>(null);
    const [userInfo, setUserInfo] = useState<any>(null);

    useEffect(() => {
        const initializeAuth = async () => {
            try {
                // Force re-initialization check after redirect
                const authenticated = await initKeycloak();
                const currentToken = getToken();

                // If no token, definitely not authenticated
                const isReallyAuthenticated = authenticated && !!currentToken;

                setIsAuthenticated(isReallyAuthenticated);

                if (isReallyAuthenticated) {
                    setToken(currentToken);
                    setOrganizationId(getOrganizationId());
                    setOrganizations(getOrganizations());
                    setUserInfo(getUserInfo());
                    setupTokenRefresh();
                } else {
                    // Not authenticated after init
                    setIsAuthenticated(false);
                    setToken(undefined);
                    setOrganizationId(null);
                    setUserInfo(null);
                }
            } catch (error) {
                console.error('Failed to initialize authentication:', error);
                setIsAuthenticated(false);
                setToken(undefined);
                setOrganizationId(null);
                setUserInfo(null);
            } finally {
                setIsLoading(false);
            }
        };

        // Always initialize on mount
        initializeAuth();

        // Set up Keycloak event listeners
        const onAuthSuccess = () => {
            setIsAuthenticated(true);
            setToken(getToken());
            setOrganizationId(getOrganizationId());
            setOrganizations(getOrganizations());
            setUserInfo(getUserInfo());
            setupTokenRefresh();
        };

        const onAuthLogout = () => {
            setIsAuthenticated(false);
            setToken(undefined);
            setOrganizationId(null);
            setOrganizations(null);
            setUserInfo(null);
        };

        const onTokenExpired = () => {
            setIsAuthenticated(false);
            setToken(undefined);
            setOrganizationId(null);
            setOrganizations(null);
            setUserInfo(null);
        };

        keycloak.onAuthSuccess = onAuthSuccess;
        keycloak.onAuthLogout = onAuthLogout;
        keycloak.onTokenExpired = onTokenExpired;

        // Listen for logout requests from API service
        const handleLogoutRequired = () => {
            // Just update state, don't call logout again (it would redirect)
            setIsAuthenticated(false);
            setToken(undefined);
            setOrganizationId(null);
            setOrganizations(null);
            setUserInfo(null);
        };

        window.addEventListener('keycloak-logout-required', handleLogoutRequired);

        // Cleanup function
        return () => {
            window.removeEventListener('keycloak-logout-required', handleLogoutRequired);
            keycloak.onAuthSuccess = undefined;
            keycloak.onAuthLogout = undefined;
            keycloak.onTokenExpired = undefined;
        };
    }, []); // Empty deps - run once on mount

    const handleLogin = async () => {
        try {
            await login();
            // After login, Keycloak will redirect, so we don't need to update state here
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    };

    const handleLogout = async () => {
        try {
            // Update state immediately before logout redirects
            setIsAuthenticated(false);
            setToken(undefined);
            setOrganizationId(null);
            setOrganizations(null);
            setUserInfo(null);

            // Call logout (this will redirect, so state update above ensures UI updates immediately)
            await logout();
        } catch (error) {
            console.error('Logout failed:', error);
            // Even if logout fails, ensure state is cleared
            setIsAuthenticated(false);
            setToken(undefined);
            setOrganizationId(null);
            setOrganizations(null);
            setUserInfo(null);
            throw error;
        }
    };

    // Always provide a value to prevent undefined context
    const contextValue: AuthContextType = {
        isAuthenticated,
        isLoading,
        token,
        organizationId,
        organizations,
        userInfo,
        login: handleLogin,
        logout: handleLogout,
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

