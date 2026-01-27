/**
 * Auth Required Context
 *
 * Manages the state of the auth required modal.
 * Allows any component to trigger the modal for features that require authentication.
 */

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { AuthRequiredModal, type AuthRequiredFeature } from '@/components/auth/AuthRequiredModal';

interface AuthRequiredContextValue {
    /**
     * Show the auth required modal for a specific feature
     */
    requireAuth: (feature: AuthRequiredFeature) => void;
}

const AuthRequiredContext = createContext<AuthRequiredContextValue | undefined>(undefined);

export function useAuthRequired() {
    const context = useContext(AuthRequiredContext);
    if (!context) {
        throw new Error('useAuthRequired must be used within AuthRequiredProvider');
    }
    return context;
}

interface AuthRequiredProviderProps {
    children: ReactNode;
}

export function AuthRequiredProvider({ children }: AuthRequiredProviderProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [feature, setFeature] = useState<AuthRequiredFeature>('general');

    const requireAuth = useCallback((feat: AuthRequiredFeature) => {
        setFeature(feat);
        setIsOpen(true);
    }, []);

    const handleClose = useCallback(() => {
        setIsOpen(false);
    }, []);

    return (
        <AuthRequiredContext.Provider value={{ requireAuth }}>
            {children}
            {isOpen && <AuthRequiredModal feature={feature} onClose={handleClose} />}
        </AuthRequiredContext.Provider>
    );
}
